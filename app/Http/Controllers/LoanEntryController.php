<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\InternalOrganization;
use App\Models\Loan;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanEntryController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id'     => Auth::id(),
            'module'      => 'payroll',
            'description' => 'Viewed Loan Entry Page',
        ]);

        $loans = Loan::with(['employee.basicInfo', 'internalOrganization'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn(Loan $l) => [
                'id'                       => $l->id,
                'employee_id'              => $l->employee_id,
                'employee_name'            => $l->employee?->basicInfo
                    ? $l->employee->basicInfo->last_name . ', ' . $l->employee->basicInfo->first_name
                    : '—',
                'employee_position'        => $l->employee?->basicInfo?->position_title ?? null,
                'loan_type'                => $l->loan_type,
                'source'                   => $l->source,
                'internal_organization_id' => $l->internal_organization_id,
                'organization_name'        => $l->internalOrganization?->name ?? null,
                'total_amount'             => (float) $l->total_amount,
                'monthly_amortization'     => (float) $l->monthly_amortization,
                'semi_monthly_deduction'   => (float) $l->semi_monthly_deduction,
                'balance'                  => (float) $l->balance,
                'start_period'             => $l->start_period,
                'end_period'               => $l->end_period,
                'status'                   => $l->status,
            ]);

        $employees = Employee::with('basicInfo')
            ->where('status', true)
            ->get()
            ->sortBy(fn(Employee $e) => $e->basicInfo?->last_name)
            ->values()
            ->map(fn(Employee $e) => [
                'id'       => $e->employee_id,
                'full_name' => $e->basicInfo
                    ? $e->basicInfo->last_name . ', ' . $e->basicInfo->first_name
                    : '—',
                'position' => $e->basicInfo?->position_title ?? null,
            ]);

        // Internal orgs available for loan entry
        // Shape: [ { id, name, type } ]
        $internalOrganizations = InternalOrganization::where('payroll_deduction_linked', true)
            ->where('status', true)
            ->orderBy('name')
            ->get()
            ->map(fn(InternalOrganization $org) => [
                'id'   => (string) $org->internal_organization_id,
                'name' => $org->name,
                'type' => $org->type,
            ])
            ->values();

        return Inertia::render('Payroll/Earnings&Deductions/LoanEntry/Index', [
            'loans'                 => $loans,
            'employees'             => $employees,
            'internalOrganizations' => $internalOrganizations,
        ]);
    }

    public function store(Request $request)
    {
        $isInternalOrg = ! empty($request->input('internal_organization_id'));

        $rules = [
            'employee_id'   => 'required|exists:employees,employee_id',
            'loan_type'     => 'required|string|max:100',
            'source'        => 'required|string|max:255',
            'total_amount'  => 'required|numeric|min:0',
            'term_months'   => 'required|integer|min:1',
            'start_period'  => 'required|string|max:7',
            'status'        => 'required|in:Active,Completed,Suspended',
        ];

        if ($isInternalOrg) {
            $rules['internal_organization_id'] = 'required|exists:internal_organizations,internal_organization_id';
        }

        $validated = $request->validate($rules);

        $termMonths            = (int) $validated['term_months'];
        $totalAmount           = (float) $validated['total_amount'];
        $monthlyAmortization   = round($totalAmount / $termMonths, 2);
        $semiMonthlyDeduction  = round($monthlyAmortization / 2, 2);

        // Compute end_period from start_period + term_months
        $startCarbon = \Carbon\Carbon::createFromFormat('Y-m', $validated['start_period']);
        $endPeriod   = $startCarbon->copy()->addMonths($termMonths - 1)->format('Y-m');

        Loan::create([
            'employee_id'              => $validated['employee_id'],
            'loan_type'                => $validated['loan_type'],
            'source'                   => $validated['source'],
            'internal_organization_id' => $validated['internal_organization_id'] ?? null,
            'total_amount'             => $totalAmount,
            'monthly_amortization'     => $monthlyAmortization,
            'semi_monthly_deduction'   => $semiMonthlyDeduction,
            'balance'                  => $totalAmount,
            'start_period'             => $validated['start_period'],
            'end_period'               => $endPeriod,
            'status'                   => $validated['status'],
        ]);

        $this->activityLogService->createLog([
            'user_id'     => Auth::id(),
            'module'      => 'payroll',
            'description' => 'Created Loan Entry',
        ]);

        return back()->with('success', 'Loan entry created successfully.');
    }

    public function update(Request $request, Loan $loan)
    {
        $isInternalOrg = ! empty($request->input('internal_organization_id'));

        $rules = [
            'employee_id'   => 'required|exists:employees,employee_id',
            'loan_type'     => 'required|string|max:100',
            'source'        => 'required|string|max:255',
            'total_amount'  => 'required|numeric|min:0',
            'term_months'   => 'required|integer|min:1',
            'start_period'  => 'required|string|max:7',
            'status'        => 'required|in:Active,Completed,Suspended',
        ];

        if ($isInternalOrg) {
            $rules['internal_organization_id'] = 'required|exists:internal_organizations,internal_organization_id';
        }

        $validated = $request->validate($rules);

        $termMonths           = (int) $validated['term_months'];
        $totalAmount          = (float) $validated['total_amount'];
        $monthlyAmortization  = round($totalAmount / $termMonths, 2);
        $semiMonthlyDeduction = round($monthlyAmortization / 2, 2);

        $startCarbon = \Carbon\Carbon::createFromFormat('Y-m', $validated['start_period']);
        $endPeriod   = $startCarbon->copy()->addMonths($termMonths - 1)->format('Y-m');

        $loan->update([
            'employee_id'              => $validated['employee_id'],
            'loan_type'                => $validated['loan_type'],
            'source'                   => $validated['source'],
            'internal_organization_id' => $validated['internal_organization_id'] ?? null,
            'total_amount'             => $totalAmount,
            'monthly_amortization'     => $monthlyAmortization,
            'semi_monthly_deduction'   => $semiMonthlyDeduction,
            'start_period'             => $validated['start_period'],
            'end_period'               => $endPeriod,
            'status'                   => $validated['status'],
        ]);

        $this->activityLogService->createLog([
            'user_id'     => Auth::id(),
            'module'      => 'payroll',
            'description' => 'Updated Loan Entry #' . $loan->id,
        ]);

        return back()->with('success', 'Loan entry updated successfully.');
    }

    public function destroy(Loan $loan)
    {
        $loan->delete();

        $this->activityLogService->createLog([
            'user_id'     => Auth::id(),
            'module'      => 'payroll',
            'description' => 'Deleted Loan Entry #' . $loan->id,
        ]);

        return back()->with('success', 'Loan entry deleted successfully.');
    }
}