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
 * ── Location seed data ───────────────────────────────────────────────────────
 *
 * Codes follow the PSA Philippine Standard Geographic Code (PSGC) format as
 * returned by the GeoRisk ArcGIS APIs:
 *
 *   prov_code — 9-char zero-padded string  (e.g. "112400000")
 *   city_code — 9-char zero-padded string  (e.g. "112401000")
 *   brgy_code — 9-char zero-padded string  (e.g. "112401001")
 *
 * Five real locations in Region XI (Davao Region) are used and rotated
 * across slips so the seed data is spatially varied:
 *
 *  A  Barangay 1-A, Davao City, Davao del Sur
 *  B  Barangay Poblacion, Digos City, Davao del Sur
 *  C  Barangay Sto. Tomas, Tagum City, Davao del Norte
 *  D  Barangay Mabini, Panabo City, Davao del Norte
 *  E  Barangay Aplaya, Mati City, Davao Oriental
 *
 * Usage:
 *   php artisan db:seed --class=AttendanceSeeder
 */
class AttendanceSeeder extends Seeder
{
    // ── Schedule constants ────────────────────────────────────────────────────
    private const SCHED_IN = '08:00:00';

    private const SCHED_BREAK_OUT = '12:00:00';

    private const SCHED_BREAK_IN = '13:00:00';

    private const SCHED_OUT = '17:00:00';

    // ── Seed location pool ────────────────────────────────────────────────────
    //
    // Codes are stored exactly as returned by the GeoRisk ArcGIS REST APIs —
    // 9-character strings with leading zeros, matching the PSGC format.
    //
    // Format (all are 9-digit zero-padded strings):
    //   prov_code = "RRPPP0000"  (e.g. "112400000" → Davao del Sur)
    //   city_code = "RRPPPMM000" (e.g. "112401000" → Davao City)
    //   brgy_code = "RRPPPMMBB" (e.g. "112401001" → Brgy. 1-A, Davao City)
    //
    private const LOCATIONS = [
        // A — Barangay 1-A, Davao City, Davao del Sur
        [
            'prov_code' => '112400000',
            'city_code' => '112401000',
            'brgy_code' => '112401001',
            'latitude' => 7.0636,
            'longitude' => 125.6105,
        ],
        // B — Barangay Aplaya, Digos City, Davao del Sur
        [
            'prov_code' => '112400000',
            'city_code' => '112402000',
            'brgy_code' => '112402001',
            'latitude' => 6.7497,
            'longitude' => 125.3572,
        ],
        // C — Barangay Canocotan, Tagum City, Davao del Norte
        [
            'prov_code' => '101300000',
            'city_code' => '101315000',
            'brgy_code' => '101315018',
            'latitude' => 7.4478,
            'longitude' => 125.8078,
        ],
        // D — Barangay A. O. Floirendo, Panabo City, Davao del Norte
        [
            'prov_code' => '101300000',
            'city_code' => '101321000',
            'brgy_code' => '101321001',
            'latitude' => 7.3097,
            'longitude' => 125.6845,
        ],
        // E — Barangay Badas, Mati City, Davao Oriental
        [
            'prov_code' => '124700000',
            'city_code' => '124708000',
            'brgy_code' => '124708004',
            'latitude' => 6.9570,
            'longitude' => 126.2241,
        ],
    ];

    // Cached supervisor employee_id for whereabout slip FK fields.
    private int $supervisorId;

