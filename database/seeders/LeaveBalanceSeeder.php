<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\LeaveType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeaveBalanceSeeder extends Seeder
{
    // ── Leave types whose balance rows are NOT pre-seeded ─────────────────────
    //
    // DYNAMICALLY GRANTED (by LeaveBalanceService at runtime):
    //   • Forced Leave            — granted when VL balance ≥ 10 days
    //   • Special Privilege Leave — granted when VL balance ≥ 10 days
    //
    // GRANTED AT FILING (validated on-demand, not pre-allocated):
    //   • Maternity Leave               — event-driven (live birth / miscarriage);
    //     days depend on the declared event_type. No standing balance makes sense.
    //   • Special Leave Benefit for Women — requires 6 months aggregate service
    //     in the last 12 months prior to surgery (rolling lookback per RA 9710).
    //
    // These names must exactly match leave_type_name in the leave_types table.
    // ──────────────────────────────────────────────────────────────────────────
    private const SKIP_SEEDING = [
        'Forced Leave',
        'Special Privilege Leave',
        'Maternity Leave',
        'Special Leave Benefit for Women',
        // Leave Without Pay has no entitlements — nothing to seed
        'Leave Without Pay',
    ];

    // ── Sex-restricted leave types ────────────────────────────────────────────
    private const SEX_RESTRICTED = [
        'Paternity Leave' => 'Male',
        'VAWC Leave'      => 'Female',
    ];

    // ── Accrual leave types ───────────────────────────────────────────────────
    // Seeded with a 10-day opening balance for dev/testing purposes.
    // In production, these grow through monthly accrual postings (1.25 days/month).
    // ──────────────────────────────────────────────────────────────────────────
    private const ACCRUAL_TYPES = [
        'Vacation Leave',
        'Sick Leave',
    ];

    private const ACCRUAL_OPENING_BALANCE = 10.0;

    public function run(): void
    {
        DB::table('employee_leave_balances')->delete();

        $cycleYear = now()->year;
        $now       = now()->toDateTimeString();

        // ── Load all active leave types with their entitlements ───────────────
        // For non-accrual, non-event-driven types, we use the sole entitlement
        // row as the flat opening balance. Types with multiple event-dependent
        // rows (Maternity Leave) are excluded via SKIP_SEEDING above.
        $leaveTypes = LeaveType::where('status', true)
            ->whereNotIn('leave_type_name', self::SKIP_SEEDING)
            ->with([
                'entitlements' => fn($q) => $q->orderBy('days_entitled'),
            ])
            ->get();

        // ── Load all active employees with sex ────────────────────────────────
        $employees = DB::table('employees as e')
            ->join('employee_basic_info as b', 'b.employee_basic_info_id', '=', 'e.employee_basic_info_id')
            ->where('e.status', true)
            ->whereNull('e.deleted_at')
            ->select('e.employee_id', 'b.sex', 'e.date_hired')
            ->get();

        $rows = [];

        foreach ($employees as $employee) {
            $isFemale = (bool) $employee->sex; // 1 = Female, 0 = Male

            foreach ($leaveTypes as $lt) {

                // ── Sex eligibility ───────────────────────────────────────────
                if (isset(self::SEX_RESTRICTED[$lt->leave_type_name])) {
                    $requiredSex = self::SEX_RESTRICTED[$lt->leave_type_name];

                    if ($requiredSex === 'Female' && ! $isFemale) continue;
                    if ($requiredSex === 'Male'   &&   $isFemale) continue;
                }

                // ── Opening balance ───────────────────────────────────────────
                if (in_array($lt->leave_type_name, self::ACCRUAL_TYPES, true)) {
                    $openingBalance = self::ACCRUAL_OPENING_BALANCE;
                } else {
                    $firstEntitlement = $lt->entitlements->first();
                    $openingBalance   = $firstEntitlement
                        ? (float) $firstEntitlement->days_entitled
                        : 0.0;
                }

                $rows[] = [
                    'employee_id'   => $employee->employee_id,
                    'leave_type_id' => $lt->leave_type_id,
                    'cycle_year'    => $cycleYear,
                    'total_days'    => round($openingBalance, 4),
                    'used_days'     => 0.0,
                    'balance'       => round($openingBalance, 4),
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('employee_leave_balances')->insert($chunk);
        }

        $this->command->info(sprintf(
            'LeaveBalanceSeeder: inserted %d balance records for %d employees across %d leave types.',
            count($rows),
            $employees->count(),
            $leaveTypes->count(),
        ));

        $this->command->warn('Note: Vacation Leave and Sick Leave seeded with ' . self::ACCRUAL_OPENING_BALANCE . ' days opening balance (dev/testing).');
        $this->command->warn('Note: Forced Leave, Special Privilege Leave — granted automatically when VL ≥ 10 (run leave:check-entitlements command).');
        $this->command->warn('Note: Maternity Leave — granted at filing time based on declared event (live_birth / miscarriage).');
        $this->command->warn('Note: Special Leave Benefit for Women — validated at filing time (6-month rolling lookback).');
    }
}