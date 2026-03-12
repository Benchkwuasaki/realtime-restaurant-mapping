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
        $organizations = InternalOrganization::with('orgType')->orderBy('name')->get();

        return Inertia::render('Organization/InternalOrganization/Index', [
            'organizations'        => $organizations,
            'orgTypes'             => InternalOrgType::orderBy('internal_org_type')->get(),
            'totalOrganizations'   => $organizations->count(),
            'activeOrganizations'  => $organizations->where('status', true)->count(),
            'inactiveOrganizations'=> $organizations->where('status', false)->count(),
        ]);
    }

    // ── Org Type: Store ────────────────────────────────────────────────────────

    public function storeOrgType(Request $request)
    {
        $validated = $request->validate([
            'internal_org_type' => 'required|string|max:100|unique:internal_org_types,internal_org_type',
        ]);

        $orgType = InternalOrgType::create($validated);

        // Share the newly created type back as an Inertia prop so the
        // dialog's onSuccess(page) callback can read it from page.props
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
            'code'                    => 'required|string|max:50|unique:internal_organizations,code',
            'name'                    => 'required|string|max:255',
            'internal_org_type_id'    => 'required|exists:internal_org_types,internal_org_type_id',
            'head'                    => 'required|string|max:255',
            'payroll_deduction_linked'=> 'required|boolean',
            'status'                  => 'required|boolean',
        ]);

        InternalOrganization::create($validated);

        return redirect()->route('internal-organization.index')
            ->with('success', 'Organization created successfully.');
    }

    public function storeMembers(Request $request, InternalOrganization $internalOrganization)
    {
        $request->validate([
            'employee_ids'   => 'required|array|min:1',
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
            'members.basicInfo',
            'members.item.position.department',
        ]);

        $members = $internalOrganization->members->map(fn(Employee $employee) => [
            'id'         => (string) $employee->employee_id,
            'name'       => optional($employee->basicInfo)->full_name ?? null,
            'position'   => optional(optional($employee->item)->position)->position_name ?? null,
            'department' => optional(optional(optional($employee->item)->position)->department)->department_name ?? null,
            'status'     => $employee->status,
        ]);

        $memberIds = $internalOrganization->members->pluck('employee_id');

        $availableEmployees = Employee::with(['basicInfo', 'item.position.department'])
            ->whereNotIn('employee_id', $memberIds)
            ->get()
            ->map(fn(Employee $employee) => [
                'id'         => (string) $employee->employee_id,
                'name'       => optional($employee->basicInfo)->full_name ?? null,
                'position'   => optional(optional($employee->item)->position)->position_name ?? null,
                'department' => optional(optional(optional($employee->item)->position)->department)->department_name ?? null,
            ]);

        return Inertia::render('Organization/InternalOrganization/Show', [
            'organization'       => array_merge($internalOrganization->toArray(), [
                'members' => $members,
            ]),
            'availableEmployees' => $availableEmployees,
        ]);
    }

    // ── Edit / Update ──────────────────────────────────────────────────────────

    public function edit(InternalOrganization $internalOrganization): Response
    {
        return Inertia::render('Organization/InternalOrganization/Edit', [
            'organization' => $internalOrganization->load('orgType'),
            'orgTypes'     => InternalOrgType::orderBy('internal_org_type')->get(),
        ]);
    }

    public function update(Request $request, InternalOrganization $internalOrganization)
    {
        $validated = $request->validate([
            'code'                    => 'required|string|max:50|unique:internal_organizations,code,'
                                         . $internalOrganization->internal_organization_id
                                         . ',internal_organization_id',
            'name'                    => 'required|string|max:255',
            'internal_org_type_id'    => 'required|exists:internal_org_types,internal_org_type_id',
            'head'                    => 'required|string|max:255',
            'payroll_deduction_linked'=> 'required|boolean',
            'status'                  => 'required|boolean',
        ]);

        $internalOrganization->update($validated);

        return redirect()->route('internal-organization.index')
            ->with('success', 'Organization updated successfully.');
    }

    // ── Toggle Status ──────────────────────────────────────────────────────────

    public function toggleStatus(InternalOrganization $internalOrganization)
    {
        $internalOrganization->update(['status' => !$internalOrganization->status]);

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
            'ids'   => 'required|array',
            'ids.*' => 'exists:internal_organizations,internal_organization_id',
        ]);

        InternalOrganization::whereIn('internal_organization_id', $request->ids)->delete();

        return back()->with('success', 'Organizations deleted successfully.');
    }
}