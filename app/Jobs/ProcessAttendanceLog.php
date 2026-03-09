<?php

namespace App\Jobs;

use App\Events\AttendanceRecordUpdated;
use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * ProcessAttendanceLog
 *
 * Triggered every time a new Attendance raw log is stored.
 * Only processes the employee + date of the incoming log — never the full history.
 *
 * Steps:
 *   1. Load all raw logs for employee_id + date (PH time)
 *   2. Run the window-matching algorithm
 *   3. Upsert AttendanceRecord
 *   4. Broadcast AttendanceRecordUpdated so the frontend refreshes in real-time
 */
class ProcessAttendanceLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const TZ = 'Asia/Manila';

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(private readonly int $attendanceLogId)
    {
    }

    // ─────────────────────────────────────────────────────────────────────────

    public function handle(): void
    {
        $log = Attendance::find($this->attendanceLogId);
        $employee = $log?->employee;

        if (!$log || !$employee) {
            return;
        }

        $date = Carbon::parse($log->captured_at)->setTimezone(self::TZ)->toDateString();
        $setting = AttendanceSetting::getDefault();

        // ── Pull ALL raw logs for this employee on this date ──────────────────
        $dayStart = Carbon::parse($date, self::TZ)->startOfDay()->utc();
        $dayEnd = Carbon::parse($date, self::TZ)->endOfDay()->utc();

        $rawLogs = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('captured_at', [$dayStart, $dayEnd])
            ->orderBy('captured_at')
            ->get();

        // ── Compute record ─────────────────────────────────────────────────────
        $computed = $this->computeRecord($employee, $date, $rawLogs, $setting);

        if ($computed) {
            $record = AttendanceRecord::updateOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $date],
                $computed
            );
        } else {
            // No valid time_in found → mark or keep as ABSENT
            $record = AttendanceRecord::updateOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $date],
                $this->buildAbsent($employee, $date, $setting)
            );
        }

        // ── Reload with relationships for broadcasting ─────────────────────────
        $record->load([
            'employee:employee_id,employee_basic_info_id,work_id,avatar_url',
            'employee.basicInfo:employee_basic_info_id,first_name,last_name,middle_name',
        ]);

        // ── Broadcast real-time update ─────────────────────────────────────────
        broadcast(new AttendanceRecordUpdated($record))->toOthers();
    }

    // ─── Core computation (same algorithm, now isolated in a job) ─────────────

    private function computeRecord(Employee $employee, string $date, Collection $rawLogs, AttendanceSetting $setting): ?array
    {
        $tz = self::TZ;

        $scheduledTimeIn = $employee->work_schedule_start;
        $scheduledBreakOut = $employee->break_start;
        $scheduledBreakIn = $employee->break_end;
        $scheduledTimeOut = $employee->work_schedule_end;

        $anchor = fn(string $time) => Carbon::parse("{$date} {$time}", $tz);

        $timeInAnchor = $scheduledTimeIn ? $anchor($scheduledTimeIn) : null;
        $breakOutAnchor = $scheduledBreakOut ? $anchor($scheduledBreakOut) : null;
        $breakInAnchor = $scheduledBreakIn ? $anchor($scheduledBreakIn) : null;
        $timeOutAnchor = $scheduledTimeOut ? $anchor($scheduledTimeOut) : null;

        // ── Build acceptance windows ───────────────────────────────────────────
        $w = [];

        if ($timeInAnchor) {
            $w['time_in'] = [
                'from' => $timeInAnchor->copy()->subMinutes($setting->early_time_in_minutes),
                // Accept any scan up until break starts (or end of day if no break)
                'to' => $breakOutAnchor
                    ? $breakOutAnchor->copy()
                    : Carbon::parse("{$date} 23:59:59", $tz),
            ];
        }
        if ($breakOutAnchor) {
            $w['break_out'] = [
                'from' => $breakOutAnchor->copy()->subMinutes($setting->early_time_in_minutes),
                'to' => $breakOutAnchor->copy()->addMinutes($setting->break_in_grace_minutes),
            ];
        }
        if ($breakInAnchor) {
            $w['break_in'] = [
                'from' => $breakInAnchor->copy(),
                'to' => $breakInAnchor->copy()->addMinutes($setting->break_in_grace_minutes),
            ];
        }
        if ($timeOutAnchor) {
            $w['time_out'] = [
                'from' => $timeOutAnchor->copy(),
                'to' => $timeOutAnchor->copy()->addMinutes($setting->late_time_out_minutes),
            ];
        }

        // ── Map raw logs to Carbon timestamps ─────────────────────────────────
        $sorted = $rawLogs
            ->map(fn($l) => Carbon::parse($l->captured_at)->setTimezone($tz))
            ->sortBy(fn($c) => $c->timestamp)
            ->values();

        // time_in: earliest tap inside the time_in window
        $timeInCarbon = isset($w['time_in'])
            ? $sorted->first(fn($c) => $c->between($w['time_in']['from'], $w['time_in']['to']))
            : null;

        if (!$timeInCarbon) {
            return null; // No valid clock-in → caller will write ABSENT
        }

        // break_out: last tap inside the break_out window, strictly after time_in
        $breakOutCarbon = null;
        if (isset($w['break_out'])) {
            $breakOutCarbon = $sorted
                ->filter(fn($c) => $c->gt($timeInCarbon) && $c->between($w['break_out']['from'], $w['break_out']['to']))
                ->last();
        }

        // break_in: first tap inside the break_in window
        $breakInCarbon = null;
        if (isset($w['break_in'])) {
            $breakInCarbon = $sorted->first(fn($c) => $c->between($w['break_in']['from'], $w['break_in']['to']));
        }

        // time_out: last tap inside the time_out window
        $timeOutCarbon = null;
        if (isset($w['time_out'])) {
            $timeOutCarbon = $sorted
                ->filter(fn($c) => $c->between($w['time_out']['from'], $w['time_out']['to']))
                ->last();
        }

        // ── Late minutes ───────────────────────────────────────────────────────
        $lateMinutes = null;
        if ($timeInAnchor) {
            $deadline = $timeInAnchor->copy()->addMinutes($setting->time_in_grace_minutes);
            if ($timeInCarbon->gt($deadline)) {
                $lateMinutes = (int) $deadline->diffInMinutes($timeInCarbon);
            }
        }

        // ── Scheduled break duration ───────────────────────────────────────────
        $scheduledBreakDuration = ($breakOutAnchor && $breakInAnchor)
            ? (int) $breakOutAnchor->diffInMinutes($breakInAnchor)
            : 0;

        // ── Status & work minutes ──────────────────────────────────────────────
        $workMinutes = null;
        $status = 'HALF_DAY';

        if ($timeOutCarbon) {
            $status = 'PRESENT';
            $workMinutes = max(0, (int) $timeInCarbon->diffInMinutes($timeOutCarbon) - $scheduledBreakDuration);
        } elseif ($breakOutCarbon) {
            $status = 'HALF_DAY';
            $workMinutes = (int) $timeInCarbon->diffInMinutes($breakOutCarbon);
        }

        return [
            'scheduled_time_in' => $scheduledTimeIn,
            'scheduled_break_out' => $scheduledBreakOut,
            'scheduled_break_in' => $scheduledBreakIn,
            'scheduled_time_out' => $scheduledTimeOut,
            'grace_minutes' => $setting->time_in_grace_minutes,
            'time_in' => $timeInCarbon->format('H:i:s'),
            'break_out' => $breakOutCarbon?->format('H:i:s'),
            'break_in' => $breakInCarbon?->format('H:i:s'),
            'time_out' => $timeOutCarbon?->format('H:i:s'),
            'late_minutes' => $lateMinutes,
            'work_minutes' => $workMinutes,
            'status' => $status,
        ];
    }

    private function buildAbsent(Employee $employee, string $date, AttendanceSetting $setting): array
    {
        return [
            'scheduled_time_in' => $employee->work_schedule_start,
            'scheduled_break_out' => $employee->break_start,
            'scheduled_break_in' => $employee->break_end,
            'scheduled_time_out' => $employee->work_schedule_end,
            'grace_minutes' => $setting->time_in_grace_minutes,
            'time_in' => null,
            'break_out' => null,
            'break_in' => null,
            'time_out' => null,
            'late_minutes' => null,
            'work_minutes' => null,
            'status' => 'ABSENT',
        ];
    }
}