    public function run(): void
    {
        // ── 1. Ensure AttendanceSetting exists ────────────────────────────────
        $setting = AttendanceSetting::firstOrCreate(
            ['name' => 'Standard Policy'],
            [
                'early_time_in_minutes' => 60,
                'late_time_out_minutes' => 60,
                'is_default' => false,
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
        $employees = Employee::orderBy('employee_id')->take(12)->get();

        if ($employees->isEmpty()) {
            $this->command->error('No employees found. Please seed employees first.');

            return;
        }

        $this->supervisorId = $employees->first()->employee_id;

        $count = $employees->count();
        $this->command->info("Found {$count} employee(s). Seeding 1 month of records…");

        // ── 3. Build date range: last 30 days, weekdays only ──────────────────
        $today = Carbon::today('Asia/Manila');
        $startDate = $today->copy()->subDays(29);

        /** @var Carbon[] $workdays */
        $workdays = collect(CarbonPeriod::create($startDate, $today))
            ->filter(fn (Carbon $d) => $d->isWeekday())
            ->values()
            ->all();

        $this->command->info('Workdays in range: '.count($workdays));

        // ── 4. Scenario list ──────────────────────────────────────────────────
        $scenarios = [

            // 1. PRESENT · On time · No slips
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '07:55:00',
                    '12:00:00',
                    '13:00:00',
                    '17:05:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '07:55:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:05:00',
                    'late_minutes' => 0,
                    'work_minutes' => 480,
                    'status' => 'PRESENT',
                ]);
            },

            // 2. PRESENT · Late 1 h 30 m · No slips
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '09:30:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '09:30:00',
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => '17:00:00',
                    'late_minutes' => 90,
                    'work_minutes' => 450,
                    'status' => 'PRESENT',
                ]);
            },

            // 3. PRESENT · On time · Personal slip deducted (has time_returned)
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 435,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 0, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Bank errand',
                    'time_out' => '10:00:00',
                    'time_returned' => '10:45:00',
                    'minutes_gone' => 45,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 4. PRESENT · Late · Personal slip deducted
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:30:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:30:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => 30,
                    'work_minutes' => 420,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 1, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Dental appointment',
                    'time_out' => '14:00:00',
                    'time_returned' => '14:30:00',
                    'minutes_gone' => 30,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 5. PRESENT · On time · Official slip — NO deduction
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 480,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 2, [
                    'purpose_type' => 'official',
                    'purpose_description' => 'City Hall document pickup',
                    'time_out' => '14:00:00',
                    'time_returned' => '15:00:00',
                    'minutes_gone' => 60,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 6. PRESENT · Mix: personal deducted + official ignored
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 450,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 3, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Personal errand downtown',
                    'time_out' => '09:00:00',
                    'time_returned' => '09:30:00',
                    'minutes_gone' => 30,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
                $this->insertSlip($emp->employee_id, $date, 4, [
                    'purpose_type' => 'official',
                    'purpose_description' => 'Inter-office courier delivery',
                    'time_out' => '14:00:00',
                    'time_returned' => '14:45:00',
                    'minutes_gone' => 45,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 7. PRESENT · Multiple personal slips deducted
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => '12:00:00',
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => 0,
                    'work_minutes' => 435,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 0, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Quick pharmacy run',
                    'time_out' => '09:00:00',
                    'time_returned' => '09:20:00',
                    'minutes_gone' => 20,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
                $this->insertSlip($emp->employee_id, $date, 1, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'School pickup (child)',
                    'time_out' => '15:00:00',
                    'time_returned' => '15:25:00',
                    'minutes_gone' => 25,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 8. PRESENT · Personal slip returned — NOT timed out yet
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, ['08:00:00']);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => 0,
                    'work_minutes' => null,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 2, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Personal errand (AM)',
                    'time_out' => '09:00:00',
                    'time_returned' => '09:35:00',
                    'minutes_gone' => 35,
                    'status' => 'done',
                    'return_status' => 'returned',
                ]);
            },

            // 9. PRESENT · Personal slip NOT returned (still out)
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, ['08:00:00']);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => 0,
                    'work_minutes' => null,
                    'status' => 'PRESENT',
                ]);
                $this->insertSlip($emp->employee_id, $date, 3, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Personal errand',
                    'time_out' => '10:00:00',
                    'time_returned' => null,
                    'minutes_gone' => null,
                    'status' => 'pending',
                    'return_status' => 'not_returned',
                ]);
            },

            // 10. HALF_DAY · time_in + break_out only (never came back)
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '08:00:00',
                    '12:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => '08:00:00',
                    'break_out' => '12:00:00',
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => 0,
                    'work_minutes' => 240,
                    'status' => 'HALF_DAY',
                ]);
            },

            // 11. HALF_DAY · break_in + time_out only (arrived after lunch)
            function (Employee $emp, string $date, bool $isToday) {
                $this->insertLogs($emp->employee_id, $date, [
                    '13:00:00',
                    '17:00:00',
                ]);
                $this->upsertRecord($emp, $date, [
                    'time_in' => null,
                    'break_out' => null,
                    'break_in' => '13:00:00',
                    'time_out' => '17:00:00',
                    'late_minutes' => null,
                    'work_minutes' => 240,
                    'status' => 'HALF_DAY',
                ]);
            },

            // 12. ABSENT · No logs at all
            function (Employee $emp, string $date, bool $isToday) {
                $this->upsertRecord($emp, $date, [
                    'time_in' => null,
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => null,
                    'work_minutes' => null,
                    'status' => 'ABSENT',
                ]);
            },
        ];

        // ── 5. Run scenarios across all workdays for every employee ───────────
        $total = 0;

        foreach ($employees as $empIndex => $emp) {
            $this->command->line("  Seeding [{$emp->work_id}] {$emp->full_name}…");

            foreach ($workdays as $dayIndex => $carbon) {
                $date = $carbon->toDateString();
                $isToday = $carbon->isToday();

                $scenarioIndex = ($dayIndex + $empIndex * 3) % count($scenarios);

                if (! $isToday && $scenarioIndex === 7) {
                    $scenarioIndex = 0;
                }

                ($scenarios[$scenarioIndex])($emp, $date, $isToday);
                $total++;
            }
        }

        $this->command->info("Done. {$total} records seeded across ".count($workdays).' workdays.');
        $this->command->warn('Run [php artisan queue:work] if you want the jobs to also update attendance_records from raw logs.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function insertLogs(int $employeeId, string $date, array $times): void
    {
        foreach ($times as $time) {
            $capturedAt = Carbon::parse("{$date} {$time}", 'Asia/Manila');

            Attendance::firstOrCreate(
                ['employee_id' => $employeeId, 'captured_at' => $capturedAt],
                ['employee_id' => $employeeId, 'captured_at' => $capturedAt]
            );
        }
    }

    private function upsertRecord(Employee $emp, string $date, array $fields): void
    {
        AttendanceRecord::updateOrCreate(
            ['employee_id' => $emp->employee_id, 'date' => $date],
            array_merge([
                'scheduled_time_in' => self::SCHED_IN,
                'scheduled_break_out' => self::SCHED_BREAK_OUT,
                'scheduled_break_in' => self::SCHED_BREAK_IN,
                'scheduled_time_out' => self::SCHED_OUT,
                'grace_minutes' => 0,
            ], $fields)
        );
    }

    /**
     * Insert one WhereaboutSlip row with a location drawn from the LOCATIONS
     * pool. The $locationIndex parameter lets callers pin specific locations
     * to specific slip types for realism (e.g. scenario 5 always uses
     * location C — City Hall area).
     *
     * Location fields match what the GeoRisk ArcGIS APIs return:
     *   prov_code — 9-char zero-padded string (e.g. "112400000")
     *   city_code — 9-char zero-padded string (e.g. "112401000")
     *   brgy_code — 9-char zero-padded string (e.g. "112401001")
     *   latitude  — decimal(11,7)
     *   longitude — decimal(11,7)
     *
     * The reviewed_and_noted_by_id / approved_by_id / attested_by_id columns
     * are FKs to employees.employee_id — NOT users.id.
     */
    private function insertSlip(
        int $employeeId,
        string $date,
        int $locationIndex,
        array $fields
    ): void {
        $loc = self::LOCATIONS[$locationIndex % count(self::LOCATIONS)];

        WhereaboutSlip::create(array_merge(
            [
                'employee_id' => $employeeId,
                'date_filed' => $date,
                'reviewed_and_noted_by_id' => $this->supervisorId,
                'approved_by_id' => $this->supervisorId,
                'attested_by_id' => $this->supervisorId,
                'time_noted' => $fields['time_out'],
                // ── Location fields ──────────────────────────────────────────
                'prov_code' => $loc['prov_code'],
                'city_code' => $loc['city_code'],
                'brgy_code' => $loc['brgy_code'],
                'latitude' => $loc['latitude'],
                'longitude' => $loc['longitude'],
            ],
            $fields
        ));
    }
}
