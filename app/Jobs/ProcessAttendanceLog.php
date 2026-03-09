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
 * Grace period snapshotting rule:
 *   - `grace_minutes` (time-in grace) is locked onto the record the moment
 *     time_in is first computed. Changing the setting afterwards does NOT
 *     retroactively alter the late_minutes of an already-recorded clock-in.
 *   - All other windows (break_in, break_out, time_out) always use the
 *     current setting, so they are affected by changes going forward.
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
        // We need to know whether time_in was already locked in.
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

        // ── Compute record ────────────────────────────────────────────────────
        // computeRecord always returns an array now — it never returns null.
        // If no scans matched any zone at all, it returns an ABSENT skeleton.
        // This ensures partial matches (e.g. only a break_in scan) are always
        // persisted rather than silently discarded.
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
        Employee           $employee,
        string             $date,
        Collection         $rawLogs,
        AttendanceSetting  $setting,
        ?AttendanceRecord  $existing,   // ← existing DB row, may be null
    ): array {
        $tz = self::TZ;

        $scheduledTimeIn   = $employee->work_schedule_start;
        $scheduledBreakOut = $employee->break_start;
        $scheduledBreakIn  = $employee->break_end;
        $scheduledTimeOut  = $employee->work_schedule_end;

        $anchor = fn(string $time) => Carbon::parse("{$date} {$time}", $tz);

        $timeInAnchor    = $scheduledTimeIn   ? $anchor($scheduledTimeIn)   : null;
        $breakOutAnchor  = $scheduledBreakOut ? $anchor($scheduledBreakOut) : null;
        $breakInAnchor   = $scheduledBreakIn  ? $anchor($scheduledBreakIn)  : null;
        $timeOutAnchor   = $scheduledTimeOut  ? $anchor($scheduledTimeOut)  : null;

        // ── Grace to use for the late_minutes calculation ─────────────────────
        //
        // KEY RULE:
        //   If this record already has a time_in in the database, the grace
        //   period that was in effect when it was first recorded is stored in
        //   `grace_minutes` on that row.  We use THAT value so that changing
        //   the setting later does not retroactively alter late_minutes.
        //
        //   If there is no existing record (first scan of the day), we use the
        //   current setting — it becomes the locked-in value for this record.
        //
        $lockedGraceMinutes = ($existing && $existing->time_in !== null)
            ? $existing->grace_minutes          // honour the snapshot
            : $setting->time_in_grace_minutes;  // first time — use live value

        // ── Zone-based scan assignment ────────────────────────────────────────
        //
        // The day is divided into non-overlapping zones using the schedule
        // anchors as hard boundaries. Every scan falls into exactly ONE zone,
        // so a scan at 1:46 PM can never be misread as time_in just because
        // the time_in window happens to extend that far.
        //
        // Zone boundaries (using schedule anchors as dividers):
        //
        //   Zone 1 — TIME_IN   : [time_in - early]  →  break_out anchor
        //   Zone 2 — BREAK_OUT : [break_out anchor]  →  break_in anchor
        //   Zone 3 — BREAK_IN  : [break_in anchor]   →  time_out anchor
        //   Zone 4 — TIME_OUT  : [time_out anchor]   →  time_out + late buffer
        //
        // If there is no break configured, Zone 1 extends to time_out anchor.
        // If a scan lands in Zone 3 but no Zone-1 time_in exists (very late
        // arrival after break), the Zone-3 scan becomes the time_in — break
        // columns are left null because the employee was never present before
        // break started.

        $endOfDay = Carbon::parse("{$date} 23:59:59", $tz);

        // Zone boundaries — each zone's end is the next zone's start
        $zone1End = $breakOutAnchor ?? $timeOutAnchor ?? $endOfDay;
        $zone2End = $breakInAnchor  ?? $timeOutAnchor ?? $endOfDay;
        $zone3End = $timeOutAnchor  ?? $endOfDay;

        // ── Map raw logs to Carbon timestamps ─────────────────────────────────
        $sorted = $rawLogs
            ->map(fn($l) => Carbon::parse($l->captured_at)->setTimezone($tz))
            ->sortBy(fn($c) => $c->timestamp)
            ->values();

        // ── Slot-locking: once a slot is recorded it is never overwritten ────────
        //
        // Each slot is checked against the existing DB record first.
        // If a value is already stored, we keep it as-is and skip scanning
        // that zone entirely. This means a 7:56 AM clock-in stays 7:56 AM
        // even if the employee scans again at 8:00 AM.
        //
        // Only slots that are still null are resolved from the raw logs.

        $existingTimeIn  = $existing?->time_in;
        $existingBreakOut = $existing?->break_out;
        $existingBreakIn  = $existing?->break_in;
        $existingTimeOut  = $existing?->time_out;

        // ── Zone 1: time_in ───────────────────────────────────────────────────
        if ($existingTimeIn !== null) {
            // Already locked — restore from DB, do not re-scan
            $timeInCarbon = Carbon::parse("{$date} {$existingTimeIn}", $tz);
        } else {
            $zone1Start = $timeInAnchor
                ? $timeInAnchor->copy()->subMinutes($setting->early_time_in_minutes)
                : $endOfDay;

            $zone1Scans   = $sorted->filter(
                fn($c) => $c->gte($zone1Start) && $c->lt($zone1End)
            )->values();

            $timeInCarbon = $zone1Scans->first();
        }

        // ── Zone 2: break_out ─────────────────────────────────────────────────
        if ($existingBreakOut !== null) {
            $breakOutCarbon = Carbon::parse("{$date} {$existingBreakOut}", $tz);
        } else {
            $breakOutCarbon = null;
            if ($breakOutAnchor && $breakInAnchor && $timeInCarbon) {
                $zone2Scans     = $sorted->filter(
                    fn($c) => $c->gte($breakOutAnchor) && $c->lt($zone2End)
                )->values();

                $breakOutCarbon = $zone2Scans->last();
            }
        }

        // ── Zone 3: break_in ──────────────────────────────────────────────────
        $zone3Scans    = collect();
        if ($breakInAnchor) {
            $zone3Scans = $sorted->filter(
                fn($c) => $c->gte($breakInAnchor) && $c->lt($zone3End)
            )->values();
        }

        if ($existingBreakIn !== null) {
            // Already locked — restore from DB
            $breakInCarbon = Carbon::parse("{$date} {$existingBreakIn}", $tz);
        } else {
            // Zone-3 scans always go to break_in regardless of whether time_in
            // exists. A 1:54 PM scan is a break_in scan — it must never be
            // silently promoted to time_in just because the morning scan was
            // missed. If no Zone-1 time_in exists, time_in stays null and the
            // record is handled as a partial/absent accordingly.
            $breakInCarbon = $zone3Scans->first();
        }

        // Note: if timeInCarbon is still null here, we continue anyway.
        // Zones 3 & 4 may still have matched scans (e.g. break_in at 2 PM
        // when the employee missed the morning). We return a partial record
        // with status ABSENT so those scans are preserved, not silently lost.

        // ── Zone 4: time_out ──────────────────────────────────────────────────
        if ($existingTimeOut !== null) {
            $timeOutCarbon = Carbon::parse("{$date} {$existingTimeOut}", $tz);
        } else {
            $timeOutCarbon = null;
            if ($timeOutAnchor) {
                $zone4End      = $timeOutAnchor->copy()->addMinutes($setting->late_time_out_minutes);
                $zone4Scans    = $sorted->filter(
                    fn($c) => $c->gte($timeOutAnchor) && $c->lte($zone4End)
                )->values();

                $timeOutCarbon = $zone4Scans->last();
            }
        }

        // ── Late minutes — only computable when time_in is known ───────────────
        $lateMinutes = null;
        if ($timeInCarbon && $timeInAnchor) {
            $deadline = $timeInAnchor->copy()->addMinutes($lockedGraceMinutes);
            if ($timeInCarbon->gt($deadline)) {
                $lateMinutes = (int) $deadline->diffInMinutes($timeInCarbon);
            }
        }

        // ── Scheduled break duration ───────────────────────────────────────────
        $scheduledBreakDuration = ($breakOutAnchor && $breakInAnchor)
            ? (int) $breakOutAnchor->diffInMinutes($breakInAnchor)
            : 0;

        // ── Status & work minutes ──────────────────────────────────────────────
        //
        // Rules (evaluated in priority order):
        //
        //  PRESENT  — time_in=null  but break_out recorded
        //               (break_out proves the employee was physically present)
        //  PRESENT  — time_in set AND time_out set (full day, with or without break)
        //  PRESENT  — time_in set AND still within the scheduled work window
        //               (time_out cap hasn't passed yet — employee is still working)
        //  HALF_DAY — time_in set AND break_out set, but no time_out yet
        //  ABSENT   — everything else:
        //               • only break_in recorded (no time_in, no break_out)
        //               • only time_out recorded  (no time_in)
        //               • only time_in recorded   AND the workday is already over
        //               • nothing recorded at all

        $workMinutes = null;
        $now         = Carbon::now(self::TZ);

        // "Still inside the work window" = before time_out anchor + late buffer
        $withinWorkWindow = $timeOutAnchor
            && $now->lte($timeOutAnchor->copy()->addMinutes($setting->late_time_out_minutes));

        if ($timeInCarbon && $timeOutCarbon) {
            // Full day — time_in and time_out both recorded (break presence irrelevant)
            $status      = 'PRESENT';
            $workMinutes = max(0, (int) $timeInCarbon->diffInMinutes($timeOutCarbon) - $scheduledBreakDuration);

        } elseif ($breakOutCarbon && !$timeInCarbon) {
            // break_out recorded without a time_in → employee was present but
            // missed the morning clock-in scan
            $status = 'PRESENT';

        } elseif ($timeInCarbon && $breakOutCarbon && !$timeOutCarbon) {
            // Clocked in and went on break but no time_out yet
            $status      = 'HALF_DAY';
            $workMinutes = (int) $timeInCarbon->diffInMinutes($breakOutCarbon);

        } elseif ($withinWorkWindow && ($timeInCarbon || $breakInCarbon)) {
            // Still within work hours AND there is at least one scan proving
            // the employee is physically present (time_in OR back from break).
            // Mark as PRESENT — time_out hasn't been reached yet.
            $status = 'PRESENT';

        } else {
            // Day is over and none of the above conditions were met:
            //   • only break_in with no time_in and day already finished
            //   • only time_out with no time_in
            //   • nothing at all
            $status = 'ABSENT';
        }

        return [
            'scheduled_time_in'   => $scheduledTimeIn,
            'scheduled_break_out' => $scheduledBreakOut,
            'scheduled_break_in'  => $scheduledBreakIn,
            'scheduled_time_out'  => $scheduledTimeOut,
            'grace_minutes'       => $lockedGraceMinutes,
            'time_in'             => $timeInCarbon?->format('H:i:s'),
            'break_out'           => $breakOutCarbon?->format('H:i:s'),
            'break_in'            => $breakInCarbon?->format('H:i:s'),
            'time_out'            => $timeOutCarbon?->format('H:i:s'),
            'late_minutes'        => $lateMinutes,
            'work_minutes'        => $workMinutes,
            'status'              => $status,
        ];
    }

    private function buildAbsent(Employee $employee, string $date, AttendanceSetting $setting): array
    {
        return [
            'scheduled_time_in'   => $employee->work_schedule_start,
            'scheduled_break_out' => $employee->break_start,
            'scheduled_break_in'  => $employee->break_end,
            'scheduled_time_out'  => $employee->work_schedule_end,
            'grace_minutes'       => $setting->time_in_grace_minutes,
            'time_in'             => null,
            'break_out'           => null,
            'break_in'            => null,
            'time_out'            => null,
            'late_minutes'        => null,
            'work_minutes'        => null,
            'status'              => 'ABSENT',
        ];
    }
}