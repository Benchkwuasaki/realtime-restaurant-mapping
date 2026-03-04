<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employeeIds = DB::table('employees')
            ->orderBy('employee_id')
            ->limit(5)
            ->pluck('employee_id')
            ->all();

        if (count($employeeIds) < 5) {
            return;
        }

        $days = [
            Carbon::today()->subDay()->toDateString(),
            Carbon::today()->toDateString(),
        ];

        foreach ($days as $date) {
            foreach ($employeeIds as $employeeId) {

                $logs = DB::table('recognition_logs')
                    ->where('employee_id', $employeeId)
                    ->whereDate('created_at', $date)
                    ->where('recognition_status', 'matched')
                    ->orderBy('created_at')
                    ->get();

                if ($logs->isEmpty()) {
                    // Absent → still create record with null in/out
                    DB::table('attendance_records')->insert([
                        'employee_id' => $employeeId,
                        'embeddings_id' => null,
                        'recognition_morning_in_id' => null,
                        'recognition_morning_out_id' => null,
                        'recognition_afternoon_in_id' => null,
                        'recognition_afternoon_out_id' => null,
                        'created_at' => Carbon::parse($date),
                        'updated_at' => now(),
                    ]);

                    continue;
                }

                $morningLogs = $logs->filter(
                    fn($log) =>
                    Carbon::parse($log->created_at)->hour < 12
                );

                $afternoonLogs = $logs->filter(
                    fn($log) =>
                    Carbon::parse($log->created_at)->hour >= 12
                );

                DB::table('attendance_records')->insert([
                    'employee_id' => $employeeId,
                    'embeddings_id' => null,

                    'recognition_morning_in_id' => optional($morningLogs->first())->recognition_log_id,
                    'recognition_morning_out_id' => optional($morningLogs->last())->recognition_log_id,
                    'recognition_afternoon_in_id' => optional($afternoonLogs->first())->recognition_log_id,
                    'recognition_afternoon_out_id' => optional($afternoonLogs->last())->recognition_log_id,

                    'created_at' => Carbon::parse($date),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
