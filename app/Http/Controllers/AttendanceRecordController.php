<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceRecordController extends Controller
{
    private const TZ = 'Asia/Manila';

    public function index(): Response
    {
        $setting = AttendanceSetting::getDefault();
        $employees = Employee::with('basicInfo')->where('status', true)->get();

        // ── 1. Pull all raw logs for active employees, grouped by employee+date ──
        $allLogs = Attendance::whereNotNull('employee_id')
            ->whereIn('employee_id', $employees->pluck('employee_id'))
            ->orderBy('captured_at')
            ->get()
            ->groupBy(
                fn($log) =>
                $log->employee_id . '|' .
                Carbon::parse($log->captured_at)->setTimezone(self::TZ)->toDateString()
            );

        // ── 2. Compute and upsert each employee+date into attendance_records ──
        foreach ($employees as $employee) {
            $byDate = collect();
            foreach ($allLogs as $key => $logs) {
                [$empId, $date] = explode('|', $key, 2);
                if ((int) $empId === $employee->employee_id) {
                    $byDate[$date] = $logs;
                }
            }

            if ($byDate->isEmpty()) {
                // No scans at all → upsert absent for today only
                $this->upsertAbsent($employee, now(self::TZ)->toDateString(), $setting);
                continue;
            }

            foreach ($byDate as $date => $logs) {
                $computed = $this->computeRecord($employee, $date, $logs, $setting);
                if ($computed) {
                    AttendanceRecord::updateOrCreate(
                        ['employee_id' => $employee->employee_id, 'date' => $date],
                        $computed
                    );
                }
            }
        }

        // ── 3. Read back from attendance_records, group by employee ──
        $all = AttendanceRecord::with([
            'employee:employee_id,employee_basic_info_id,work_id,avatar_url',
            'employee.basicInfo:employee_basic_info_id,first_name,last_name,middle_name',
        ])
            ->orderBy('employee_id')
            ->orderByDesc('date')
            ->get();

        $records = $all
            ->groupBy('employee_id')
            ->map(function ($group) {
                $latest = $group->first();
                $history = $group->slice(1)->values();
                return array_merge($latest->toArray(), ['history' => $history->toArray()]);
            })
            ->values();

        return Inertia::render('Attendance/AttendanceRecord/Index', [
            'records' => $records,
            'setting' => $setting,
        ]);
    }

    // ─── Compute one day's record for an employee ─────────────────────────────

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

        // ── Scan acceptance windows ───────────────────────────────────────────
        // time_in  : [scheduled_time_in  - early_allowance,  scheduled_time_in  + time_in_grace]
        // break_out: [scheduled_break_out - early_allowance, scheduled_break_out + break_in_grace]
        // break_in : [scheduled_break_in,                    scheduled_break_in  + break_in_grace]
        // time_out : [scheduled_time_out,                    scheduled_time_out  + late_allowance]
        $w = [];

        if ($timeInAnchor) {
            $w['time_in'] = [
                'from' => $timeInAnchor->copy()->subMinutes($setting->early_time_in_minutes),
                'to' => $timeInAnchor->copy()->addMinutes($setting->time_in_grace_minutes),
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

        // Sort all taps ascending
        $sorted = $rawLogs
            ->map(fn($l) => Carbon::parse($l->captured_at)->setTimezone($tz))
            ->sortBy(fn($c) => $c->timestamp)
            ->values();

        // time_in: earliest tap inside the time_in window
        $timeInCarbon = isset($w['time_in'])
            ? $sorted->first(fn($c) => $c->between($w['time_in']['from'], $w['time_in']['to']))
            : null;

        // No valid time_in → nothing to record for this date
        if (!$timeInCarbon) {
            return null;
        }

        // break_out: last tap inside the break_out window, after time_in
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

        // ── Late minutes (time_in only) ───────────────────────────────────────
        // Only late when time_in exceeds scheduled_time_in + grace. Early arrivals = never late.
        $lateMinutes = null;
        if ($timeInAnchor) {
            $deadline = $timeInAnchor->copy()->addMinutes($setting->time_in_grace_minutes);
            if ($timeInCarbon->gt($deadline)) {
                $lateMinutes = (int) $deadline->diffInMinutes($timeInCarbon);
            }
        }

        // ── Scheduled break duration (always deducted from PRESENT work minutes) ──
        $scheduledBreakDuration = ($breakOutAnchor && $breakInAnchor)
            ? (int) $breakOutAnchor->diffInMinutes($breakInAnchor)
            : 0;

        // ── Status & work minutes ─────────────────────────────────────────────
        // PRESENT  → time_in + time_out: gross - scheduled_break_duration
        // HALF_DAY → time_in + break_out (no time_out): break_out - time_in
        // ABSENT   → handled separately (no valid time_in)
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

    private function upsertAbsent(Employee $employee, string $date, AttendanceSetting $setting): void
    {
        AttendanceRecord::updateOrCreate(
            ['employee_id' => $employee->employee_id, 'date' => $date],
            [
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
            ]
        );
    }
}