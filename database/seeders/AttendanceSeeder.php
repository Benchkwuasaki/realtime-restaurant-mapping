<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Models\WhereaboutSlip;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * AttendanceSeeder
 *
 * Seeds all possible attendance + whereabout-slip scenarios so every
 * code path in ProcessAttendanceLog and the AttendanceRecord UI can be
 * exercised visually.
 *
 * Scenarios are spread across the last 30 workdays so the history dialog
 * table is fully scrollable. Each day cycles through all 12 scenarios so
 * every type appears. Weekends are skipped automatically.
 *
 * ┌─────┬────────────────────────────────────────────────────────────────────┐
 * │  #  │ Description                                                        │
 * ├─────┼────────────────────────────────────────────────────────────────────┤
 * │  1  │ PRESENT · On time · No slips                                       │
 * │  2  │ PRESENT · Late (1 h 30 m) · No slips                              │
 * │  3  │ PRESENT · On time · Personal slip deducted (timed out)             │
 * │  4  │ PRESENT · Late · Personal slip deducted (timed out)                │
 * │  5  │ PRESENT · On time · Official slip — no deduction                   │
 * │  6  │ PRESENT · On time · Mix: personal deducted + official ignored      │
 * │  7  │ PRESENT · On time · Multiple personal slips deducted               │
 * │  8  │ PRESENT · On time · Personal slip returned but NOT timed out yet   │
 * │  9  │ PRESENT · On time · Personal slip NOT returned (still out)         │
 * │ 10  │ HALF_DAY · time_in + break_out only (walked out, never returned)   │
 * │ 11  │ HALF_DAY · break_in + time_out only (arrived mid-day)              │
 * │ 12  │ ABSENT · Shift over, zero logs recorded                            │
 * └─────┴────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   php artisan db:seed --class=AttendanceSeeder
 */
class AttendanceSeeder extends Seeder
{
    // ── Schedule constants ────────────────────────────────────────────────────
    // Adjust to match your employees' actual schedules if needed.
    private const SCHED_IN        = '08:00:00';
    private const SCHED_BREAK_OUT = '12:00:00';
    private const SCHED_BREAK_IN  = '13:00:00';
    private const SCHED_OUT       = '17:00:00';
    private const BREAK_DURATION  = 60; // minutes — kept in sync with schedule

