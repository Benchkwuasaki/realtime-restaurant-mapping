<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\InternalOrganization;
use App\Models\InternalOrganizationService;
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
            ->with('orgType')
            ->orderBy('name')
            ->get(['internal_organization_id', 'name', 'internal_org_type_id'])
            ->map(fn ($org) => [
                'internal_organization_id' => $org->internal_organization_id,
                'name' => $org->name,
                'type' => $org->orgType?->internal_org_type,
            ]);

        $deductions = InternalOrgDeduction::with([
            'employee.basicInfo',
            'internalOrganization',
            'service',                      // ← eager-load service
        ])
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
                'internal_organization_service_id' => $d->internal_organization_service_id,
                'service_name' => $d->service?->internal_organization_service_name,
                'service_category' => $d->service?->service_category,
                'tab_key' => $d->tabKey(),
                'description' => $d->description,
                'amount' => (float) $d->amount,
                'period_start' => $d->period_start?->toDateString(),
                'period_end' => $d->period_end?->toDateString(),
            ])
            ->values();

        // Group active employees by their linked internal organizations
        $employeesByOrg = Employee::with(['basicInfo', 'internalOrganizations'])
            ->where('status', true)
            ->get()
            ->flatMap(function (Employee $e) {
                $name = $e->basicInfo
                    ? $e->basicInfo->last_name.', '.$e->basicInfo->first_name
                    : '—';

                return $e->internalOrganizations->map(fn (InternalOrganization $org) => [
                    'internal_organization_id' => $org->internal_organization_id,
                    'employee' => [
                        'id' => $e->employee_id,
                        'full_name' => $name,
                        'position' => $e->basicInfo?->position_title ?? null,
                    ],
                ]);
            })
            ->groupBy('internal_organization_id')
            ->map(fn ($group) => $group->pluck('employee')->sortBy('full_name')->values());

        // Services grouped by org, further grouped by category.
        // Loan category is excluded — internal org loans are managed in the
        // Loan Entry page and stored in the loans table.
        // Shape: { [org_id]: { [category]: [ { id, name, category } ] } }
        $servicesByOrg = InternalOrganization::where('payroll_deduction_linked', true)
            ->where('status', true)
            ->with(['services' => fn ($q) => $q
                ->where('deductable_from_payroll', true)
                ->where('service_category', '!=', \App\Models\InternalOrganizationService::CATEGORY_LOAN)
                ->orderBy('internal_organization_service_name'),
            ])
            ->get()
            ->mapWithKeys(fn (InternalOrganization $org) => [
                (string) $org->internal_organization_id => $org->services
                    ->groupBy('service_category')
                    ->map(fn ($services) => $services->map(fn ($s) => [
                        'id' => $s->internal_organization_service_id,
                        'name' => $s->internal_organization_service_name,
                        'category' => $s->service_category,
                    ])->values())
                    ->toArray(),
            ]);

        return Inertia::render('Payroll/Earnings&Deductions/InternalOrgDeduction/Index', [
            'deductions' => $deductions,
            'employeesByOrg' => $employeesByOrg,
            'organizations' => $organizations,
            'servicesByOrg' => $servicesByOrg,  // ← new
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'internal_organization_id' => 'required|exists:internal_organizations,internal_organization_id',
            'internal_organization_service_id' => 'required|exists:internal_organization_services,internal_organization_service_id',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        // Fall back to the service name if no description was provided,
        // since the column is NOT NULL in the database.
        if (empty($validated['description'])) {
            $validated['description'] = InternalOrganizationService::find(
                $validated['internal_organization_service_id']
            )?->internal_organization_service_name ?? '';
        }

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
