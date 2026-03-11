<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * FIXED VERSION - Seeds face_embeddings + attendance_records + recognition_logs
 * for Aguilar, Kevin with proper transaction handling and data validation.
 *
 * Key improvements:
 * - Wrapped in DB transaction for atomicity
 * - Better error handling and validation
 * - Verifies data integrity after creation
 * - Detailed debug output
 *
 * Run with:
 *   php artisan db:seed --class=AguilarKevinAttendanceSeeder
 */
class AguilarKevinAttendanceSeeder extends Seeder
{
    private const START_HOUR = 8;

    private const START_MINUTE = 0;

    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════════
        // WRAP EVERYTHING IN A TRANSACTION FOR DATA INTEGRITY
        // ══════════════════════════════════════════════════════════════════
        DB::beginTransaction();

        try {
            $this->seedAttendanceData();
            DB::commit();
            $this->command->info('✅ Transaction committed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Transaction rolled back due to error: '.$e->getMessage());
            $this->command->error('Stack trace: '.$e->getTraceAsString());
            throw $e;
        }
    }

    private function seedAttendanceData(): void
    {
        // ── 1. Resolve employee ───────────────────────────────────────────────
        $basicInfo = DB::table('employee_basic_info')
            ->where('last_name', 'Aguilar')
            ->where('first_name', 'Kevin')
            ->first();

        if (! $basicInfo) {
            throw new \Exception('No basic info record found for Aguilar, Kevin. Create the employee first.');
        }

        $employee = DB::table('employees')
            ->where('employee_basic_info_id', $basicInfo->employee_basic_info_id)
            ->first();

        if (! $employee) {
            throw new \Exception("Found basic info (id={$basicInfo->employee_basic_info_id}) but no matching employee row.");
        }

        $empId = $employee->employee_id;
        $this->command->info("Found Aguilar, Kevin — employee_id: {$empId}");

        // ── 2. Clean up existing data first ───────────────────────────────────
        $this->cleanupExistingData($empId);

        // ── 3. Seed face_embeddings ───────────────────────────────────────────
        $embeddingId = DB::table('face_embeddings')->insertGetId([
            'employee_id' => $empId,
            'embeddings' => json_encode(array_map(
                fn () => round(mt_rand(-1000, 1000) / 1000, 6),
                range(1, 128)
            )),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! $embeddingId) {
            throw new \Exception('Failed to create face_embeddings record');
        }

        $this->command->info("Face embedding created — face_embedding_id: {$embeddingId}");

        // ── 4. Build working days for current month ───────────────────────────
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        $this->command->info("Seeding full month: {$monthStart->toDateString()} → {$monthEnd->toDateString()}");

        $workingDays = $this->getWorkingDays($monthStart, $monthEnd);

        if (empty($workingDays)) {
            throw new \Exception('No working days found in the current month');
        }

        $this->command->info('Working days in month: '.count($workingDays));

        // ── 5. Define scenarios ───────────────────────────────────────────────
        $scenarios = [
            'late_5',
            'on_time',
            'late_15',
            'on_time',
            'absent',
            'late_30',
            'on_time',
            'no_checkin',
            'on_time',
            'late_60',
            'on_time',
            'on_time',
            'absent',
            'on_time',
            'on_time',
        ];

        $lateOffsets = [
            'on_time' => 0,
            'late_5' => 5,
            'late_15' => 15,
            'late_30' => 30,
            'late_60' => 60,
            'absent' => null,
            'no_checkin' => null,
        ];

        // ── 6. Shared base for recognition_logs ───────────────────────────────
        $logBase = [
            'employee_id' => $empId,
            'action_type' => 'identification',
            'recognition_status' => 'matched',
            'confidence_score' => 0.97500,
            'similarity_threshold' => 0.70000,
            'processing_time_ms' => 320,
            'metadata' => null,
            'updated_at' => now(),
        ];

        $inserted = 0;
        $absentCount = 0;
        $lateCount = 0;
        $totalLate = 0;

        // ── 7. Create records for each working day ────────────────────────────
        foreach ($workingDays as $idx => $date) {
            $scenario = $scenarios[$idx % count($scenarios)];
            $offsetMinutes = $lateOffsets[$scenario];

            // ── Absent: skip entirely ──────────────────────────────────────────
            if ($scenario === 'absent') {
                $this->command->line("  {$date}  ❌  ABSENT");
                $absentCount++;

                continue;
            }

            // ── No check-in: attendance_record with null FKs ──────────────────
            if ($scenario === 'no_checkin') {
                $recordId = DB::table('attendance_records')->insertGetId([
                    'employee_id' => $empId,
                    'embeddings_id' => $embeddingId,
                    'recognition_morning_in_id' => null,
                    'recognition_morning_out_id' => null,
                    'recognition_afternoon_in_id' => null,
                    'recognition_afternoon_out_id' => null,
                    'created_at' => Carbon::parse($date)->setTime(0, 0, 0),
                    'updated_at' => now(),
                ]);

                if (! $recordId) {
                    throw new \Exception("Failed to create no_checkin attendance_record for {$date}");
                }

                $this->command->line("  {$date}  🚫  NO CHECK-IN (record exists, morning_in = null)");
                $absentCount++;
                $inserted++;

                continue;
            }

            // ── Present: create recognition_logs then attendance_record ───────
            $morningInTime = Carbon::parse($date)
                ->setHour(self::START_HOUR)
                ->setMinute(self::START_MINUTE)
                ->addMinutes($offsetMinutes);

            $morningOutTime = Carbon::parse($date)->setTime(12, 0, 0);
            $afternoonInTime = Carbon::parse($date)->setTime(13, 0, 0);
            $afternoonOutTime = Carbon::parse($date)->setTime(17, 0, 0);

            // Create all 4 recognition logs
            $morningInId = DB::table('recognition_logs')->insertGetId(
                array_merge($logBase, ['created_at' => $morningInTime])
            );
            $morningOutId = DB::table('recognition_logs')->insertGetId(
                array_merge($logBase, ['created_at' => $morningOutTime])
            );
            $afternoonInId = DB::table('recognition_logs')->insertGetId(
                array_merge($logBase, ['created_at' => $afternoonInTime])
            );
            $afternoonOutId = DB::table('recognition_logs')->insertGetId(
                array_merge($logBase, ['created_at' => $afternoonOutTime])
            );

            // Validate IDs were created
            if (! $morningInId || ! $morningOutId || ! $afternoonInId || ! $afternoonOutId) {
                throw new \Exception("Failed to create recognition_logs for {$date}. IDs: morning_in={$morningInId}, morning_out={$morningOutId}, afternoon_in={$afternoonInId}, afternoon_out={$afternoonOutId}");
            }

            // Create attendance record with valid FKs
            $recordId = DB::table('attendance_records')->insertGetId([
                'employee_id' => $empId,
                'embeddings_id' => $embeddingId,
                'recognition_morning_in_id' => $morningInId,
                'recognition_morning_out_id' => $morningOutId,
                'recognition_afternoon_in_id' => $afternoonInId,
                'recognition_afternoon_out_id' => $afternoonOutId,
                'created_at' => Carbon::parse($date)->setTime(0, 0, 0),
                'updated_at' => now(),
            ]);

            if (! $recordId) {
                throw new \Exception("Failed to create attendance_record for {$date}");
            }

            $inserted++;

            if ($offsetMinutes > 0) {
                $lateCount++;
                $totalLate += $offsetMinutes;
                $this->command->line(
                    "  {$date}  ⏰  LATE +{$offsetMinutes} min  (check-in: {$morningInTime->format('H:i')})"
                );
            } else {
                $this->command->line(
                    "  {$date}  ✅  ON TIME  (check-in: {$morningInTime->format('H:i')})"
                );
            }
        }

        // ── 8. Validate data integrity ────────────────────────────────────────
        $this->validateDataIntegrity($empId, $monthStart, $monthEnd);

        // ── 9. Display summary ────────────────────────────────────────────────
        $this->command->newLine();
        $this->command->info('─────────────────────────────────────────────────────');
        $this->command->info("  face_embedding_id           : {$embeddingId}");
        $this->command->info("  Attendance records inserted : {$inserted}");
        $this->command->info("  Expected absent_days        : {$absentCount}");
        $this->command->info("  Expected late_minutes total : {$totalLate} ({$lateCount} day(s))");
        $this->command->info('─────────────────────────────────────────────────────');
        $this->command->info('Test endpoints:');
        $today = Carbon::today();
        $mid = $today->copy()->startOfMonth()->day(15);
        $this->command->line("  GET /payroll/attendance-summary?start_date={$monthStart->toDateString()}&end_date={$mid->toDateString()}");
        $this->command->line("  GET /payroll/attendance-summary?start_date={$today->copy()->startOfMonth()->day(16)->toDateString()}&end_date={$monthEnd->toDateString()}");
        $this->command->line("  GET /payroll/attendance-summary?start_date={$monthStart->toDateString()}&end_date={$monthEnd->toDateString()}");
    }

    private function cleanupExistingData(int $empId): void
    {
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth()->toDateString();
        $monthEnd = $today->copy()->endOfMonth()->toDateString();

        $existingRecords = DB::table('attendance_records')
            ->where('employee_id', $empId)
            ->whereBetween(
                DB::raw('DATE(created_at)'),
                [$monthStart, $monthEnd]
            )
            ->count();

        if ($existingRecords > 0) {
            // Null out FK references first to avoid constraint violations
            DB::table('attendance_records')
                ->where('employee_id', $empId)
                ->whereBetween(DB::raw('DATE(created_at)'), [$monthStart, $monthEnd])
                ->update([
                    'recognition_morning_in_id' => null,
                    'recognition_morning_out_id' => null,
                    'recognition_afternoon_in_id' => null,
                    'recognition_afternoon_out_id' => null,
                ]);

            // Delete recognition_logs
            DB::table('recognition_logs')
                ->where('employee_id', $empId)
                ->whereBetween(DB::raw('DATE(created_at)'), [$monthStart, $monthEnd])
                ->delete();

            // Delete attendance_records
            DB::table('attendance_records')
                ->where('employee_id', $empId)
                ->whereBetween(DB::raw('DATE(created_at)'), [$monthStart, $monthEnd])
                ->delete();

            // Delete face_embeddings
            DB::table('face_embeddings')
                ->where('employee_id', $empId)
                ->delete();

            $this->command->warn("Cleared {$existingRecords} existing record(s).");
        }
    }

    private function getWorkingDays(Carbon $start, Carbon $end): array
    {
        $workingDays = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            if (! $cursor->isWeekend()) {
                $workingDays[] = $cursor->toDateString();
            }
            $cursor->addDay();
        }

        return $workingDays;
    }

    private function validateDataIntegrity(int $empId, Carbon $monthStart, Carbon $monthEnd): void
    {
        // Check for orphaned foreign keys
        $orphaned = DB::table('attendance_records as ar')
            ->leftJoin('recognition_logs as rl', 'ar.recognition_morning_in_id', '=', 'rl.recognition_log_id')
            ->whereNotNull('ar.recognition_morning_in_id')
            ->whereNull('rl.recognition_log_id')
            ->where('ar.employee_id', $empId)
            ->whereBetween(
                DB::raw('DATE(ar.created_at)'),
                [$monthStart->toDateString(), $monthEnd->toDateString()]
            )
            ->count();

        if ($orphaned > 0) {
            throw new \Exception("❌ Data integrity check failed: {$orphaned} orphaned foreign keys detected!");
        }

        // Verify recognition_logs were created with correct timestamps
        $lateRecords = DB::table('attendance_records as ar')
            ->join('recognition_logs as rl', 'ar.recognition_morning_in_id', '=', 'rl.recognition_log_id')
            ->where('ar.employee_id', $empId)
            ->whereBetween(
                DB::raw('DATE(ar.created_at)'),
                [$monthStart->toDateString(), $monthEnd->toDateString()]
            )
            ->whereRaw('TIME(rl.created_at) > ?', ['08:00:00'])
            ->count();

        if ($lateRecords === 0) {
            throw new \Exception('❌ Data integrity check failed: No late records found (all check-ins are 08:00:00). Timestamps may not be varied.');
        }

        $this->command->info("✅ Data integrity check passed: No orphaned FKs, {$lateRecords} late records found");
    }
}
