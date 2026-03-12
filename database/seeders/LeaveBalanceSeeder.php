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
    //   • Forced Leave          — granted when VL balance ≥ 10 days
    //   • Special Privilege Leave — granted when VL balance ≥ 10 days
    //
    // GRANTED AT FILING (validated on-demand, not pre-allocated):
    //   • Special Leave Benefit for Women — requires 6 months aggregate service
    //     in the last 12 months prior to surgery (rolling lookback per RA 9710).
    //     The eligibility window is relative to the surgery date, so a standing
    //     balance row would be misleading. LeaveBalanceService::checkSLBEligibility()
    //     handles this at leave filing time.
    //
    // These names must exactly match leave_type_name in leave_types table.
    // ──────────────────────────────────────────────────────────────────────────
    private const SKIP_SEEDING = [
        'Forced Leave',
        'Special Privilege Leave',
        'Special Leave Benefit for Women',
        // Leave Without Pay has no entitlements — nothing to seed
        'Leave Without Pay',
    ];

    // ── Sex-restricted leave types ────────────────────────────────────────────
    // Key = leave_type_name, value = required sex string on the LeaveType record.
    // Employees of the wrong sex are skipped entirely for these types.
    // ──────────────────────────────────────────────────────────────────────────
    private const SEX_RESTRICTED = [
        'Maternity Leave'                 => 'Female',
        'Paternity Leave'                 => 'Male',
        'VAWC Leave'                      => 'Female',
    ];

    // ── Accrual leave types ───────────────────────────────────────────────────
    // Start with 0.0 balance — their balance grows through monthly accrual
    // postings in LeaveAccrualController. The entitlement row defines the
    // annual target (15 days), not the opening balance.
    // ──────────────────────────────────────────────────────────────────────────
    private const ACCRUAL_TYPES = [
        'Vacation Leave',
        'Sick Leave',
    ];

    public function run(): void
    {
        DB::table('employee_leave_balances')->delete();

        $cycleYear = now()->year;
        $now       = now()->toDateTimeString();

        // ── Load all active leave types with their first entitlement ──────────
        // We use the first (lowest days_entitled) entitlement row as the opening
        // balance for non-accrual types. Skipped types are excluded entirely.
        $leaveTypes = LeaveType::where('status', true)
            ->whereNotIn('leave_type_name', self::SKIP_SEEDING)
            ->with([
                'entitlements' => fn($q) => $q->orderBy('days_entitled'),
            ])
            ->get();

        // ── Load all active employees with sex ────────────────────────────────
        // sex: 0 = Male, 1 = Female
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
                // Accrual types (VL, SL) always start at 0 — their balance
                // is built up through monthly accrual postings.
                //
                // All other types use the minimum entitlement row as the
                // opening balance (the flat grant for that leave type).
                if (in_array($lt->leave_type_name, self::ACCRUAL_TYPES, true)) {
                    $openingBalance = 0.0;
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

        // Batch insert — avoids memory issues with large employee × leave type sets
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('employee_leave_balances')->insert($chunk);
        }

        $this->command->info(sprintf(
            'LeaveBalanceSeeder: inserted %d balance records for %d employees across %d leave types.',
            count($rows),
            $employees->count(),
            $leaveTypes->count(),
        ));

        $this->command->warn('Note: Forced Leave, Special Privilege Leave — granted automatically when VL ≥ 10 (run CheckLeaveEntitlements command).');
        $this->command->warn('Note: Special Leave Benefit for Women — validated at leave filing time (6-month rolling lookback).');
    }
}