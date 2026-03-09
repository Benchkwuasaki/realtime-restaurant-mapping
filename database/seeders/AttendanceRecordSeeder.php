<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttendanceRecordSeeder extends Seeder
{
    /**
     * Shift constants (matches DatabaseSeeder: 08:00–17:00)
     * Break is assumed 12:00–13:00 (standard Philippine government noon break).
     *
     * AM session : 08:00 – 12:00  (shift start → break start)
     * PM session : 13:00 – 17:00  (break end   → shift end)
     *
     * Recognition log windows (mirrors the facial-recognition gate logic):
     *   AM-in  : recognized between SHIFT_START   and BREAK_START
     *   AM-out : recognized between BREAK_START   and BREAK_END
     *   PM-in  : recognized between BREAK_END     and SHIFT_END
     *   PM-out : recognized between SHIFT_END     and SHIFT_END + 1 hr (grace)
     */
    private const SHIFT_START  = '08:00';
    private const BREAK_START  = '12:00';
    private const BREAK_END    = '13:00';
    private const SHIFT_END    = '17:00';

    // Seed the last N months (current month included)
    private const MONTHS_BACK  = 3;

    public function run(): void
    {
        // All active employees with their work schedule
        $employees = DB::table('employees')
            ->where('status', true)
            ->select('employee_id', 'work_schedule_start', 'work_schedule_end')
            ->get();

        if ($employees->isEmpty()) {
            $this->command->warn('No active employees found — skipping AttendanceRecordSeeder.');
            return;
        }

        // Date range: first day of MONTHS_BACK ago → today
        $rangeStart = Carbon::today()->subMonths(self::MONTHS_BACK - 1)->startOfMonth();
        $rangeEnd   = Carbon::today();

        $this->command->info(
            "Seeding attendance from {$rangeStart->toDateString()} to {$rangeEnd->toDateString()} " .
            "for {$employees->count()} employees…"
        );

        // Pre-fetch all holidays in range to skip them
        $holidays = DB::table('holidays')
            ->whereBetween('date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->flip() // use as a hash-set for O(1) lookup
            ->all();

        $recognitionRows  = [];
        $attendanceRows   = [];
        $batchSize        = 500;

        foreach ($employees as $employee) {
            foreach (CarbonPeriod::create($rangeStart, $rangeEnd) as $day) {
                // Skip Sundays and public holidays
                if ($day->isSunday()) continue;
                if (isset($holidays[$day->toDateString()])) continue;

                // Vary behaviour per employee per day deterministically:
                //   ~10% absent, ~15% half-day (AM only), ~75% full day
                $seed = crc32("{$employee->employee_id}_{$day->toDateString()}");
                $roll = abs($seed) % 100;

                if ($roll < 10) {
                    // Absent — insert a blank attendance record (no punch IDs)
                    $attendanceRows[] = [
                        'employee_id'                  => $employee->employee_id,
                        'embeddings_id'                => null,
                        'recognition_morning_in_id'    => null,
                        'recognition_morning_out_id'   => null,
                        'recognition_afternoon_in_id'  => null,
                        'recognition_afternoon_out_id' => null,
                        'created_at'                   => $day->copy()->setTimeFromTimeString('08:00'),
                        'updated_at'                   => $day->copy()->setTimeFromTimeString('17:00'),
                    ];
                    continue;
                }

                $isHalfDay = ($roll < 25); // 10–24 → AM-only half day

                // ── AM-in: 07:50 – 08:15 with slight randomness ──────
                $amInOffset  = (abs($seed * 3) % 26) - 10; // -10 to +15 minutes
                $amInTime    = $day->copy()
                    ->setTimeFromTimeString(self::SHIFT_START)
                    ->addMinutes($amInOffset);

                // ── AM-out: 12:00 – 12:20 ────────────────────────────
                $amOutOffset = abs($seed * 7) % 21;         // 0 to +20 minutes
                $amOutTime   = $day->copy()
                    ->setTimeFromTimeString(self::BREAK_START)
                    ->addMinutes($amOutOffset);

                // Insert AM-in recognition log
                $amInId = DB::table('recognition_logs')->insertGetId([
                    'employee_id'          => $employee->employee_id,
                    'action_type'          => 'identification',
                    'recognition_status'   => 'matched',
                    'confidence_score'     => round(0.85 + (abs($seed) % 15) / 100, 5),
                    'similarity_threshold' => 0.75000,
                    'processing_time_ms'   => 120 + abs($seed) % 80,
                    'metadata'             => null,
                    'created_at'           => $amInTime,
                    'updated_at'           => $amInTime,
                ]);

                // Insert AM-out recognition log
                $amOutId = DB::table('recognition_logs')->insertGetId([
                    'employee_id'          => $employee->employee_id,
                    'action_type'          => 'identification',
                    'recognition_status'   => 'matched',
                    'confidence_score'     => round(0.85 + (abs($seed * 2) % 15) / 100, 5),
                    'similarity_threshold' => 0.75000,
                    'processing_time_ms'   => 120 + abs($seed * 2) % 80,
                    'metadata'             => null,
                    'created_at'           => $amOutTime,
                    'updated_at'           => $amOutTime,
                ]);

                if ($isHalfDay) {
                    // Half-day: only AM punches recorded, no PM entries
                    $attendanceRows[] = [
                        'employee_id'                  => $employee->employee_id,
                        'embeddings_id'                => null,
                        'recognition_morning_in_id'    => $amInId,
                        'recognition_morning_out_id'   => $amOutId,
                        'recognition_afternoon_in_id'  => null,
                        'recognition_afternoon_out_id' => null,
                        'created_at'                   => $amInTime,
                        'updated_at'                   => $amOutTime,
                    ];
                    continue;
                }

                // ── PM-in: 13:00 – 13:10 ─────────────────────────────
                $pmInOffset = abs($seed * 11) % 11;         // 0 to +10 minutes
                $pmInTime   = $day->copy()
                    ->setTimeFromTimeString(self::BREAK_END)
                    ->addMinutes($pmInOffset);

                // ── PM-out: 17:00 – 17:30 ────────────────────────────
                $pmOutOffset = abs($seed * 13) % 31;        // 0 to +30 minutes
                $pmOutTime   = $day->copy()
                    ->setTimeFromTimeString(self::SHIFT_END)
                    ->addMinutes($pmOutOffset);

                // Insert PM-in recognition log
                $pmInId = DB::table('recognition_logs')->insertGetId([
                    'employee_id'          => $employee->employee_id,
                    'action_type'          => 'identification',
                    'recognition_status'   => 'matched',
                    'confidence_score'     => round(0.85 + (abs($seed * 3) % 15) / 100, 5),
                    'similarity_threshold' => 0.75000,
                    'processing_time_ms'   => 120 + abs($seed * 3) % 80,
                    'metadata'             => null,
                    'created_at'           => $pmInTime,
                    'updated_at'           => $pmInTime,
                ]);

                // Insert PM-out recognition log
                $pmOutId = DB::table('recognition_logs')->insertGetId([
                    'employee_id'          => $employee->employee_id,
                    'action_type'          => 'identification',
                    'recognition_status'   => 'matched',
                    'confidence_score'     => round(0.85 + (abs($seed * 4) % 15) / 100, 5),
                    'similarity_threshold' => 0.75000,
                    'processing_time_ms'   => 120 + abs($seed * 4) % 80,
                    'metadata'             => null,
                    'created_at'           => $pmOutTime,
                    'updated_at'           => $pmOutTime,
                ]);

                $attendanceRows[] = [
                    'employee_id'                  => $employee->employee_id,
                    'embeddings_id'                => null,
                    'recognition_morning_in_id'    => $amInId,
                    'recognition_morning_out_id'   => $amOutId,
                    'recognition_afternoon_in_id'  => $pmInId,
                    'recognition_afternoon_out_id' => $pmOutId,
                    'created_at'                   => $amInTime,
                    'updated_at'                   => $pmOutTime,
                ];

                // Flush attendance rows in batches to avoid memory bloat
                if (count($attendanceRows) >= $batchSize) {
                    DB::table('attendance_records')->insert($attendanceRows);
                    $attendanceRows = [];
                }
            }
        }

        // Insert any remaining attendance rows
        if (!empty($attendanceRows)) {
            DB::table('attendance_records')->insert($attendanceRows);
        }

        $this->command->info('AttendanceRecordSeeder completed.');
    }
}