<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveType;
use App\Services\LeaveBalanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveBalanceController extends Controller
{
    public function __construct(protected LeaveBalanceService $service)
    {
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Index – Leave Balances tab
    // GET /leave/balances?year=2026&search=
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $currentYear = (int) date('Y');
        $cycleYear = $request->integer('year', $currentYear) ?: $currentYear;
        $search = (string) $request->get('search', '');

        $cycleYears = $this->service->getCycleYears();

        // All active leave types (not just accrual) — for column headers
        $leaveTypes = LeaveType::where('status', true)
        ->whereIn('availment_type', 'intermittent')
            ->get(['leave_type_id', 'leave_type_name']);
        dd($leaveTypes);

        // Accrual-only types — for the posting wizard leave type selector
        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);
        dd($availableLeaveTypes);
        $balancesData = $this->service->getBalancesTable($cycleYear, $search);

        return Inertia::render('Leave/Balances/Index', [
            'tab' => 'balances',
            'available_leave_types' => $availableLeaveTypes,
            'balances_data' => $balancesData,
            'balances_leave_types' => $leaveTypes,
            'balances_cycle_year' => $cycleYear,
            'balances_cycle_years' => $cycleYears,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Show – Single employee's leave balances
    // GET /leave/balances/{employee}
    // ─────────────────────────────────────────────────────────────────────────

    public function show(Request $request, Employee $employee): Response
    {
        $currentYear = (int) date('Y');
        $cycleYear = $request->integer('year', $currentYear) ?: $currentYear;
        $cycleYears = $this->service->getCycleYears();

        $balances = $this->service->getEmployeeBalances($employee->employee_id, $cycleYear);

        // Check and apply any pending threshold grants before rendering
        $this->service->applyThresholdGrants($employee->employee_id, $cycleYear);
        $balances = $this->service->getEmployeeBalances($employee->employee_id, $cycleYear);

        return Inertia::render('Leave/Balances/Show', [
            'employee' => [
                'employee_id' => $employee->employee_id,
                'name' => $employee->basicInfo?->full_name ?? '—',
                'avatar_url' => $employee->avatar_url,
                'department' => $employee->item?->position?->department?->department_name ?? '—',
                'employment_classification' => $employee->employment_classification ?? '—',
            ],
            'balances' => $balances,
            'cycle_year' => $cycleYear,
            'cycle_years' => $cycleYears,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update – Manual HR adjustment of a single balance row
    // PUT /leave/balances/entry/{balance}
    // ─────────────────────────────────────────────────────────────────────────

    public function update(Request $request, EmployeeLeaveBalance $balance): RedirectResponse
    {
        $data = $request->validate([
            'total_days' => ['required', 'numeric', 'min:0', 'max:999'],
            'used_days' => ['required', 'numeric', 'min:0', 'max:999'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['used_days'] > $data['total_days']) {
            return back()->withErrors([
                'used_days' => 'Used days cannot exceed total days.',
            ]);
        }

        $this->service->adjustBalance(
            $balance->employee_leave_balance_id,
            (float) $data['total_days'],
            (float) $data['used_days'],
            $data['remarks'] ?? ''
        );

        return back()->with('success', 'Leave balance updated successfully.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Check Thresholds – Bulk apply VL ≥ 10 grants for a cycle year
    // POST /leave/balances/check-thresholds
    //
    // This can be called manually by HR or triggered by a scheduled command.
    // It is fully idempotent — safe to run multiple times.
    // ─────────────────────────────────────────────────────────────────────────

    public function checkThresholds(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'cycle_year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $cycleYear = (int) $data['cycle_year'];

        $summary = $this->service->applyThresholdGrantsForYear($cycleYear);

        $totalGranted = count($summary);

        $message = $totalGranted > 0
            ? "Threshold grants applied for {$cycleYear}: {$totalGranted} employee(s) received Forced/Special Leave."
            : "No new threshold grants needed for {$cycleYear}. All qualifying employees are already up to date.";

        return back()->with('success', $message);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Grant – Manually grant a specific leave type to an employee
    // POST /leave/balances/grant
    //
    // Used by HR to manually add a one-off leave type balance (e.g. a court-
    // ordered leave, special circumstance). Not related to threshold grants.
    // ─────────────────────────────────────────────────────────────────────────

    public function grant(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,employee_id'],
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,leave_type_id'],
            'cycle_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'total_days' => ['required', 'numeric', 'min:0.01', 'max:999'],
            'remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $exists = EmployeeLeaveBalance::where('employee_id', $data['employee_id'])
            ->where('leave_type_id', $data['leave_type_id'])
            ->where('cycle_year', $data['cycle_year'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'leave_type_id' => 'This employee already has a balance row for this leave type and cycle year. Use the adjust action instead.',
            ]);
        }

        EmployeeLeaveBalance::create([
            'employee_id' => $data['employee_id'],
            'leave_type_id' => $data['leave_type_id'],
            'cycle_year' => $data['cycle_year'],
            'total_days' => round((float) $data['total_days'], 4),
            'used_days' => 0.0,
            'balance' => round((float) $data['total_days'], 4),
        ]);

        return back()->with('success', 'Leave balance granted successfully.');
    }
}