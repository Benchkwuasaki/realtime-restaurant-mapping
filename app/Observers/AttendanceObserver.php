<?php

namespace App\Observers;

use App\Jobs\ProcessAttendanceLog;
use App\Models\Attendance;

/**
 * AttendanceObserver
 *
 * Automatically dispatches ProcessAttendanceLog whenever a raw
 * Attendance scan is created or updated, so AttendanceRecord stays
 * in sync without manual recompute calls.
 *
 * Register in AppServiceProvider:
 *   Attendance::observe(AttendanceObserver::class);
 */
class AttendanceObserver
{
    /**
     * Fired when a new scan is stored (e.g. from a fingerprint device).
     * Only dispatch if the log is linked to a real employee — unknown
     * scans have no record to compute.
     */
    public function created(Attendance $log): void
    {
        if (! $log->employee_id) {
            return;
        }

        ProcessAttendanceLog::dispatch($log->id)->onQueue('attendance');
    }

    /**
     * Fired when an existing scan is updated — e.g. when a previously
     * unknown scan gets matched to an employee (employee_id assigned),
     * or when time_type / captured_at is corrected manually.
     *
     * We only re-dispatch if a field that actually affects the computed
     * record has changed, avoiding unnecessary re-processing on unrelated
     * column updates (e.g. snapshot_path, device_id).
     */
    public function updated(Attendance $log): void
    {
        if (! $log->employee_id) {
            return;
        }

        $affectsRecord = $log->wasChanged([
            'employee_id',
            'captured_at',
            'time_type',
        ]);

        if (! $affectsRecord) {
            return;
        }

        ProcessAttendanceLog::dispatch($log->id)->onQueue('attendance');
    }
}