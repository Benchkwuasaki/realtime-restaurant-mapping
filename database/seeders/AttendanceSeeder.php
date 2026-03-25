<?php

namespace Database\Seeders;

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
 * Seeds attendance_records ONLY — never touches the raw `attendances` table.
 * The `attendances` table is owned exclusively by biometric/RFID hardware.
 *
 * ┌──────┬──────────────────────────────────────────────────────────────────────┐
 * │  #   │ Scenario                                                             │
 * ├──────┼──────────────────────────────────────────────────────────────────────┤
 * │  1   │ PRESENT  · On time · Full day (all 4 punches)                        │
 * │  2   │ PRESENT  · Late 30 m · Full day                                      │
 * │  3   │ PRESENT  · Late 90 m · No break scans                                │
 * │  4   │ PRESENT  · On time · No break scans (skip lunch)                     │
 * │  5   │ PRESENT  · On time · Personal slip deducted (45 m)                   │
 * │  6   │ PRESENT  · Late 30 m · Personal slip deducted (30 m)                 │
 * │  7   │ PRESENT  · On time · Official slip — no deduction                    │
 * │  8   │ PRESENT  · Early in, late out (within caps)                          │
 * │  9   │ HALF_DAY · time_in + break_out only (left at lunch)                  │
 * │  10  │ HALF_DAY · break_in + time_out only (missed morning)                 │
 * │  11  │ ABSENT   · No scans at all                                           │
 * └──────┴──────────────────────────────────────────────────────────────────────┘
 *
 * Special overrides seeded after the main loop:
 *   - 3 employees → today → PRESENT, still within work window (open record)
 *   - 5 employees → yesterday → PRESENT, not_returned whereabout slip
 */
class AttendanceSeeder extends Seeder
{
    // ── Schedule constants ────────────────────────────────────────────────────
    private const TZ = 'Asia/Manila';

    private const SCHED_IN = '08:00:00';

    private const SCHED_BREAK_OUT = '12:00:00';

    private const SCHED_BREAK_IN = '13:00:00';

    private const SCHED_OUT = '17:00:00';

    // ── Location pool for whereabout slips ────────────────────────────────────
    private const LOCATIONS = [
        ['prov_code' => '112400000', 'city_code' => '112401000', 'brgy_code' => '112401001', 'latitude' => 7.0636,  'longitude' => 125.6105],
        ['prov_code' => '112400000', 'city_code' => '112402000', 'brgy_code' => '112402001', 'latitude' => 6.7497,  'longitude' => 125.3572],
        ['prov_code' => '101300000', 'city_code' => '101315000', 'brgy_code' => '101315018', 'latitude' => 7.4478,  'longitude' => 125.8078],
        ['prov_code' => '101300000', 'city_code' => '101321000', 'brgy_code' => '101321001', 'latitude' => 7.3097,  'longitude' => 125.6845],
        ['prov_code' => '124700000', 'city_code' => '124708000', 'brgy_code' => '124708004', 'latitude' => 6.9570,  'longitude' => 126.2241],
        ['prov_code' => '112400000', 'city_code' => '112401000', 'brgy_code' => '112401116', 'latitude' => 7.0200,  'longitude' => 125.5800],
        ['prov_code' => '112400000', 'city_code' => '112401000', 'brgy_code' => '112401016', 'latitude' => 7.1150,  'longitude' => 125.6400],
        ['prov_code' => '112400000', 'city_code' => '112401000', 'brgy_code' => '112401112', 'latitude' => 6.9800,  'longitude' => 125.5200],
        ['prov_code' => '124700000', 'city_code' => '124708000', 'brgy_code' => '124708005', 'latitude' => 6.9500,  'longitude' => 126.2100],
        ['prov_code' => '101300000', 'city_code' => '101315000', 'brgy_code' => '101315020', 'latitude' => 7.4600,  'longitude' => 125.8200],
    ];

    private int $supervisorId;

    // ─────────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        // ── 1. Ensure a default AttendanceSetting exists ──────────────────────
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

        // ── 2. Load active employees ──────────────────────────────────────────
        $employees = Employee::where('status', true)
            ->orderBy('employee_id')
            ->take(12)
            ->get();

