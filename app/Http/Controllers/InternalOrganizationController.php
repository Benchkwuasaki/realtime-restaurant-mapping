<?php

namespace App\Http\Controllers;

use App\Models\InternalOrganization;
use App\Models\InternalOrgType;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InternalOrganizationController extends Controller
{
    // ── Index ──────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $organizations = InternalOrganization::with([
            'orgType',
            'headEmployee.basicInfo',
        ])->get()->map(fn($org) => [
                'internal_organization_id' => $org->internal_organization_id,
                'code' => $org->code,
                'name' => $org->name,
                'type' => $org->orgType?->internal_org_type,  // ← was 'orgType'
                'head_employee_id' => $org->head_employee_id,
                'head_name' => $org->headEmployee?->basicInfo
                    ? trim(
                        $org->headEmployee->basicInfo->first_name
                        . ' '
                        . $org->headEmployee->basicInfo->last_name
                    )
                    : null,
                'payroll_deduction_linked' => (bool) $org->payroll_deduction_linked,
                'status' => (bool) $org->status,
                'created_at' => $org->created_at,
                'updated_at' => $org->updated_at,
            ]);

        return Inertia::render('Organization/InternalOrganization/Index', [
            'organizations' => $organizations,
            'orgTypes' => InternalOrgType::orderBy('internal_org_type')->get(),
            'employees' => Employee::with('basicInfo')
                ->get()
                ->map(fn($e) => [
                    'id' => (string) $e->employee_id,
                    'name' => optional($e->basicInfo)->full_name ?? '—',
                ])
                ->sortBy('name')
                ->values(),
            'totalOrganizations' => $organizations->count(),
            'activeOrganizations' => $organizations->where('status', true)->count(),
            'inactiveOrganizations' => $organizations->where('status', false)->count(),
        ]);
    }

    // ── Org Type: Store ────────────────────────────────────────────────────────

    public function storeOrgType(Request $request)
    {
        $validated = $request->validate([
            'internal_org_type' => 'required|string|max:100|unique:internal_org_types,internal_org_type',
        ]);

        $orgType = InternalOrgType::create($validated);

        return back()->with('newOrgType', $orgType);
    }

    // ── Create / Store ─────────────────────────────────────────────────────────

    public function create(): Response
    {
        return Inertia::render('Organization/InternalOrganization/Create', [
            'orgTypes' => InternalOrgType::orderBy('internal_org_type')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:internal_organizations,code',
            'name' => 'required|string|max:255',
            'internal_org_type_id' => 'required|exists:internal_org_types,internal_org_type_id',
            'head_employee_id' => 'required|exists:employees,employee_id',
            'payroll_deduction_linked' => 'required|boolean',
            'status' => 'required|boolean',
        ]);

        if (!$validated['status']) {
            $validated['payroll_deduction_linked'] = false;
        }

        $organization = InternalOrganization::create($validated);

        $organization->members()->syncWithoutDetaching([$validated['head_employee_id']]);

        return redirect()->route('internal-organization.index')
            ->with('success', 'Organization created successfully.');
    }

    public function storeMembers(Request $request, InternalOrganization $internalOrganization)
    {
        $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,employee_id',
        ]);

        $internalOrganization->members()->syncWithoutDetaching($request->employee_ids);

        return back()->with('success', 'Members added successfully.');
    }

    // ── Show ───────────────────────────────────────────────────────────────────

    public function show(InternalOrganization $internalOrganization): Response
    {
        $internalOrganization->load([
            'orgType',
            'headEmployee.basicInfo',
            'members.basicInfo',
            'members.item.position.department',
        ]);

        $members = $internalOrganization->members->map(fn(Employee $employee) => [
            'id' => (string) $employee->employee_id,
            'name' => optional($employee->basicInfo)->full_name ?? null,
            'position' => optional(optional($employee->item)->position)->position_name ?? null,
            'department' => optional(optional(optional($employee->item)->position)->department)->department_name ?? null,
            'status' => $employee->status,
        ]);

        $memberIds = $internalOrganization->members->pluck('employee_id');

        $availableEmployees = Employee::with(['basicInfo', 'item.position.department'])
            ->whereNotIn('employee_id', $memberIds)
            ->get()
            ->map(fn(Employee $employee) => [
                'id' => (string) $employee->employee_id,
                'name' => optional($employee->basicInfo)->full_name ?? null,
                'position' => optional(optional($employee->item)->position)->position_name ?? null,
                'department' => optional(optional(optional($employee->item)->position)->department)->department_name ?? null,
            ]);

        return Inertia::render('Organization/InternalOrganization/Show', [
            'organization' => array_merge($internalOrganization->toArray(), [
                'type' => $internalOrganization->orgType?->internal_org_type,  // ← ensure type is set here too
                'members' => $members,
                'head' => $internalOrganization->headEmployee?->basicInfo
                    ? trim(
                        $internalOrganization->headEmployee->basicInfo->first_name
                        . ' '
                        . $internalOrganization->headEmployee->basicInfo->last_name
                      )
                    : null,
            ]),
            'availableEmployees' => $availableEmployees,
            'orgTypes' => InternalOrgType::orderBy('internal_org_type')->get(),
            'employees' => Employee::with('basicInfo')
                ->get()
                ->map(fn($e) => [
                    'id' => (string) $e->employee_id,
                    'name' => optional($e->basicInfo)->full_name ?? '—',
                ])
                ->sortBy('name')
                ->values(),
        ]);
    }

    // ── Edit / Update ──────────────────────────────────────────────────────────

    public function edit(InternalOrganization $internalOrganization): Response
    {
        return Inertia::render('Organization/InternalOrganization/Edit', [
            'organization' => $internalOrganization->load('orgType'),
            'orgTypes' => InternalOrgType::orderBy('internal_org_type')->get(),
        ]);
    }

    public function update(Request $request, InternalOrganization $internalOrganization)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:internal_organizations,code,'
                . $internalOrganization->internal_organization_id
                . ',internal_organization_id',
            'name' => 'required|string|max:255',
            'internal_org_type_id' => 'required|exists:internal_org_types,internal_org_type_id',
            'head_employee_id' => 'required|exists:employees,employee_id',
            'payroll_deduction_linked' => 'required|boolean',
            'status' => 'required|boolean',
        ]);

        if (!$validated['status']) {
            $validated['payroll_deduction_linked'] = false;
        }

        $internalOrganization->update($validated);

        $internalOrganization->members()->syncWithoutDetaching([$validated['head_employee_id']]);

        return redirect()->route('internal-organization.show', $internalOrganization->internal_organization_id)
            ->with('success', 'Organization updated successfully.');
    }

    // ── Toggle Status ──────────────────────────────────────────────────────────

    public function toggleStatus(InternalOrganization $internalOrganization)
    {
        $newStatus = !$internalOrganization->status;

        $internalOrganization->update([
            'status' => $newStatus,
            'payroll_deduction_linked' => $newStatus ? $internalOrganization->payroll_deduction_linked : false,
        ]);

        return back()->with('success', 'Organization status updated.');
    }

    // ── Destroy ────────────────────────────────────────────────────────────────

    public function destroy(InternalOrganization $internalOrganization)
    {
        $internalOrganization->delete();
        return back()->with('success', 'Organization deleted.');
    }

    // ── Bulk Destroy ───────────────────────────────────────────────────────────

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:internal_organizations,internal_organization_id',
        ]);

        InternalOrganization::whereIn('internal_organization_id', $request->ids)->delete();

        return back()->with('success', 'Organizations deleted successfully.');
    }
}