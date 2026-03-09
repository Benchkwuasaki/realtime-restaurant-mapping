<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAttendanceLog;
use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use Carbon\Carbon;
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
        // Read back grouped records — fast, no computation
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
                $latest  = $group->first();
                $history = $group->slice(1)->values();
                return array_merge($latest->toArray(), ['history' => $history->toArray()]);
            })
            ->values();

        return Inertia::render('Attendance/AttendanceRecord/Index', [
            'records' => $records,
            'setting' => AttendanceSetting::getDefault(),
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
        $setting   = AttendanceSetting::getDefault();
        $today     = now('Asia/Manila')->toDateString();
        $employees = Employee::where('status', true)->get();

        foreach ($employees as $employee) {
            // Only insert if no record exists for today
            AttendanceRecord::firstOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $today],
                [
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
                ]
            );
        }

        return response()->json(['synced' => $employees->count()]);
    }
}