        if ($employees->isEmpty()) {
            $this->command->error('No active employees found. Seed employees first.');

            return;
        }

        $this->supervisorId = $employees->first()->employee_id;
        $this->command->info("Found {$employees->count()} employee(s). Seeding…");

        // ── 3. Build workday range — last 30 days, EXCLUDING today ────────────
        //
        // Today is excluded because real biometric scans may be coming in live.
        // Seeding fake records for today would conflict with ProcessAttendanceLog.
        $today = Carbon::today(self::TZ);
        $startDate = $today->copy()->subDays(30);
        $endDate = $today->copy()->subDay();   // up to yesterday only

        /** @var Carbon[] $workdays */
        $workdays = collect(CarbonPeriod::create($startDate, $endDate))
            ->filter(fn (Carbon $d) => $d->isWeekday())
            ->values()
            ->all();

        $this->command->info('Workdays to seed: '.count($workdays));

        // ── 4. Main seeding loop ──────────────────────────────────────────────
        $total = 0;

        DB::transaction(function () use ($employees, $workdays, &$total) {
            foreach ($employees as $empIndex => $emp) {
                $this->command->line("  [{$emp->work_id}] {$emp->full_name}");

                foreach ($workdays as $dayIndex => $carbon) {
                    $date = $carbon->toDateString();
                    $locIndex = ($dayIndex * 7 + $empIndex * 11) % count(self::LOCATIONS);

                    // Rotate through all 11 scenarios so every pattern appears
                    $scenario = ($dayIndex + $empIndex * 3) % 11;
                    $this->seedScenario($emp, $date, $locIndex, $scenario);
                    $total++;
                }
            }
        });

        $this->command->info("Main loop done — {$total} record(s) seeded.");

        // ── 5. Today: 3 employees with open (still-working) records ──────────
        //
        // These represent employees who clocked in this morning but haven't
        // clocked out yet. One has a still_out whereabout slip.
        $todayStr = $today->toDateString();
        $openEmployees = $employees->take(3);

        DB::transaction(function () use ($openEmployees, $todayStr) {
            foreach ($openEmployees as $i => $emp) {
                $locIndex = ($i * 5) % count(self::LOCATIONS);
                $timeIn = $this->fuzzy(self::SCHED_IN, 5);

                // Clear any previously seeded record + slip for today
                AttendanceRecord::where('employee_id', $emp->employee_id)
                    ->where('date', $todayStr)
                    ->delete();

                WhereaboutSlip::where('employee_id', $emp->employee_id)
                    ->where('date_filed', $todayStr)
                    ->delete();

                $this->upsertRecord($emp, $todayStr, [
                    'time_in' => $timeIn,
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
                    'work_minutes' => null,   // still working — unknown yet
                    'status' => 'PRESENT',
                ]);

                // First employee also has a still_out slip
                if ($i === 0) {
                    $this->insertSlip($emp->employee_id, $todayStr, $locIndex, [
                        'purpose_type' => 'personal',
                        'purpose_description' => 'Personal errand — still out',
                        'time_out' => '10:00:00',
                        'time_returned' => null,
                        'date_returned' => null,
                        'date_noted' => null,
                        'time_noted' => '10:00:00',
                        'minutes_gone' => null,
                        'status' => 'still_out',
                    ]);
                }
            }
        });

        $this->command->info('Seeded 3 open (today) records.');

        // ── 6. Yesterday: 5 employees who never returned from an errand ───────
        $yesterday = $today->copy()->subDay();
        while ($yesterday->isWeekend()) {
            $yesterday->subDay();
        }
        $yesterdayStr = $yesterday->toDateString();
        $notRetEmployees = $employees->slice(3, 5);

