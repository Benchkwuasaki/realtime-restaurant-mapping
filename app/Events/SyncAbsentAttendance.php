<?php

namespace App\Console\Commands;

use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use Illuminate\Console\Command;

/**
 * php artisan attendance:sync-absent
 *
 * Ensures every active employee has at least an ABSENT record for today.
 * Schedule this to run once daily (e.g. at 00:01 PH time) so the dashboard
 * always shows all employees, even before their first scan of the day.
 *
 * In app/Console/Kernel.php (or bootstrap/app.php for Laravel 11+):
 *   $schedule->command('attendance:sync-absent')->dailyAt('00:01')->timezone('Asia/Manila');
 */
class SyncAbsentAttendance extends Command
{
    protected $signature   = 'attendance:sync-absent {--date= : Date to sync (Y-m-d), defaults to today}';
    protected $description = 'Create ABSENT records for active employees who have no record on a given date';

    public function handle(): int
    {
        $date      = $this->option('date') ?? now('Asia/Manila')->toDateString();
        $setting   = AttendanceSetting::getDefault();
        $employees = Employee::where('status', true)->get();

        $created = 0;
        foreach ($employees as $employee) {
            $record = AttendanceRecord::firstOrCreate(
                ['employee_id' => $employee->employee_id, 'date' => $date],
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

            if ($record->wasRecentlyCreated) {
                $created++;
            }
        }

        $this->info("Synced {$date}: {$created} ABSENT records created, " . ($employees->count() - $created) . " already existed.");

        return self::SUCCESS;
    }
}