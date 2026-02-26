<?php

namespace App\Http\Controllers;

use App\Models\InternalOrganization;
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

    // ── Show ───────────────────────────────────────────────────────────────────

    public function show(InternalOrganization $internalOrganization): Response
    {
        return Inertia::render('Organization/InternalOrganization/Show', [
            'organization' => $internalOrganization,
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