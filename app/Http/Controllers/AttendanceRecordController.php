<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAttendanceLog;
use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Models\WhereaboutSlip;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AttendanceRecordController
 *
 * Serves the pre-computed attendance_records table to the frontend.
 * NO computation happens here anymore — that belongs to ProcessAttendanceLog.
 *
 * The `recompute` action can be triggered manually from the UI to backfill
 * historical records (e.g. first run, or after changing schedule settings).
 */
class AttendanceRecordController extends Controller
{
    public function index(): Response
    {
        $all = AttendanceRecord::with([
            'employee' => fn($q) => $q->withTrashed()
                ->select('employee_id', 'employee_basic_info_id', 'work_id', 'avatar_url', 'deleted_at'),
            'employee.basicInfo:employee_basic_info_id,first_name,last_name,middle_name',
        ])
            ->orderBy('employee_id')
            ->orderByDesc('date')
            ->get();

        // ── Load all relevant whereabout slips in one query ───────────────────
        // Keyed by "employee_id|date" for fast lookup when building records.
        $employeeIds = $all->pluck('employee_id')->unique()->values()->toArray();

        // Always format as Y-m-d — $r->date may be a Carbon object or a date string;
        // using Carbon::parse()->format() is safe either way.
        $dates = $all->pluck('date')
            ->map(fn($d) => \Carbon\Carbon::parse($d)->format('Y-m-d'))
            ->unique()
            ->values()
            ->toArray();

        $slipsByKey = WhereaboutSlip::whereIn('employee_id', $employeeIds)
            ->whereIn('date_filed', $dates)
            ->orderBy('time_out')
            ->get()
            ->groupBy(fn($s) => $s->employee_id . '|' . \Carbon\Carbon::parse($s->date_filed)->format('Y-m-d'))
            ->map(fn($group) => $group->map(fn($s) => [
                'whereabout_slip_id' => $s->whereabout_slip_id,
                'date_filed' => \Carbon\Carbon::parse($s->date_filed)->format('Y-m-d'),
                'purpose_type' => $s->purpose_type,
                'purpose_description' => $s->purpose_description,
                'time_out' => $s->time_out,
                'time_returned' => $s->time_returned,
                'minutes_gone' => $s->minutes_gone,
                'status' => $s->status,
                'return_status' => $s->return_status,
            ])->values()->all());

        $allRecords = $all
            ->groupBy('employee_id')
            ->map(function ($group) use ($slipsByKey) {
                $latest = $group->first();
                $history = $group->slice(1)->values();

                $latestArr = $latest->toArray();
                $latestKey = $latest->employee_id . '|' . \Carbon\Carbon::parse($latest->date)->format('Y-m-d');
                $latestArr['whereabout_slips'] = $slipsByKey[$latestKey] ?? [];

                $historyArr = $history->map(function ($r) use ($slipsByKey) {
                    $arr = $r->toArray();
                    $key = $r->employee_id . '|' . \Carbon\Carbon::parse($r->date)->format('Y-m-d');
                    $arr['whereabout_slips'] = $slipsByKey[$key] ?? [];
                    return $arr;
                })->values()->all();

                return array_merge($latestArr, ['history' => $historyArr]);
            })
            ->values();

        // ── Split active vs. archived (soft-deleted employees) ───────────────────
        $records = $allRecords->filter(fn($r) => empty($r['employee']['deleted_at']))->values();
        $archived = $allRecords->filter(fn($r) => !empty($r['employee']['deleted_at']))->values();

        return Inertia::render('Attendance/AttendanceRecord/Index', [
            'records' => $records,
            'archived' => $archived,
            'settings' => AttendanceSetting::orderByDesc('is_default')
                ->orderBy('name')
                ->get(),
        ]);
    }
    
    /**
     * POST /attendance-records/recompute
     *
     * Backfill / re-sync all records from raw logs.
     * Safe to call anytime; dispatches one job per unique employee+date pair.
     * Returns immediately — jobs run in the background.
     */
    public function recompute(): \Illuminate\Http\RedirectResponse
    {
        $logIds = Attendance::whereNotNull('employee_id')
            ->select('id')
            ->orderBy('captured_at')
            ->pluck('id');

        // Chunk to avoid memory issues on large datasets
        $logIds->chunk(200)->each(function ($chunk) {
            foreach ($chunk as $id) {
                ProcessAttendanceLog::dispatch($id)->onQueue('attendance');
            }
        });

        return back()->with('success', "Recompute queued for {$logIds->count()} logs.");
    }

    /**
     * POST /attendance-records/sync-absent
     *
     * Ensures every active employee has an ABSENT record for today
     * if they have no logs yet. Useful for daily cron / scheduler.
     */
    public function syncAbsent(): \Illuminate\Http\JsonResponse
    {
        $setting = AttendanceSetting::getDefault();
        $today = now('Asia/Manila')->toDateString();
        $employees = Employee::where('status', true)->get();

        foreach ($employees as $employee) {
            AttendanceRecord::firstOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $today],
                [
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
                    'status' => 'ABSENT',
                ]
            );
        }

        return response()->json(['synced' => $employees->count()]);
    }
}