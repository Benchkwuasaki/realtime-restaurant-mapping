<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeaveBalanceService
{
    // ─── VL threshold grants ──────────────────────────────────────────────────
    //
    // When an employee's Vacation Leave balance reaches ≥ 10 days they are
    // automatically granted two additional leave types drawn from their VL:
    //
    //   • Forced Leave (5 days)            — mandatory annual VL consumption
    //   • Special Privilege Leave (3 days) — personal milestones / family events
    //
    // Both are NON-CUMULATIVE: forfeited at year-end if unused.
    // VL is NOT deducted at grant time — deduction happens at leave filing.
    // Once granted, they are NEVER revoked even if VL later drops below 10.
    // ─────────────────────────────────────────────────────────────────────────

    private const VL_THRESHOLD = 10.0;

    private const THRESHOLD_GRANTS = [
        'Forced Leave'            => 5.0,
        'Special Privilege Leave' => 3.0,
    ];

    // ─── SLB constants ────────────────────────────────────────────────────────
    //
    // Special Leave Benefit for Women (RA 9710 — Magna Carta of Women):
    //   • Up to 60 working days (2 months) for gynecological surgery
    //   • Employee must have rendered ≥ 6 months AGGREGATE service in the
    //     12-month rolling window immediately preceding the surgery date
    //   • "Aggregate" = total calendar months employed in that window;
    //     gaps in service are allowed — it is not required to be continuous
    //   • Non-cumulative: unused days are forfeited at year-end
    //   • NOT pre-seeded — validated and granted at leave filing time
    // ─────────────────────────────────────────────────────────────────────────

    private const SLB_ENTITLED_DAYS   = 60.0;
    private const SLB_REQUIRED_MONTHS = 6;
    private const SLB_LOOKBACK_MONTHS = 12;
    private const SLB_LEAVE_TYPE_NAME = 'Special Leave Benefit for Women';

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check a single employee's VL balance and grant Forced Leave and
     * Special Privilege Leave balance rows if:
     *   (a) VL balance ≥ 10 days, AND
     *   (b) the grant row does not already exist for this cycle year.
     *
     * Idempotent — safe to call multiple times in the same cycle year.
     *
     * @return string[]  Names of leave types newly granted (empty if none)
     */
    public function applyThresholdGrants(int $employeeId, int $cycleYear): array
    {
        $granted = [];

        $vlType = $this->getLeaveType('Vacation Leave');
        if (! $vlType) return $granted;

        $vlBalance = EmployeeLeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $vlType->leave_type_id)
            ->where('cycle_year', $cycleYear)
            ->first();

        if (! $vlBalance || (float) $vlBalance->balance < self::VL_THRESHOLD) {
            return $granted;
        }

        foreach (self::THRESHOLD_GRANTS as $typeName => $entitledDays) {
            $leaveType = $this->getLeaveType($typeName);
            if (! $leaveType) continue;

            $alreadyGranted = EmployeeLeaveBalance::where('employee_id', $employeeId)
                ->where('leave_type_id', $leaveType->leave_type_id)
                ->where('cycle_year', $cycleYear)
                ->exists();

            if ($alreadyGranted) continue;

            EmployeeLeaveBalance::create([
                'employee_id'   => $employeeId,
                'leave_type_id' => $leaveType->leave_type_id,
                'cycle_year'    => $cycleYear,
                'total_days'    => $entitledDays,
                'used_days'     => 0.0,
                'balance'       => $entitledDays,
            ]);

            $granted[] = $typeName;
        }

        return $granted;
    }

    /**
     * Run applyThresholdGrants for every employee with any balance row in
     * the given cycle year. Used by the scheduled Artisan command and the
     * manual HR bulk-check action in LeaveBalanceController.
     *
     * @return array<int, string[]>  employee_id => [granted leave type names]
     */
    public function applyThresholdGrantsForYear(int $cycleYear): array
    {
        $employeeIds = EmployeeLeaveBalance::where('cycle_year', $cycleYear)
            ->pluck('employee_id')
            ->unique()
            ->values();

        $summary = [];

        foreach ($employeeIds as $employeeId) {
            $granted = $this->applyThresholdGrants($employeeId, $cycleYear);
            if (! empty($granted)) {
                $summary[$employeeId] = $granted;
            }
        }

        return $summary;
    }

    /**
     * Check whether a female employee qualifies for the Special Leave Benefit
     * for Women as of a given reference date (normally the surgery/filing date).
     *
     * Eligibility rule (RA 9710 / CSC):
     *   The employee must have rendered at least 6 months of AGGREGATE service
     *   within the 12-month window immediately preceding the reference date.
     *
     *   "Aggregate" means the total number of calendar months during which the
     *   employee had an active employment status inside that window. Gaps in
     *   service are allowed — continuity is NOT required.
     *
     *   We compute this as: the number of calendar months in the intersection of
     *   [lookback_start, reference_date] and [date_hired, reference_date].
     *
     * @param  int          $employeeId
     * @param  Carbon|null  $referenceDate  Surgery or filing date. Defaults to today.
     * @return array{
     *   eligible: bool,
     *   months_of_service: int,
     *   required_months: int,
     *   lookback_from: string,
     *   lookback_to: string,
     *   reason: string,
     * }
     */
    public function checkSLBEligibility(int $employeeId, ?Carbon $referenceDate = null): array
    {
        $referenceDate = $referenceDate ?? Carbon::today();
        $lookbackFrom  = $referenceDate->copy()->subMonths(self::SLB_LOOKBACK_MONTHS)->startOfMonth();
        $lookbackTo    = $referenceDate->copy()->endOfMonth();

        // ── Load employee ─────────────────────────────────────────────────────
        $employee = Employee::withTrashed()->with('basicInfo')->find($employeeId);

        if (! $employee) {
            return $this->slbResult(false, 0, $lookbackFrom, $lookbackTo, 'Employee not found.');
        }

        // ── Sex check — SLB is female-only ───────────────────────────────────
        $isFemale = (bool) ($employee->basicInfo?->sex ?? false); // 1 = Female
        if (! $isFemale) {
            return $this->slbResult(false, 0, $lookbackFrom, $lookbackTo, 'Employee is not female.');
        }

        // ── Aggregate months of service in the lookback window ────────────────
        // Effective window = intersection of [lookbackFrom, referenceDate]
        // and [date_hired, today]. We count complete calendar months.
        $dateHired      = Carbon::parse($employee->date_hired)->startOfMonth();
        $effectiveStart = $dateHired->greaterThan($lookbackFrom) ? $dateHired : $lookbackFrom->copy();
        $effectiveEnd   = $referenceDate->copy()->endOfMonth();

        if ($effectiveStart->greaterThan($effectiveEnd)) {
            return $this->slbResult(
                false, 0, $lookbackFrom, $lookbackTo,
                'Employee was not yet hired within the 12-month lookback window.'
            );
        }

        // diffInMonths gives complete months; +1 to include the starting month
        $monthsOfService = (int) $effectiveStart->diffInMonths($effectiveEnd) + 1;
        // Cap at the lookback window ceiling
        $monthsOfService = min($monthsOfService, self::SLB_LOOKBACK_MONTHS);

        $eligible = $monthsOfService >= self::SLB_REQUIRED_MONTHS;

        $reason = $eligible
            ? "Eligible: {$monthsOfService} month(s) of aggregate service in the last " . self::SLB_LOOKBACK_MONTHS . " months (minimum required: " . self::SLB_REQUIRED_MONTHS . ")."
            : "Not eligible: only {$monthsOfService} month(s) of aggregate service in the last " . self::SLB_LOOKBACK_MONTHS . " months (minimum required: " . self::SLB_REQUIRED_MONTHS . ").";

        return $this->slbResult($eligible, $monthsOfService, $lookbackFrom, $lookbackTo, $reason);
    }

    /**
     * Grant the SLB balance row for a female employee if she passes the
     * eligibility check. Intended to be called from the leave filing controller
     * when an SLB application is submitted.
     *
     * If a balance row already exists for this cycle year it is NOT overwritten —
     * the employee may be mid-leave. The caller should check the remaining
     * balance on the existing row instead.
     *
     * @param  int          $employeeId
     * @param  Carbon|null  $referenceDate  Surgery or filing date. Defaults to today.
     * @return array{granted: bool, reason: string, balance_id: int|null}
     */
    public function applySLBGrant(int $employeeId, ?Carbon $referenceDate = null): array
    {
        $referenceDate = $referenceDate ?? Carbon::today();
        $cycleYear     = $referenceDate->year;

        $eligibility = $this->checkSLBEligibility($employeeId, $referenceDate);

        if (! $eligibility['eligible']) {
            return ['granted' => false, 'reason' => $eligibility['reason'], 'balance_id' => null];
        }

        $slbType = $this->getLeaveType(self::SLB_LEAVE_TYPE_NAME);
        if (! $slbType) {
            return [
                'granted'    => false,
                'reason'     => 'Special Leave Benefit for Women leave type is not configured in the system.',
                'balance_id' => null,
            ];
        }

        // If already exists for this cycle year, return existing record
        $existing = EmployeeLeaveBalance::where('employee_id', $employeeId)
            ->where('leave_type_id', $slbType->leave_type_id)
            ->where('cycle_year', $cycleYear)
            ->first();

        if ($existing) {
            return [
                'granted'    => false,
                'reason'     => "SLB balance already granted for {$cycleYear} — {$existing->balance} day(s) remaining.",
                'balance_id' => $existing->employee_leave_balance_id,
            ];
        }

        $balance = EmployeeLeaveBalance::create([
            'employee_id'   => $employeeId,
            'leave_type_id' => $slbType->leave_type_id,
            'cycle_year'    => $cycleYear,
            'total_days'    => self::SLB_ENTITLED_DAYS,
            'used_days'     => 0.0,
            'balance'       => self::SLB_ENTITLED_DAYS,
        ]);

        return [
            'granted'    => true,
            'reason'     => $eligibility['reason'],
            'balance_id' => $balance->employee_leave_balance_id,
        ];
    }

    /**
     * Manually adjust a leave balance row (HR correction).
     * Recomputes balance = total_days - used_days and re-checks VL threshold
     * in case the adjustment pushed VL over 10 days.
     */
    public function adjustBalance(
        int   $employeeLeaveBalanceId,
        float $totalDays,
        float $usedDays,
    ): EmployeeLeaveBalance {
        $balance = EmployeeLeaveBalance::findOrFail($employeeLeaveBalanceId);

        $computed = max(0.0, round($totalDays - $usedDays, 4));

        $balance->update([
            'total_days' => round($totalDays, 4),
            'used_days'  => round($usedDays, 4),
            'balance'    => $computed,
        ]);

        // Re-check VL threshold — the adjustment may have pushed VL ≥ 10
        $this->applyThresholdGrants($balance->employee_id, $balance->cycle_year);

        return $balance->fresh();
    }

    /**
     * Get all leave balance rows for a single employee for the given cycle year.
     */
    public function getEmployeeBalances(int $employeeId, int $cycleYear): Collection
    {
        return EmployeeLeaveBalance::with('leaveType')
            ->where('employee_id', $employeeId)
            ->where('cycle_year', $cycleYear)
            ->get()
            ->map(fn($b) => [
                'employee_leave_balance_id' => $b->employee_leave_balance_id,
                'leave_type_id'             => $b->leave_type_id,
                'leave_type_name'           => $b->leaveType?->leave_type_name ?? '—',
                'is_accrual'                => (bool) $b->leaveType?->is_accrual,
                'total_days'                => (float) $b->total_days,
                'used_days'                 => (float) $b->used_days,
                'balance'                   => (float) $b->balance,
            ]);
    }

    /**
     * Get all employees with their balances for the given cycle year,
     * shaped for the Leave Balances tab table.
     */
    public function getBalancesTable(int $cycleYear, string $search = ''): Collection
    {
        $employees = Employee::with([
            'basicInfo',
            'item.position.department',
            'leaveBalances' => fn($q) => $q
                ->where('cycle_year', $cycleYear)
                ->with('leaveType'),
        ])
            ->where('status', true)
            ->get();

        if ($search !== '') {
            $q         = strtolower($search);
            $employees = $employees->filter(
                fn($e) =>
                str_contains(strtolower($e->basicInfo?->full_name ?? ''), $q) ||
                str_contains(strtolower($e->item?->position?->department?->department_name ?? ''), $q) ||
                str_contains(strtolower($e->employment_classification ?? ''), $q)
            );
        }

        return $employees
            ->filter(fn($e) => $e->leaveBalances->isNotEmpty())
            ->map(fn($e) => [
                'employee_id'               => $e->employee_id,
                'name'                      => $e->basicInfo?->full_name ?? '—',
                'avatar_url'                => $e->avatar_url,
                'department'                => $e->item?->position?->department?->department_name ?? '—',
                'employment_classification' => $e->employment_classification ?? '—',
                'leave_balances'            => $e->leaveBalances
                    ->map(fn($b) => [
                        'employee_leave_balance_id' => $b->employee_leave_balance_id,
                        'leave_type_id'             => $b->leave_type_id,
                        'leave_type_name'           => $b->leaveType?->leave_type_name ?? '—',
                        'total_days'                => (float) $b->total_days,
                        'used_days'                 => (float) $b->used_days,
                        'balance'                   => (float) $b->balance,
                    ])
                    ->values()
                    ->all(),
            ])
            ->sortBy('name')
            ->values();
    }

    /**
     * Returns all distinct cycle years that have balance records,
     * always including the current year.
     */
    public function getCycleYears(): array
    {
        $years = EmployeeLeaveBalance::select('cycle_year')
            ->distinct()
            ->orderByDesc('cycle_year')
            ->pluck('cycle_year')
            ->map(fn($y) => (int) $y)
            ->toArray();

        $currentYear = (int) date('Y');
        if (! in_array($currentYear, $years, true)) {
            array_unshift($years, $currentYear);
        }

        return $years;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** In-memory cache to avoid repeated DB hits per request when looping employees. */
    private array $leaveTypeCache = [];

    private function getLeaveType(string $name): ?LeaveType
    {
        if (! array_key_exists($name, $this->leaveTypeCache)) {
            $this->leaveTypeCache[$name] = LeaveType::where('leave_type_name', $name)
                ->where('status', true)
                ->first();
        }

        return $this->leaveTypeCache[$name] ?: null;
    }

    private function slbResult(
        bool   $eligible,
        int    $months,
        Carbon $from,
        Carbon $to,
        string $reason
    ): array {
        return [
            'eligible'          => $eligible,
            'months_of_service' => $months,
            'required_months'   => self::SLB_REQUIRED_MONTHS,
            'lookback_from'     => $from->toDateString(),
            'lookback_to'       => $to->toDateString(),
            'reason'            => $reason,
        ];
    }
}