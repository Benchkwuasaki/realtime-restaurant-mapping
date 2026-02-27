<?php

namespace App\Http\Controllers;

use App\Models\InternalOrganization;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InternalOrganizationController extends Controller
{
    // ── Index ──────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $organizations = InternalOrganization::orderBy('name')->get();

        return Inertia::render('Organization/InternalOrganization/Index', [
            'organizations' => $organizations,
            'totalOrganizations' => $organizations->count(),
            'activeOrganizations' => $organizations->where('status', true)->count(),
            'inactiveOrganizations' => $organizations->where('status', false)->count(),
        ]);
    }

    // ── Create / Store ─────────────────────────────────────────────────────────

    public function create(): Response
    {
        return Inertia::render('Organization/InternalOrganization/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:internal_organizations,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:Union,Cooperative,Association',
            'head' => 'required|string|max:255',
            'payroll_deduction_linked' => 'required|boolean',
            'status' => 'required|boolean',
        ]);

        InternalOrganization::create($validated);

        return redirect()->route('internal-organization.index')
            ->with('success', 'Organization created successfully.');
    }

    public function storeMembers(Request $request, InternalOrganization $internalOrganization)
    {
        $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,employee_id',
        ]);

        // syncWithoutDetaching prevents removing existing members
        $internalOrganization->members()->syncWithoutDetaching($request->employee_ids);

        return back()->with('success', 'Members added successfully.');
    }

    // ── Show ───────────────────────────────────────────────────────────────────

    public function show(InternalOrganization $internalOrganization): Response
    {
        $internalOrganization->load([
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

        // Employees NOT yet in this organization (for the Add Member modal)
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
                'members' => $members,
            ]),
            'availableEmployees' => $availableEmployees,
        ]);
    }



    // ── Edit / Update ──────────────────────────────────────────────────────────

    public function edit(InternalOrganization $internalOrganization): Response
    {
        return Inertia::render('Organization/InternalOrganization/Edit', [
            'organization' => $internalOrganization,
        ]);
    }

    public function update(Request $request, InternalOrganization $internalOrganization)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:internal_organizations,code,' . $internalOrganization->id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:Union,Cooperative,Association',
            'head' => 'required|string|max:255',
            'payroll_deduction_linked' => 'required|boolean',
            'status' => 'required|boolean',
        ]);

        $internalOrganization->update($validated);

        return redirect()->route('internal-organization.index')
            ->with('success', 'Organization updated successfully.');
    }

    // ── Toggle Status (Deactivate / Activate) ──────────────────────────────────

    public function toggleStatus(InternalOrganization $internalOrganization)
    {
        $internalOrganization->update(['status' => !$internalOrganization->status]);

        return back()->with('success', 'Organization status updated.');
    }

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
            'ids.*' => 'exists:internal_organizations,id',
        ]);

        InternalOrganization::whereIn('id', $request->ids)->delete();

        return back()->with('success', 'Organizations deleted successfully.');
    }
}