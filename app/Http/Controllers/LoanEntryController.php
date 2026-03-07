<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Loan;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoanEntryController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    /**
     * Display the loan entry listing page.
     */
    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Loan Entry Page',
        ]);

        $loans = Loan::with(['employee.basicInfo'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Loan $l) => [
                'id' => $l->id,
                'employee_id' => $l->employee_id,
                'employee_name' => $l->employee?->basicInfo
                                                ? $l->employee->basicInfo->last_name.', '.$l->employee->basicInfo->first_name
                                                : '—',
                'employee_position' => $l->employee?->basicInfo?->position_title ?? null,
                'loan_type' => $l->loan_type,
                'source' => $l->source,
                'total_amount' => (float) $l->total_amount,
                'monthly_amortization' => (float) $l->monthly_amortization,
                'semi_monthly_deduction' => (float) $l->semi_monthly_deduction,
                'balance' => (float) $l->balance,
                'start_period' => $l->start_period,
                'end_period' => $l->end_period,
                'status' => $l->status,
            ]);

        $employees = Employee::with('basicInfo')
            ->get()
            ->sortBy(fn (Employee $e) => $e->basicInfo?->last_name)
            ->values()
            ->map(fn (Employee $e) => [
                'id' => $e->employee_id,
                'full_name' => $e->basicInfo
                                ? $e->basicInfo->last_name.', '.$e->basicInfo->first_name
                                : '—',
                'position' => $e->basicInfo?->position_title ?? null,
            ]);

        return Inertia::render('Payroll/Earnings&Deductions/LoanEntry/Index', [
            'loans' => $loans,
            'employees' => $employees,
        ]);
    }

    /**
     * Store a new loan record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'loan_type' => 'required|string|max:100',
            'source' => 'required|string|max:50',
            'total_amount' => 'required|numeric|min:0',
            'monthly_amortization' => 'required|numeric|min:0',
            'semi_monthly_deduction' => 'required|numeric|min:0',
            'start_period' => 'required|string|max:7',
            'end_period' => 'required|string|max:7',
            'status' => 'required|in:Active,Completed,Suspended',
        ]);

        // On creation the balance equals the total amount
        $validated['balance'] = $validated['total_amount'];

        Loan::create($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Created Loan Entry',
        ]);

        return back()->with('success', 'Loan entry created successfully.');
    }

    /**
     * Update an existing loan record.
     */
    public function update(Request $request, Loan $loan)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'loan_type' => 'required|string|max:100',
            'source' => 'required|string|max:50',
            'total_amount' => 'required|numeric|min:0',
            'monthly_amortization' => 'required|numeric|min:0',
            'semi_monthly_deduction' => 'required|numeric|min:0',
            'start_period' => 'required|string|max:7',
            'end_period' => 'required|string|max:7',
            'status' => 'required|in:Active,Completed,Suspended',
        ]);

        $loan->update($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Loan Entry #'.$loan->id,
        ]);

        return back()->with('success', 'Loan entry updated successfully.');
    }

    /**
     * Delete a loan record.
     */
    public function destroy(Loan $loan)
    {
        $loan->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Deleted Loan Entry #'.$loan->id,
        ]);

        return back()->with('success', 'Loan entry deleted successfully.');
    }
}
