<?php

namespace Database\Seeders;

use App\Models\AttendanceSetting;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceSeeder extends Seeder
{
    private const TZ      = 'Asia/Manila';
    private const DEVICE  = '1018340';

    public function run(): void
    {
        // ── Ensure a default AttendanceSetting exists ─────────────────────────
        if (!AttendanceSetting::where('is_default', true)->exists()) {
            AttendanceSetting::create([
                'name'                   => 'Standard Policy',
                'time_in_grace_minutes'  => 15,
                'break_in_grace_minutes' => 10,
                'early_time_in_minutes'  => 60,
                'late_time_out_minutes'  => 60,
                'is_default'             => true,
            ]);
        }

        $employees = Employee::where('status', true)->get();

        // Seed 7 days: today and the 6 days before
        $dates = collect(range(0, 6))->map(
            fn($d) => Carbon::now(self::TZ)->subDays($d)->toDateString()
        );

        $rows = [];

        foreach ($dates as $dayIndex => $date) {
            foreach ($employees as $empIndex => $employee) {
                // Use a deterministic "scenario" per employee per day so the
                // dataset covers every case without being fully random.
                $scenario = $this->pickScenario($empIndex, $dayIndex);

                $taps = $this->buildTaps($employee, $date, $scenario);

                foreach ($taps as $capturedAt) {
                    $rows[] = [
                        'employee_id'         => $employee->employee_id,
                        'work_id'             => $employee->work_id,
                        'verification_status' => 'verified',
                        'similarity'          => rand(78, 99),
                        'device_id'           => self::DEVICE,
                        'snapshot_path'       => null,
                        'captured_at'         => $capturedAt,
                        'created_at'          => $capturedAt,
                        'updated_at'          => $capturedAt,
                    ];
                }
            }
        }

        // Chunk inserts to avoid hitting query-size limits
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('attendances')->insert($chunk);
        }

        $total = count($rows);
        $this->command->info("AttendanceSeeder: inserted {$total} attendance logs across {$dates->count()} days for {$employees->count()} employees.");
    }

    // ─── Scenario picker ──────────────────────────────────────────────────────
    //
    //  0 = PRESENT  — on time, full day, all 4 taps
    //  1 = PRESENT  — early time-in, full day
    //  2 = PRESENT  — late time-in (after grace), full day
    //  3 = PRESENT  — late break-in, full day
    //  4 = PRESENT  — overtime (time-out after scheduled)
    //  5 = HALF_DAY — time-in + break-out only (left at lunch, never returned)
    //  6 = HALF_DAY — time-in only (left mid-morning, no break scan)
    //  7 = ABSENT   — no taps at all
    //
    private function pickScenario(int $empIndex, int $dayIndex): int
    {
        // Weight toward PRESENT so the table looks realistic
        $matrix = [
            0 => [0, 0, 0, 1, 2, 3, 4],   // employee mod 8 == 0
            1 => [0, 0, 0, 0, 1, 4, 5],
            2 => [0, 0, 1, 2, 3, 4, 5],
            3 => [0, 0, 0, 1, 4, 6, 7],
            4 => [0, 0, 0, 0, 1, 5, 7],
            5 => [0, 0, 2, 3, 4, 5, 6],
            6 => [0, 0, 0, 1, 2, 6, 7],
            7 => [0, 0, 0, 0, 4, 5, 7],
        ];

        $row = $matrix[$empIndex % 8];
        return $row[$dayIndex % count($row)];
    }

    // ─── Build tap timestamps for a given scenario ────────────────────────────

    private function buildTaps(Employee $employee, string $date, int $scenario): array
    {
        // If scenario is ABSENT there are no taps
        if ($scenario === 7) {
            return [];
        }

        $tz  = self::TZ;
        $fmt = 'Y-m-d H:i:s';

        // Anchors
        $timeIn   = Carbon::parse("{$date} {$employee->work_schedule_start}", $tz);
        $breakOut = Carbon::parse("{$date} {$employee->break_start}",         $tz);
        $breakIn  = Carbon::parse("{$date} {$employee->break_end}",           $tz);
        $timeOut  = Carbon::parse("{$date} {$employee->work_schedule_end}",   $tz);

        return match ($scenario) {

            // ── 0: On-time, full 4-tap day ────────────────────────────────────
            0 => [
                $timeIn->copy()->addMinutes(rand(0, 5))->format($fmt),    // 08:00–08:05
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),  // ~11:57–11:59
                $breakIn->copy()->addMinutes(rand(0, 5))->format($fmt),   // 13:00–13:05
                $timeOut->copy()->addMinutes(rand(0, 10))->format($fmt),  // 17:00–17:10
            ],

            // ── 1: Early time-in, full day ────────────────────────────────────
            1 => [
                $timeIn->copy()->subMinutes(rand(20, 55))->format($fmt),  // 07:05–07:40
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),
                $breakIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $timeOut->copy()->addMinutes(rand(0, 10))->format($fmt),
            ],

            // ── 2: Late time-in (after grace), full day ───────────────────────
            2 => [
                $timeIn->copy()->addMinutes(rand(16, 45))->format($fmt),  // 08:16–08:45
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),
                $breakIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $timeOut->copy()->addMinutes(rand(0, 10))->format($fmt),
            ],

            // ── 3: Late break-in (after grace), full day ──────────────────────
            3 => [
                $timeIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),
                $breakIn->copy()->addMinutes(rand(11, 30))->format($fmt), // 13:11–13:30
                $timeOut->copy()->addMinutes(rand(0, 10))->format($fmt),
            ],

            // ── 4: Overtime ───────────────────────────────────────────────────
            4 => [
                $timeIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),
                $breakIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $timeOut->copy()->addMinutes(rand(15, 55))->format($fmt), // 17:15–17:55
            ],

            // ── 5: Half day — time-in + break-out only ────────────────────────
            5 => [
                $timeIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                $breakOut->copy()->subMinutes(rand(1, 3))->format($fmt),
                // no break-in, no time-out
            ],

            // ── 6: Half day — time-in only (left before break) ───────────────
            6 => [
                $timeIn->copy()->addMinutes(rand(0, 5))->format($fmt),
                // only one tap
            ],

            default => [],
        };
    }
}