        DB::transaction(function () use ($notRetEmployees, $yesterdayStr) {
            foreach ($notRetEmployees as $i => $emp) {
                $locIndex = (($i + 3) * 5) % count(self::LOCATIONS);
                $timeIn = $this->fuzzy(self::SCHED_IN, 5);

                WhereaboutSlip::where('employee_id', $emp->employee_id)
                    ->where('date_filed', $yesterdayStr)
                    ->delete();

                $this->upsertRecord($emp, $yesterdayStr, [
                    'time_in' => $timeIn,
                    'break_out' => null,
                    'break_in' => null,
                    'time_out' => null,
                    'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
                    'work_minutes' => null,
                    'status' => 'PRESENT',
                ]);

                $this->insertSlip($emp->employee_id, $yesterdayStr, $locIndex, [
                    'purpose_type' => 'personal',
                    'purpose_description' => 'Left for errand — never returned',
                    'time_out' => '14:00:00',
                    'time_returned' => null,
                    'date_returned' => null,
                    'date_noted' => null,
                    'time_noted' => '14:00:00',
                    'minutes_gone' => null,
                    'status' => 'not_returned',
                ]);
            }
        });

        $this->command->info("Seeded 5 not_returned slips for {$yesterdayStr}.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario dispatcher
    // ─────────────────────────────────────────────────────────────────────────

    private function seedScenario(Employee $emp, string $date, int $locIndex, int $scenario): void
    {
        match ($scenario) {
            0 => $this->scenarioPresentFullDay($emp, $date),
            1 => $this->scenarioPresentLate($emp, $date, 30),
            2 => $this->scenarioPresentLate($emp, $date, 90),
            3 => $this->scenarioPresentNoBreakScans($emp, $date),
            4 => $this->scenarioPresentWithPersonalSlip($emp, $date, $locIndex, 45),
            5 => $this->scenarioPresentLateWithPersonalSlip($emp, $date, $locIndex, 30),
            6 => $this->scenarioPresentWithOfficialSlip($emp, $date, $locIndex),
            7 => $this->scenarioPresentEarlyInLateOut($emp, $date),
            8 => $this->scenarioHalfDayMorning($emp, $date),
            9 => $this->scenarioHalfDayAfternoon($emp, $date),
            10 => $this->scenarioAbsent($emp, $date),
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario implementations
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Scenario 1 — PRESENT · On time · All 4 punches present
     *
     * time_in ≈ 08:00  break_out ≈ 12:00  break_in ≈ 13:00  time_out ≈ 17:00
     * work_minutes = (time_out - time_in) - break_duration
     */
    private function scenarioPresentFullDay(Employee $emp, string $date): void
    {
        $timeIn = $this->fuzzy(self::SCHED_IN, 5);
        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 3);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut, $breakOut, $breakIn),
            'status' => 'PRESENT',
        ]);
    }

    /**
     * Scenario 2 & 3 — PRESENT · Late by $lateMinutes · No break scans
     *
     * Employee skipped the biometric at lunch (common when people forget).
     * work_minutes = time_out - time_in (no break deduction since no break scans)
     */
    private function scenarioPresentLate(Employee $emp, string $date, int $lateMinutes): void
    {
        $timeIn = Carbon::parse(self::SCHED_IN)->addMinutes($lateMinutes)->format('H:i:s');
        $timeIn = $this->fuzzy($timeIn, 2);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => null,
            'break_in' => null,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut),
            'status' => 'PRESENT',
        ]);
    }

    /**
     * Scenario 4 — PRESENT · On time · No break scans
     *
     * Employee stayed through lunch (worked straight through).
     * work_minutes = time_out - time_in (full, no break deduction)
     */
    private function scenarioPresentNoBreakScans(Employee $emp, string $date): void
    {
        $timeIn = $this->fuzzy(self::SCHED_IN, 5);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => null,
            'break_in' => null,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut),
            'status' => 'PRESENT',
        ]);
    }

    /**
     * Scenario 5 — PRESENT · On time · Personal slip returned (deducted)
     *
     * Personal errand during work hours is deducted from work_minutes.
     * Slip is marked "returned" — deduction already applied.
     */
    private function scenarioPresentWithPersonalSlip(
        Employee $emp,
        string $date,
        int $locIndex,
        int $deductMinutes
    ): void {
        $timeIn = $this->fuzzy(self::SCHED_IN, 5);
        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 3);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        // Errand happens in the afternoon, safely within the work window
        $slipOut = '10:00:00';
        $slipReturned = Carbon::parse($slipOut)->addMinutes($deductMinutes)->format('H:i:s');

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut, $breakOut, $breakIn, $deductMinutes),
            'status' => 'PRESENT',
        ]);

        $this->insertSlip($emp->employee_id, $date, $locIndex, [
            'purpose_type' => 'personal',
            'purpose_description' => 'Personal errand',
            'time_out' => $slipOut,
            'time_returned' => $slipReturned,
            'date_returned' => $date,
            'date_noted' => $date,
            'time_noted' => Carbon::parse($slipReturned)->addMinutes(5)->format('H:i:s'),
            'minutes_gone' => $deductMinutes,
            'status' => 'returned',
        ]);
    }

    /**
     * Scenario 6 — PRESENT · Late · Personal slip returned (deducted)
     *
     * Both lateness AND slip deduction penalize work_minutes.
     */
    private function scenarioPresentLateWithPersonalSlip(
        Employee $emp,
        string $date,
        int $locIndex,
        int $deductMinutes
    ): void {
        $lateMinutes = 30;
        $timeIn = Carbon::parse(self::SCHED_IN)->addMinutes($lateMinutes)->format('H:i:s');
        $timeIn = $this->fuzzy($timeIn, 2);
        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 3);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $slipOut = '14:00:00';
        $slipReturned = Carbon::parse($slipOut)->addMinutes($deductMinutes)->format('H:i:s');

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut, $breakOut, $breakIn, $deductMinutes),
            'status' => 'PRESENT',
        ]);

        $this->insertSlip($emp->employee_id, $date, $locIndex, [
            'purpose_type' => 'personal',
            'purpose_description' => 'Dental appointment',
            'time_out' => $slipOut,
            'time_returned' => $slipReturned,
            'date_returned' => $date,
            'date_noted' => $date,
            'time_noted' => Carbon::parse($slipReturned)->addMinutes(5)->format('H:i:s'),
            'minutes_gone' => $deductMinutes,
            'status' => 'returned',
        ]);
    }

    /**
     * Scenario 7 — PRESENT · On time · Official slip returned (no deduction)
     *
     * Official business = company time. No work_minutes penalty.
     */
    private function scenarioPresentWithOfficialSlip(
        Employee $emp,
        string $date,
        int $locIndex
    ): void {
        $timeIn = $this->fuzzy(self::SCHED_IN, 5);
        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 3);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut, $breakOut, $breakIn, 0),
            'status' => 'PRESENT',
        ]);

        $this->insertSlip($emp->employee_id, $date, $locIndex, [
            'purpose_type' => 'official',
            'purpose_description' => 'City Hall document pickup',
            'time_out' => '14:00:00',
            'time_returned' => '15:00:00',
            'date_returned' => $date,
            'date_noted' => $date,
            'time_noted' => '15:05:00',
            'minutes_gone' => 60,
            'status' => 'returned',
        ]);
    }

    /**
     * Scenario 8 — PRESENT · Early in + late out (within caps)
     *
     * Clocked in before schedule and left after schedule — both within
     * the early_time_in and late_time_out caps.
     * work_minutes still uses actual time_in → time_out.
     */
    private function scenarioPresentEarlyInLateOut(Employee $emp, string $date): void
    {
        // early in: 45 min before schedule (within 60-min cap)
        $timeIn = Carbon::parse(self::SCHED_IN)->subMinutes(45)->format('H:i:s');
        $timeIn = $this->fuzzy($timeIn, 3);

        // late out: 45 min after schedule (within 60-min cap)
        $timeOut = Carbon::parse(self::SCHED_OUT)->addMinutes(45)->format('H:i:s');
        $timeOut = $this->fuzzy($timeOut, 3);

        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 3);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => 0,   // arrived early → not late
            'work_minutes' => $this->calcWorkMinutes($timeIn, $timeOut, $breakOut, $breakIn),
            'status' => 'PRESENT',
        ]);
    }

    /**
     * Scenario 9 — HALF_DAY · time_in + break_out only
     *
     * Employee clocked in, went on break at noon, and never returned.
     * work_minutes = time_in → break_out only.
     */
    private function scenarioHalfDayMorning(Employee $emp, string $date): void
    {
        $timeIn = $this->fuzzy(self::SCHED_IN, 5);
        $breakOut = $this->fuzzy(self::SCHED_BREAK_OUT, 3);

        $this->upsertRecord($emp, $date, [
            'time_in' => $timeIn,
            'break_out' => $breakOut,
            'break_in' => null,
            'time_out' => null,
            'late_minutes' => $this->calcLateMinutes(self::SCHED_IN, $timeIn),
            'work_minutes' => $this->calcWorkMinutes($timeIn, $breakOut),
            'status' => 'HALF_DAY',
        ]);
    }

    /**
     * Scenario 10 — HALF_DAY · break_in + time_out only
     *
     * Employee missed the morning entirely; first scan is the 1 PM break_in.
     * work_minutes = break_in → time_out only.
     */
    private function scenarioHalfDayAfternoon(Employee $emp, string $date): void
    {
        $breakIn = $this->fuzzy(self::SCHED_BREAK_IN, 5);
        $timeOut = $this->fuzzy(self::SCHED_OUT, 5);

        $this->upsertRecord($emp, $date, [
            'time_in' => null,
            'break_out' => null,
            'break_in' => $breakIn,
            'time_out' => $timeOut,
            'late_minutes' => null,   // no time_in → no late calculation
            'work_minutes' => $this->calcWorkMinutes($breakIn, $timeOut),
            'status' => 'HALF_DAY',
        ]);
    }

    /**
     * Scenario 11 — ABSENT · No scans recorded
     */
    private function scenarioAbsent(Employee $emp, string $date): void
    {
        $this->upsertRecord($emp, $date, [
            'time_in' => null,
            'break_out' => null,
            'break_in' => null,
            'time_out' => null,
            'late_minutes' => null,
            'work_minutes' => null,
            'status' => 'ABSENT',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Computation helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add a random drift of ± $driftSeconds to a time string.
     * Produces realistic-looking scan times (e.g. 07:58:41 instead of 08:00:00).
     *
     * @param  string  $time  Base time, e.g. '08:00:00'
     * @param  int  $driftMinutes  Max drift in minutes (applied in both directions)
     * @return string H:i:s
     */
    private function fuzzy(string $time, int $driftMinutes = 5): string
    {
        $drift = rand(-$driftMinutes * 60, $driftMinutes * 60);

        return Carbon::parse($time)->addSeconds($drift)->format('H:i:s');
    }

    /**
     * Compute late_minutes strictly — no grace period.
     *
     *   scheduled 08:00, actual 08:15 → 15
     *   scheduled 08:00, actual 07:55 →  0 (early is not negative)
     */
    private function calcLateMinutes(string $scheduled, string $actual): int
    {
        $diff = Carbon::parse($scheduled)->diffInMinutes(Carbon::parse($actual), false);

        return max(0, (int) $diff);
    }

    /**
     * Compute work_minutes.
     *
     *   work = (timeOut - timeIn) - breakDuration - personalDeductions
     *
     * breakDuration is only subtracted when BOTH break_out and break_in exist.
     * personal deductions (whereabout slips) are subtracted on top.
     */
    private function calcWorkMinutes(
        string $timeIn,
        string $timeOut,
        ?string $breakOut = null,
        ?string $breakIn = null,
        int $personalDeductions = 0
    ): int {
        $total = Carbon::parse($timeIn)->diffInMinutes(Carbon::parse($timeOut));

        $breakDuration = ($breakOut !== null && $breakIn !== null)
            ? Carbon::parse($breakOut)->diffInMinutes(Carbon::parse($breakIn))
            : 0;

        return max(0, (int) $total - (int) $breakDuration - $personalDeductions);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Persistence helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Upsert a single AttendanceRecord.
     * Always stamps the standard scheduled columns from the seeder constants.
     */
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
     * Insert a WhereaboutSlip.
     * Picks a location from the pool by index.
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
