<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecognitionLogSeeder extends Seeder
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

        // ── Employee #1: full 365-day history ─────────────────────────
        $fullYearEmployee = $employeeIds[0];

        $startDate = Carbon::today()->subDays(364)->startOfDay();
        $endDate = Carbon::today()->startOfDay();

        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $this->seedDayForEmployee($fullYearEmployee, $current->copy());
            $current->addDay();
        }

        // ── Employees #2–5: original 2-day behaviour ──────────────────
        $remainingEmployees = array_slice($employeeIds, 1); // employees 2,3,4,5

        $days = [
            Carbon::today()->subDay(),
            Carbon::today(),
        ];

        foreach ($days as $day) {
            foreach ($remainingEmployees as $employeeId) {
                $this->seedDayForEmployee($employeeId, $day->copy());
            }
        }
    }

    /**
     * Seed recognition logs for a single employee on a single day.
     */
    private function seedDayForEmployee(int $employeeId, Carbon $day): void
    {
        // Attendance pattern:
        // 0 = absent
        // 1 = morning only
        // 2 = afternoon only
        // 3 = full day
        $pattern = rand(0, 3);

        // Always add 1 failed attempt for realism
        $this->insertLog(
            $employeeId,
            'identification',
            'not_matched',
            $day->copy()->setTime(rand(7, 17), rand(0, 59))
        );

        if ($pattern === 0) {
            return; // Absent
        }

        if (in_array($pattern, [1, 3])) {
            // Morning in/out
            $this->insertLog(
                $employeeId,
                'verification',
                'matched',
                $day->copy()->setTime(rand(7, 9), rand(0, 59))
            );

            $this->insertLog(
                $employeeId,
                'identification',
                'matched',
                $day->copy()->setTime(rand(10, 11), rand(0, 59))
            );
        }

        if (in_array($pattern, [2, 3])) {
            // Afternoon in/out
            $this->insertLog(
                $employeeId,
                'verification',
                'matched',
                $day->copy()->setTime(rand(12, 14), rand(0, 59))
            );

            $this->insertLog(
                $employeeId,
                'identification',
                'matched',
                $day->copy()->setTime(rand(16, 18), rand(0, 59))
            );
        }
    }

    private function insertLog(int $employeeId, string $action, string $status, Carbon $datetime): void
    {
        DB::table('recognition_logs')->insert([
            'employee_id' => $employeeId,
            'action_type' => $action,
            'recognition_status' => $status,
            'confidence_score' => $status === 'matched' ? 0.98 : 0.42,
            'similarity_threshold' => 0.80,
            'processing_time_ms' => rand(80, 200),
            'metadata' => null,
            'created_at' => $datetime,
            'updated_at' => now(),
        ]);
    }
}
