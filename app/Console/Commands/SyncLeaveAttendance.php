<?php

namespace App\Console\Commands;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use App\Models\LeaveApplication;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Console\Command;

/**
 * php artisan attendance:sync-leave
 *
 * Syncs ALL approved leave applications into attendance_records.
 *
 * For every approved leave application, every calendar day between
 * start_date and end_date (inclusive) is evaluated:
 *
 *   - If NO record exists yet          → create ON_LEAVE_WP / ON_LEAVE_NP
 *   - If an ABSENT record exists       → promote to ON_LEAVE_WP / ON_LEAVE_NP
 *   - If a PRESENT / HALF_DAY record   → leave it alone (employee showed up)
 *   - If already ON_LEAVE_WP/NP        → skip (nothing to do)
 *
 * Covers past dates, today, AND future dates within the leave period.
 *
 * Usage:
 *   php artisan attendance:sync-leave              # all approved leaves
 *   php artisan attendance:sync-leave --employee=5 # one employee
 *
 * Schedule (runs once daily to catch newly approved leaves):
 *   $schedule->command('attendance:sync-leave')
 *            ->dailyAt('00:05')
 *            ->timezone('Asia/Manila');
 */
class SyncLeaveAttendance extends Command
{
    protected $signature = 'attendance:sync-leave
                            {--employee= : Only sync for this employee_id}';

    protected $description = 'Backfill and pre-fill ON_LEAVE attendance records from approved leave applications';

    private const TZ = 'Asia/Manila';

    // Statuses that represent real attendance — never overwrite these
    private const REAL_STATUSES = ['PRESENT', 'HALF_DAY'];

    public function handle(): int
    {
        $query = LeaveApplication::where('status', 'Approved')
            ->whereNotNull('start_date')
            ->whereNotNull('end_date');

        if ($employeeId = $this->option('employee')) {
            $query->where('employee_id', $employeeId);
        }

        $leaves = $query->get();

        if ($leaves->isEmpty()) {
            $this->info('No approved leave applications found.');
            return self::SUCCESS;
        }

        $this->info("Processing {$leaves->count()} approved leave application(s)…");

        $created = 0;
        $promoted = 0;
        $skipped = 0;

        foreach ($leaves as $leave) {
            $employee = Employee::find($leave->employee_id);

            if (!$employee || !$employee->status) {
                $this->line("  Skipping employee #{$leave->employee_id} — not found or inactive.");
                continue;
            }

            $leaveStatus = $leave->is_with_pay ? 'ON_LEAVE_WP' : 'ON_LEAVE_NP';

            // Iterate every calendar day in the leave range (past + today + future)
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

                // ── Case 1: No record yet → create it ─────────────────────
                if (!$existing) {
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
                    $created++;
                    $this->line("  <fg=blue>CREATED</> {$employee->work_id} · {$date} → {$leaveStatus}");
                    continue;
                }

                // ── Case 2: Real attendance exists → never overwrite ───────
                if (in_array($existing->status, self::REAL_STATUSES, true)) {
                    $skipped++;
                    $this->line("  <fg=yellow>SKIPPED</> {$employee->work_id} · {$date} → already {$existing->status}");
                    continue;
                }

                // ── Case 3: Already a leave status → nothing to do ─────────
                if (in_array($existing->status, ['ON_LEAVE_WP', 'ON_LEAVE_NP'], true)) {
                    $skipped++;
                    continue;
                }

                // ── Case 4: ABSENT → promote to leave ─────────────────────
                $existing->update(['status' => $leaveStatus]);
                $promoted++;
                $this->line("  <fg=green>PROMOTED</> {$employee->work_id} · {$date} ABSENT → {$leaveStatus}");
            }
        }

        $this->newLine();
        $this->info("Done.");
        $this->table(
            ['Action', 'Count'],
            [
                ['Created (no prior record)', $created],
                ['Promoted (ABSENT → ON_LEAVE)', $promoted],
                ['Skipped (real attendance or already leave)', $skipped],
            ]
        );

        return self::SUCCESS;
    }
}