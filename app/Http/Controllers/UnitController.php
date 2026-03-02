<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(): Response
    {
        $units = Unit::with(['division', 'positions'])
            ->orderBy('unit_name')
            ->get()
            ->map(fn(Unit $unit) => [
                'unit_id' => $unit->unit_id,
                'unit_name' => $unit->unit_name,
                'unit_acronym' => $unit->unit_acronym,
                'unit_description' => $unit->unit_description,
                'division_id' => $unit->division_id,
                'division' => [
                    'division_id' => $unit->division->division_id,
                    'division_name' => $unit->division->division_name,
                ],
                'positions' => $unit->positions               // ← new
                    ->map(fn($p) => [
                        'position_id' => $p->position_id,
                        'position_name' => $p->position_name,
                    ])
                    ->values(),
            ]);

        $divisions = Division::orderBy('division_name')
            ->get(['division_id', 'division_name']);

        return Inertia::render('Organization/Unit/Index', [
            'units' => $units,
            'divisions' => $divisions,
            'totalUnits' => $units->count(),
            'totalDivisions' => $divisions->count(),
            'totalPositions' => $units->sum(fn($u) => count($u['positions'])),
        ]);
    }

    public function show(Unit $unit): Response
    {
        $unit->load('division', 'positions');

        return Inertia::render('Organization/Unit/Show', [
            'unit' => [
                'unit_id' => $unit->unit_id,
                'unit_name' => $unit->unit_name,
                'unit_acronym' => $unit->unit_acronym,
                'unit_description' => $unit->unit_description,
                'division_id' => $unit->division_id,
                'division' => [
                    'division_id' => $unit->division->division_id,
                    'division_name' => $unit->division->division_name,
                ],
                'positions' => $unit->positions->map(fn($p) => [
                    'position_id' => $p->position_id,
                    'position_name' => $p->position_name,
                ]),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'division_id' => ['required', 'integer', 'exists:divisions,division_id'],
            'unit_name' => ['required', 'string', 'max:255'],
            'unit_acronym' => ['required', 'string', 'max:10'],
            'unit_description' => ['nullable', 'string', 'max:1000'],
        ]);

        Unit::create($validated);

        return redirect()->route('unit.index')
            ->with('success', 'Unit created successfully.');
    }

    public function update(Request $request, Unit $unit): RedirectResponse
    {
        $validated = $request->validate([
            'division_id' => ['required', 'integer', 'exists:divisions,division_id'],
            'unit_name' => ['required', 'string', 'max:255'],
            'unit_acronym' => ['required', 'string', 'max:10'],
            'unit_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $unit->update($validated);

        return redirect()->route('unit.index')
            ->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        $unit->delete();

        return redirect()->route('unit.index')
            ->with('success', 'Unit deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:units,unit_id'],
        ]);

        Unit::whereIn('unit_id', $request->ids)->delete();

        return redirect()->route('unit.index')
            ->with('success', count($request->ids) . ' unit(s) deleted successfully.');
    }
}