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
 * Strict lateness rule:
 *   - There is NO grace period. If an employee is scheduled at 08:00 and
 *     arrives at 08:15, late_minutes = 15 — always.
 *   - Staying until 17:15 to "make up" the time does NOT remove the late flag.
 *
 * Early / late caps (early_time_in_minutes, late_time_out_minutes) are used
 * solely as zone-boundary buffers — they define how early someone may clock in
 * or how late they may clock out and still have the scan counted.
 */
class ProcessAttendanceLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private const TZ = 'Asia/Manila';

    public int $tries   = 3;
    public int $backoff = 5;

    public function __construct(private readonly int $attendanceLogId) {}

    // ─────────────────────────────────────────────────────────────────────────

    public function handle(): void
    {
        $log      = Attendance::find($this->attendanceLogId);
        $employee = $log?->employee;

        if (!$log || !$employee) {
            return;
        }

        $date    = Carbon::parse($log->captured_at)->setTimezone(self::TZ)->toDateString();
        $setting = AttendanceSetting::getDefault();

        // Load the existing record (if any) BEFORE computing.
        $existing = AttendanceRecord::where('employee_id', $employee->employee_id)
            ->where('date', $date)
            ->first();

        // ── Pull ALL raw logs for this employee on this date ──────────────────
        $dayStart = Carbon::parse($date, self::TZ)->startOfDay()->utc();
        $dayEnd   = Carbon::parse($date, self::TZ)->endOfDay()->utc();

        $rawLogs = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('captured_at', [$dayStart, $dayEnd])
            ->orderBy('captured_at')
            ->get();

        // ── Compute & persist ─────────────────────────────────────────────────
        $computed = $this->computeRecord($employee, $date, $rawLogs, $setting, $existing);

        $record = AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->employee_id, 'date' => $date],
            $computed
        );

        // ── Reload with relationships for broadcasting ─────────────────────────
        $record->load([
            'employee:employee_id,employee_basic_info_id,work_id,avatar_url',
            'employee.basicInfo:employee_basic_info_id,first_name,last_name,middle_name',
        ]);

        broadcast(new AttendanceRecordUpdated($record))->toOthers();
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function computeRecord(
        Employee          $employee,
        string            $date,
        Collection        $rawLogs,
        AttendanceSetting $setting,
        ?AttendanceRecord $existing,
    ): array {
        $tz = self::TZ;

        $scheduledTimeIn   = $employee->work_schedule_start;
        $scheduledBreakOut = $employee->break_start;
        $scheduledBreakIn  = $employee->break_end;
        $scheduledTimeOut  = $employee->work_schedule_end;

        $anchor = fn(string $time) => Carbon::parse("{$date} {$time}", $tz);

        $timeInAnchor   = $scheduledTimeIn   ? $anchor($scheduledTimeIn)   : null;
        $breakOutAnchor = $scheduledBreakOut ? $anchor($scheduledBreakOut) : null;
        $breakInAnchor  = $scheduledBreakIn  ? $anchor($scheduledBreakIn)  : null;
        $timeOutAnchor  = $scheduledTimeOut  ? $anchor($scheduledTimeOut)  : null;

        // ── Zone-based scan assignment ────────────────────────────────────────
        //
        // The day is divided into non-overlapping zones using the schedule
        // anchors as hard boundaries. Every scan falls into exactly ONE zone,
        // so a 1:54 PM scan can never be misread as time_in.
        //
        //   Zone 1 — TIME_IN   : [time_in - early_cap]  →  break_out anchor
        //   Zone 2 — BREAK_OUT : [break_out anchor]      →  break_in anchor
        //   Zone 3 — BREAK_IN  : [break_in anchor]       →  time_out anchor
        //   Zone 4 — TIME_OUT  : [time_out anchor]        →  time_out + late cap

        $endOfDay = Carbon::parse("{$date} 23:59:59", $tz);

        $zone1End = $breakOutAnchor ?? $timeOutAnchor ?? $endOfDay;
        $zone2End = $breakInAnchor  ?? $timeOutAnchor ?? $endOfDay;
        $zone3End = $timeOutAnchor  ?? $endOfDay;

        // ── Sort raw logs into Carbon timestamps ──────────────────────────────
        $sorted = $rawLogs
            ->map(fn($l) => Carbon::parse($l->captured_at)->setTimezone($tz))
            ->sortBy(fn($c) => $c->timestamp)
            ->values();

        // ── Slot-locking ──────────────────────────────────────────────────────
        // Once a slot is written to the DB it is never overwritten.
        // A 7:56 AM clock-in stays 7:56 AM even on subsequent scans.

        $existingTimeIn   = $existing?->time_in;
        $existingBreakOut = $existing?->break_out;
        $existingBreakIn  = $existing?->break_in;
        $existingTimeOut  = $existing?->time_out;

        // ── Zone 1: time_in ───────────────────────────────────────────────────
        if ($existingTimeIn !== null) {
            $timeInCarbon = Carbon::parse("{$date} {$existingTimeIn}", $tz);
        } else {
            $zone1Start = $timeInAnchor
                ? $timeInAnchor->copy()->subMinutes($setting->early_time_in_minutes)
                : $endOfDay;

            $timeInCarbon = $sorted
                ->filter(fn($c) => $c->gte($zone1Start) && $c->lt($zone1End))
                ->first();
        }

        // ── Zone 2: break_out ─────────────────────────────────────────────────
        $breakOutCarbon = null;

        if ($existingBreakOut !== null) {
            $breakOutCarbon = Carbon::parse("{$date} {$existingBreakOut}", $tz);
        } elseif ($breakOutAnchor && $breakInAnchor && $timeInCarbon) {
            $breakOutCarbon = $sorted
                ->filter(fn($c) => $c->gte($breakOutAnchor) && $c->lt($zone2End))
                ->last();
        }

        // ── Zone 3: break_in ──────────────────────────────────────────────────
        $breakInCarbon = null;

        if ($existingBreakIn !== null) {
            $breakInCarbon = Carbon::parse("{$date} {$existingBreakIn}", $tz);
        } elseif ($breakInAnchor) {
            // Zone-3 scans always go to break_in — never promoted to time_in
            // even if the morning scan was missed.
            $breakInCarbon = $sorted
                ->filter(fn($c) => $c->gte($breakInAnchor) && $c->lt($zone3End))
                ->first();
        }

        // ── Zone 4: time_out ──────────────────────────────────────────────────
        $timeOutCarbon = null;

        if ($existingTimeOut !== null) {
            $timeOutCarbon = Carbon::parse("{$date} {$existingTimeOut}", $tz);
        } elseif ($timeOutAnchor) {
            $zone4End      = $timeOutAnchor->copy()->addMinutes($setting->late_time_out_minutes);
            $timeOutCarbon = $sorted
                ->filter(fn($c) => $c->gte($timeOutAnchor) && $c->lte($zone4End))
                ->last();
        }

        // ── Late minutes — strict, no grace ───────────────────────────────────
        //
        //   08:00 scheduled + 08:15 actual  → late_minutes = 15
        //   08:00 scheduled + 07:50 actual  → late_minutes = 0  (early)
        //   Leaving at 17:15 does NOT cancel the late flag.
        $lateMinutes = null;
        if ($timeInCarbon && $timeInAnchor) {
            $diff        = (int) $timeInAnchor->diffInMinutes($timeInCarbon, false);
            $lateMinutes = max(0, $diff);
        }

        // ── Scheduled break duration ───────────────────────────────────────────
        $scheduledBreakDuration = ($breakOutAnchor && $breakInAnchor)
            ? (int) $breakOutAnchor->diffInMinutes($breakInAnchor)
            : 0;

        // ── Status & work minutes ──────────────────────────────────────────────
        //
        //  PRESENT  — time_in + time_out (break irrelevant)
        //  PRESENT  — time_in OR break_in, still within work window
        //  HALF_DAY — time_in + break_out, no time_out, window over
        //  ABSENT   — time_in only, window over
        //  ABSENT   — break_in only, window over
        //  ABSENT   — anything else

        $workMinutes = null;
        $now         = Carbon::now(self::TZ);

        $withinWorkWindow = $timeOutAnchor
            && $now->lte($timeOutAnchor->copy()->addMinutes($setting->late_time_out_minutes));

        if ($timeInCarbon && $timeOutCarbon) {
            $status      = 'PRESENT';
            $workMinutes = max(0, (int) $timeInCarbon->diffInMinutes($timeOutCarbon) - $scheduledBreakDuration);

        } elseif (($timeInCarbon || $breakInCarbon) && $withinWorkWindow) {
            // Still inside the work window — treat as actively present
            $status = 'PRESENT';

        } elseif ($timeInCarbon && $breakOutCarbon && !$timeOutCarbon) {
            // Clocked in and went on break but never returned
            $status      = 'HALF_DAY';
            $workMinutes = (int) $timeInCarbon->diffInMinutes($breakOutCarbon);

        } elseif ($breakInCarbon && $timeOutCarbon && !$timeInCarbon) {
            // Missed the morning but worked the afternoon (break_in → time_out)
            $status      = 'HALF_DAY';
            $workMinutes = (int) $breakInCarbon->diffInMinutes($timeOutCarbon);

        } else {
            $status = 'ABSENT';
        }

        return [
            'scheduled_time_in'   => $scheduledTimeIn,
            'scheduled_break_out' => $scheduledBreakOut,
            'scheduled_break_in'  => $scheduledBreakIn,
            'scheduled_time_out'  => $scheduledTimeOut,
            'grace_minutes'       => 0,
            'time_in'             => $timeInCarbon?->format('H:i:s'),
            'break_out'           => $breakOutCarbon?->format('H:i:s'),
            'break_in'            => $breakInCarbon?->format('H:i:s'),
            'time_out'            => $timeOutCarbon?->format('H:i:s'),
            'late_minutes'        => $lateMinutes,
            'work_minutes'        => $workMinutes,
            'status'              => $status,
        ];
    }
}