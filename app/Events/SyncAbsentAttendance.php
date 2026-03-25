<?php

namespace App\Console\Commands;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Models\LeaveApplication;
use Illuminate\Console\Command;

/**
 * php artisan attendance:sync-absent
 *
 * Ensures every active employee has at least one attendance record for the
 * given date. Run this once daily (e.g. 00:01 PH time) so the dashboard
 * always shows all employees even before their first scan.
 *
 * Leave integration:
 *   Before defaulting to ABSENT, the command checks whether the employee
 *   has an Approved leave application covering the date:
 *
 *     is_with_pay = true  →  ON_LEAVE_WP
 *     is_with_pay = false →  ON_LEAVE_NP
 *
 *   If an existing record already has a real status (PRESENT / HALF_DAY)
 *   it is NEVER overwritten — this command only creates missing records
 *   via firstOrCreate.
 *
 * Schedule (Laravel 11+ bootstrap/app.php):
 *   $schedule->command('attendance:sync-absent')
 *            ->dailyAt('00:01')
 *            ->timezone('Asia/Manila');
 */
class SyncAbsentAttendance extends Command
{
    protected $signature   = 'attendance:sync-absent {--date= : Date to sync (Y-m-d), defaults to today}';
    protected $description = 'Create ABSENT / ON_LEAVE records for active employees with no record on a given date';

    public function handle(): int
    {
        $date      = $this->option('date') ?? now('Asia/Manila')->toDateString();
        $setting   = AttendanceSetting::getDefault();
        $employees = Employee::where('status', true)->get();

        // ── Pre-load approved leaves covering this date ───────────────────────
        // One query for all employees instead of N+1 inside the loop.
        $leavesByEmployee = LeaveApplication::where('status', 'Approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->get()
            ->keyBy('employee_id');   // one leave per employee for this date is enough

        $created  = 0;
        $onLeave  = 0;
        $skipped  = 0;

        foreach ($employees as $employee) {
            // Determine the correct default status for this employee + date
            $leave = $leavesByEmployee->get($employee->employee_id);

            if ($leave) {
                $defaultStatus = $leave->is_with_pay ? 'ON_LEAVE_WP' : 'ON_LEAVE_NP';
            } else {
                $defaultStatus = 'ABSENT';
            }

            $record = AttendanceRecord::firstOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $date],
                [
                    'scheduled_time_in'   => $employee->work_schedule_start,
                    'scheduled_break_out' => $employee->break_start,
                    'scheduled_break_in'  => $employee->break_end,
                    'scheduled_time_out'  => $employee->work_schedule_end,
                    'grace_minutes'       => $setting->time_in_grace_minutes ?? 0,
                    'time_in'             => null,
                    'break_out'           => null,
                    'break_in'            => null,
                    'time_out'            => null,
                    'late_minutes'        => null,
                    'work_minutes'        => null,
                    'status'              => $defaultStatus,
                ]
            );

            if ($record->wasRecentlyCreated) {
                $created++;
                if ($leave) {
                    $onLeave++;
                }
            } else {
                $skipped++;
            }
        }

        $absent = $created - $onLeave;

        $this->info("Synced {$date}:");
        $this->line("  {$created} new records created ({$absent} ABSENT, {$onLeave} ON_LEAVE)");
        $this->line("  {$skipped} already existed — not touched");

        return self::SUCCESS;
    }
}