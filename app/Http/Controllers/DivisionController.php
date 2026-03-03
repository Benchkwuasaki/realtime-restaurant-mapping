<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Division;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Models\Position;
use Inertia\Inertia;
use Inertia\Response;

class DivisionController extends Controller
{
    public function index(): Response
    {
        $divisions = Division::with(['department', 'units'])
            ->orderBy('division_name')
            ->get()
            ->map(fn(Division $division) => [
                'division_id' => $division->division_id,
                'division_name' => $division->division_name,
                'division_acronym' => $division->division_acronym,
                'division_description' => $division->division_description,
                'department_id' => $division->department_id,
                'department' => [
                    'department_id' => $division->department->department_id,
                    'department_name' => $division->department->department_name,
                ],
                'units' => $division->units
                    ->map(fn($u) => [
                        'unit_id' => $u->unit_id,
                        'unit_name' => $u->unit_name,
                    ])
                    ->values(),
            ]);

        $departments = Department::orderBy('department_name')
            ->get(['department_id', 'department_name']);

        return Inertia::render('Organization/Division/Index', [
            'divisions' => $divisions,
            'departments' => $departments,
            'totalDivisions' => $divisions->count(),
            'totalDepartments' => $departments->count(),
            'totalUnits' => $divisions->sum(fn($d) => count($d['units'])),
        ]);
    }

    public function show(Division $division): Response
    {
        $division->load('department', 'units');

        return Inertia::render('Organization/Division/Show', [
            'division' => [
                'division_id' => $division->division_id,
                'division_name' => $division->division_name,
                'division_acronym' => $division->division_acronym,
                'division_description' => $division->division_description,
                'department_id' => $division->department_id,
                'department' => [
                    'department_id' => $division->department->department_id,
                    'department_name' => $division->department->department_name,
                ],
                'units' => $division->units->map(fn($u) => [
                    'unit_id' => $u->unit_id,
                    'unit_name' => $u->unit_name,
                ]),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_name' => ['required', 'string', 'max:255'],
            'division_acronym' => ['nullable', 'string', 'max:10'],
            'division_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $division = Division::create($validated);

        // ── Auto-create a default JO position for this division ───────────────
        $position = Position::create([
            'department_id' => $division->department_id,
            'division_id' => $division->division_id,
            'unit_id' => null,
            'position_name' => 'Job Order',
            'position_type' => 'Job Order',
        ]);

        $position->items()->create([
            'item_name' => 'Job Order Item 1',
        ]);
        // ─────────────────────────────────────────────────────────────────────

        return redirect()->route('division.index')
            ->with('success', 'Division created successfully.');
    }

    public function update(Request $request, Division $division): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_name' => ['required', 'string', 'max:255'],
            'division_acronym' => ['nullable', 'string', 'max:10'],
            'division_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $division->update($validated);

        return redirect()->route('division.index')
            ->with('success', 'Division updated successfully.');
    }

    public function destroy(Division $division): RedirectResponse
    {
        $division->delete();

        return redirect()->route('division.index')
            ->with('success', 'Division deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:divisions,division_id'],
        ]);

        Division::whereIn('division_id', $request->ids)->delete();

        return redirect()->route('division.index')
            ->with('success', count($request->ids) . ' division(s) deleted successfully.');
    }
}