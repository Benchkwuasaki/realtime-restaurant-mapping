<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\InternalOrganization;
use App\Models\InternalOrgDeduction;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InternalOrgDeductionController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Internal Organization Deductions Page',
        ]);

        $organizations = InternalOrganization::where('payroll_deduction_linked', true)
            ->where('status', true)
            ->orderBy('name')
            ->get(['internal_organization_id', 'name', 'type']);

        $deductions = InternalOrgDeduction::with(['employee.basicInfo', 'internalOrganization'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (InternalOrgDeduction $d) => [
                'id' => $d->id,
                'employee_id' => $d->employee_id,
                'employee_name' => $d->employee?->basicInfo
                    ? $d->employee->basicInfo->last_name.', '.$d->employee->basicInfo->first_name
                    : '—',
                'internal_organization_id' => $d->internal_organization_id,
                'organization_name' => $d->internalOrganization?->name,
                'tab_key' => $d->tabKey(),
                'description' => $d->description,
                'amount' => (float) $d->amount,
                'period_start' => $d->period_start?->toDateString(),
                'period_end' => $d->period_end?->toDateString(),
            ])
            ->values();

        $employees = Employee::with('basicInfo')
            ->where('status', true)
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

        return Inertia::render('Payroll/Earnings&Deductions/InternalOrgDeduction/Index', [
            'deductions' => $deductions,
            'employees' => $employees,
            'organizations' => $organizations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'internal_organization_id' => 'required|exists:internal_organizations,internal_organization_id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        InternalOrgDeduction::create($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Created Internal Organization Deduction Entry',
        ]);

        return back()->with('success', 'Deduction entry created successfully.');
    }

    public function updateAmount(Request $request, InternalOrgDeduction $internalOrgDeduction)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $internalOrgDeduction->update($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Updated Amount for Internal Org Deduction Entry #'.$internalOrgDeduction->id,
        ]);

        return back()->with('success', 'Amount updated.');
    }

    public function destroy(InternalOrgDeduction $internalOrgDeduction)
    {
        $internalOrgDeduction->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Deleted Internal Org Deduction Entry #'.$internalOrgDeduction->id,
        ]);

        return back()->with('success', 'Deduction entry deleted.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:internal_org_deductions,id',
        ]);

        $count = InternalOrgDeduction::whereIn('id', $validated['ids'])->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Bulk deleted {$count} Internal Org Deduction Entries",
        ]);

        return back()->with('success', "{$count} deduction entries deleted successfully.");
    }
}