    public function run(): void
    {
        // ── 1. Ensure AttendanceSetting exists ────────────────────────────────
        $setting = AttendanceSetting::firstOrCreate(
            ['name' => 'Standard Policy'],
            [
                'early_time_in_minutes' => 60,
                'late_time_out_minutes' => 60,
                'is_default'            => false,
            ]
        );

        $hasDefault = AttendanceSetting::where('is_default', true)
            ->where('id', '!=', $setting->id)
            ->exists();

        if (! $hasDefault) {
            $setting->markAsDefault();
        }

        $this->command->info("AttendanceSetting [{$setting->name}] ready.");

        // ── 2. Load employees ─────────────────────────────────────────────────
        // We need at least 12 employees. We'll use as many as exist and
        // cycle through scenarios if there are fewer.
        $employees = Employee::orderBy('employee_id')->take(12)->get();

        if ($employees->isEmpty()) {
            $this->command->error('No employees found. Please seed employees first.');
            return;
        }

        $count = $employees->count();
        $this->command->info("Found {$count} employee(s). Seeding 1 month of records…");

        // ── 3. Build date range: last 30 days, weekdays only ──────────────────
        $today     = Carbon::today('Asia/Manila');
        $startDate = $today->copy()->subDays(29);

        /** @var Carbon[] $workdays */
        $workdays = collect(CarbonPeriod::create($startDate, $today))
            ->filter(fn (Carbon $d) => $d->isWeekday())
            ->values()
            ->all();

        $this->command->info('Workdays in range: ' . count($workdays));

        // ── 4. Scenario list ──────────────────────────────────────────────────
        // Each closure has signature: fn(Employee, string $date, bool $isToday)
        $scenarios = [

            // ─────────────────────────────────────────────────────────────────
            // 1. PRESENT · On time · No slips
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '07:55:00', // time_in  (5 min early)
                    '12:00:00', // break_out
                    '13:00:00', // break_in
                    '17:05:00', // time_out
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '07:55:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:05:00',
                    'late_minutes' => 0,
                    'work_minutes' => 480,   // 8 h exactly (break excluded)
                    'status'       => 'PRESENT',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 2. PRESENT · Late 1 h 30 m · No slips
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '09:30:00', // time_in  (90 min late)
                    '17:00:00', // time_out
                ]);
                // No break logs — work_minutes = time_out - time_in (no break deduction)
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '09:30:00',
                    'break_out'    => null,
                    'break_in'     => null,
                    'time_out'     => '17:00:00',
                    'late_minutes' => 90,
                    'work_minutes' => 450,   // 7.5 h
                    'status'       => 'PRESENT',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 3. PRESENT · On time · Personal slip deducted (has time_out)
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                // 45-minute personal errand → deducted from work_minutes
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 435,   // 480 - 45
                    'status'       => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Bank errand',
                    'time_out'            => '10:00:00',
                    'time_returned'       => '10:45:00',
                    'minutes_gone'        => 45,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 4. PRESENT · Late · Personal slip deducted
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:30:00', // 30 min late
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                // 30-min personal slip → deducted
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:30:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => 30,
                    'work_minutes' => 420,   // 450 - 30
                    'status'       => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Dental appointment',
                    'time_out'            => '14:00:00',
                    'time_returned'       => '14:30:00',
                    'minutes_gone'        => 30,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 5. PRESENT · On time · Official slip — NO deduction
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                // Official slip — work_minutes unchanged
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 480,
                    'status'       => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'official',
                    'purpose_description' => 'City Hall document pickup',
                    'time_out'            => '14:00:00',
                    'time_returned'       => '15:00:00',
                    'minutes_gone'        => 60,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 6. PRESENT · Mix: personal deducted + official ignored
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                // Personal: 30 min deducted; Official: 45 min, no deduction
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 450,   // 480 - 30
                    'status'       => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Personal errand downtown',
                    'time_out'            => '09:00:00',
                    'time_returned'       => '09:30:00',
                    'minutes_gone'        => 30,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'official',
                    'purpose_description' => 'Inter-office courier delivery',
                    'time_out'            => '14:00:00',
                    'time_returned'       => '14:45:00',
                    'minutes_gone'        => 45,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 7. PRESENT · Multiple personal slips deducted
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                // 20 + 25 = 45 min total personal deduction
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 435,   // 480 - 45
                    'status'       => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Quick pharmacy run',
                    'time_out'            => '09:00:00',
                    'time_returned'       => '09:20:00',
                    'minutes_gone'        => 20,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'School pickup (child)',
                    'time_out'            => '15:00:00',
                    'time_returned'       => '15:25:00',
                    'minutes_gone'        => 25,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 8. PRESENT · Personal slip returned — NOT timed out yet (today)
            //    Deduction is PENDING until employee clocks out.
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, ['08:00:00']);
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => null,
                    'break_in'     => null,
                    'time_out'     => null,   // still at work
                    'late_minutes' => 0,
                    'work_minutes' => null,
                    'status'       => 'PRESENT',
                ]);
                // Returned from slip but hasn't clocked out → pending deduction
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Personal errand (AM)',
                    'time_out'            => '09:00:00',
                    'time_returned'       => '09:35:00',
                    'minutes_gone'        => 35,
                    'status'              => 'done',
                    'return_status'       => 'returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 9. PRESENT · Personal slip NOT returned (still out)
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, ['08:00:00']);
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => null,
                    'break_in'     => null,
                    'time_out'     => null,
                    'late_minutes' => 0,
                    'work_minutes' => null,
                    'status'       => 'PRESENT',
                ]);
                // Filed slip but hasn't returned yet
                $this->insertSlip($emp->employee_id, $date, [
                    'purpose_type'        => 'personal',
                    'purpose_description' => 'Personal errand',
                    'time_out'            => '10:00:00',
                    'time_returned'       => null,
                    'minutes_gone'        => null,
                    'status'              => 'pending',
                    'return_status'       => 'not_returned',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 10. HALF_DAY · time_in + break_out only (never came back)
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00', // time_in
                    '12:00:00', // break_out — left and never came back
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in'      => '08:00:00',
                    'break_out'    => '12:00:00',
                    'break_in'     => null,
                    'time_out'     => null,
                    'late_minutes' => 0,
                    'work_minutes' => 240,   // 4 h (time_in → break_out)
                    'status'       => 'HALF_DAY',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 11. HALF_DAY · break_in + time_out only (arrived after lunch)
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '13:00:00', // break_in (arrived after lunch, no morning)
                    '17:00:00', // time_out
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in'      => null,
                    'break_out'    => null,
                    'break_in'     => '13:00:00',
                    'time_out'     => '17:00:00',
                    'late_minutes' => null,
                    'work_minutes' => 240,   // 4 h (break_in → time_out)
                    'status'       => 'HALF_DAY',
                ]);
            },

            // ─────────────────────────────────────────────────────────────────
            // 12. ABSENT · No logs at all
            // ─────────────────────────────────────────────────────────────────
            function (Employee $emp, string $date, bool $isToday) {
                // No raw attendance logs inserted
                $this->upsertRecord($emp, $date, [
                    'time_in'      => null,
                    'break_out'    => null,
                    'break_in'     => null,
                    'time_out'     => null,
                    'late_minutes' => null,
                    'work_minutes' => null,
                    'status'       => 'ABSENT',
                ]);
            },
        ];

        // ── 5. Run scenarios across all workdays for every employee ───────────
        $total = 0;

        foreach ($employees as $empIndex => $emp) {
            $this->command->line("  Seeding [{$emp->work_id}] {$emp->full_name}…");

            foreach ($workdays as $dayIndex => $carbon) {
                $date    = $carbon->toDateString();
                $isToday = $carbon->isToday();

                // Rotate through all 12 scenarios; offset per employee so
                // adjacent rows in the table look visually distinct.
                $scenarioIndex = ($dayIndex + $empIndex * 3) % count($scenarios);

                // Scenarios 7 & 8 require time_out to be null (in-progress day).
                // Force them to scenario 0 on any past date.
                if (! $isToday && in_array($scenarioIndex, [7, 8])) {
                    $scenarioIndex = 0;
                }

                ($scenarios[$scenarioIndex])($emp, $date, $isToday);
                $total++;
            }
        }

        $this->command->info("Done. {$total} records seeded across " . count($workdays) . ' workdays.');
        $this->command->warn('Run [php artisan queue:work] if you want the jobs to also update attendance_records from raw logs.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Insert raw attendance scan logs.
     * Each time string becomes one row in the `attendances` table.
     */
    private function insertLogs(int $employeeId, string $date, array $times): void
    {
        foreach ($times as $time) {
            $capturedAt = Carbon::parse("{$date} {$time}", 'Asia/Manila');

            // Use updateOrCreate keyed on employee + captured_at so re-running
            // the seeder doesn't create duplicate rows.
            Attendance::firstOrCreate(
                [
                    'employee_id' => $employeeId,
                    'captured_at' => $capturedAt,
                ],
                [
                    'employee_id' => $employeeId,
                    'captured_at' => $capturedAt,
                ]
            );
        }
    }

    /**
     * Upsert a computed AttendanceRecord row.
     * Mirrors what ProcessAttendanceLog writes.
     */
    private function upsertRecord(Employee $emp, string $date, array $fields): void
    {
        AttendanceRecord::updateOrCreate(
            [
                'employee_id' => $emp->employee_id,
                'date'        => $date,
            ],
            array_merge([
                'scheduled_time_in'    => self::SCHED_IN,
                'scheduled_break_out'  => self::SCHED_BREAK_OUT,
                'scheduled_break_in'   => self::SCHED_BREAK_IN,
                'scheduled_time_out'   => self::SCHED_OUT,
                'grace_minutes'        => 0,
            ], $fields)
        );
    }

    /**
     * Insert one WhereaboutSlip row.
     * Mirrors what WhereaboutSlipController::store() creates.
     */
    private function insertSlip(int $employeeId, string $date, array $fields): void
    {
        // Use a supervisor/admin user ID for the noted-by fields.
        // Falls back to 1 if none found.
        $adminId = DB::table('users')->value('id') ?? 1;

        WhereaboutSlip::create(array_merge(
            [
                'employee_id'              => $employeeId,
                'date_filed'               => $date,
                'reviewed_and_noted_by_id' => $adminId,
                'approved_by_id'           => $adminId,
                'attested_by_id'           => $adminId,
                'time_noted'               => $fields['time_out'],
            ],
            $fields
        ));
    }
}