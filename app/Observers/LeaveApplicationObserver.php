<?php

namespace App\Observers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\LeaveApplication;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

/**
 * LeaveApplicationObserver
 *
 * Automatically syncs attendance_records whenever a leave application
 * is created, updated, or deleted — no manual artisan command needed.
 *
 * Triggers:
 *   ① A new leave is filed already Approved (rare, but handled)
 *   ② An existing leave is approved (status changes to "Approved")
 *   ③ An approved leave is disapproved / cancelled → reverts to ABSENT
 *   ④ An approved leave's dates are changed → re-syncs both old and new range
 */
class LeaveApplicationObserver
{
    private const TZ = 'Asia/Manila';
    private const REAL_STATUSES = ['PRESENT', 'HALF_DAY'];

    // ── created ───────────────────────────────────────────────────────────────

    public function created(LeaveApplication $leave): void
    {

        if ($leave->status === 'Approved') {
            $this->syncLeaveRange($leave);
        }
    }

    // ── updated ───────────────────────────────────────────────────────────────

    public function updated(LeaveApplication $leave): void
    {
        $statusChanged = $leave->wasChanged('status');
        $datesChanged = $leave->wasChanged('start_date') || $leave->wasChanged('end_date');
        $payChanged = $leave->wasChanged('is_with_pay');

        // ── Case 1: Just got approved ─────────────────────────────────────────
        if ($statusChanged && $leave->status === 'Approved') {
            $this->syncLeaveRange($leave);
            return;
        }

        // ── Case 2: Was approved, now disapproved / cancelled ─────────────────
        if ($statusChanged && $leave->getOriginal('status') === 'Approved') {
            $this->revertLeaveRange(
                $leave->employee_id,
                $leave->getOriginal('start_date'),
                $leave->getOriginal('end_date'),
            );
            return;
        }

        // ── Case 3: Still approved, but dates or pay type changed ─────────────
        if ($leave->status === 'Approved' && ($datesChanged || $payChanged)) {
            // Revert the OLD date range first
            if ($datesChanged) {
                $this->revertLeaveRange(
                    $leave->employee_id,
                    $leave->getOriginal('start_date'),
                    $leave->getOriginal('end_date'),
                );
            }
            // Then apply the NEW range
            $this->syncLeaveRange($leave);
        }
    }

    // ── deleted ───────────────────────────────────────────────────────────────

    public function deleted(LeaveApplication $leave): void
    {
        if ($leave->status === 'Approved') {
            $this->revertLeaveRange(
                $leave->employee_id,
                $leave->start_date,
                $leave->end_date,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Walk every calendar day in the leave range and upsert
     * ON_LEAVE_WP / ON_LEAVE_NP records — skipping real attendance.
     */
    private function syncLeaveRange(LeaveApplication $leave): void
    {
        if (!$leave->start_date || !$leave->end_date) {
            return;
        }

        $employee = Employee::find($leave->employee_id);
        if (!$employee || !$employee->status) {
            return;
        }

        $leaveStatus = $leave->is_with_pay ? 'ON_LEAVE_WP' : 'ON_LEAVE_NP';

        $period = CarbonPeriod::create(
            Carbon::parse($leave->start_date, self::TZ)->startOfDay(),
            Carbon::parse($leave->end_date, self::TZ)->startOfDay(),
        );

        foreach ($period as $carbon) {

            // ── Skip weekends ─────────────────────────────────────────────────
            if ($carbon->isWeekend()) {
                continue;
            }

            $date = $carbon->toDateString();

            $existing = AttendanceRecord::where('employee_id', $employee->employee_id)
                ->where('date', $date)
                ->first();

            // Real attendance — never overwrite
            if ($existing && in_array($existing->status, self::REAL_STATUSES, true)) {
                continue;
            }

            // Already correct — skip
            if ($existing && $existing->status === $leaveStatus) {
                continue;
            }

            if ($existing) {
                // Promote ABSENT (or wrong leave type) → correct leave status
                $existing->update(['status' => $leaveStatus]);
            } else {
                // No record yet — create it
                AttendanceRecord::create([
                    'employee_id' => $employee->employee_id,
                    'date' => $date,
                    'scheduled_time_in' => $employee->work_schedule_start,
                    'scheduled_break_out' => $employee->break_start,
                    'scheduled_break_in' => $employee->break_end,
                    'scheduled_time_out' => $employee->work_schedule_end,
                    'grace_minutes' => 0,
                    'time_in' => null,
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => null,
                    'work_minutes' => null,
                    'status' => $leaveStatus,
                ]);
            }
        }
    }

    /**
     * Revert all ON_LEAVE records in the range back to ABSENT.
     * Called when a leave is disapproved, deleted, or its dates change.
     * Real attendance (PRESENT / HALF_DAY) is never touched.
     */
    private function revertLeaveRange(
        int $employeeId,
        ?string $startDate,
        ?string $endDate,
    ): void {
        if (!$startDate || !$endDate) {
            return;
        }

        AttendanceRecord::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereIn('status', ['ON_LEAVE_WP', 'ON_LEAVE_NP'])
            ->whereRaw('DAYOFWEEK(date) NOT IN (1, 7)')
            ->update(['status' => 'ABSENT']);
    }
}