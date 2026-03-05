<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Item;
use App\Models\Position;
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
                'positions' => $unit->positions
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

        $trimmedName = $this->cleanUnitName($validated['unit_name']);
        $validated['unit_name'] = $trimmedName;

        $unit = Unit::create($validated);

        $division = Division::find($unit->division_id);

        $position = Position::create([
            'department_id' => $division->department_id,
            'division_id' => $unit->division_id,
            'unit_id' => $unit->unit_id,
            'position_name' => 'Job Order',
            'position_type' => 'Job Order',
        ]);

        $position->items()->create([
            'item_name' => 'Job Order Item 1',
        ]);

        $headPosition = Position::create([
            'department_id' => $unit->division->department_id,
            'division_id' => $unit->division_id,
            'unit_id' => $unit->unit_id,
            'position_name' => 'Head of ' . $unit->unit_name . ' Unit',
            'position_type' => 'Regular'
        ]);

        $itemNumber = Item::where('item_name', 'like', '%Unit Head%')->count();

        $headPosition->items()->create([
            'item_name' => 'Unit Head Item ' . $itemNumber,
        ]);

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

    public function cleanUnitName(string $name): string
    {
        if (preg_match('/^Unit of\s+/i', $name)) {
            $name = preg_replace('/^Unit of\s+/i', '', $name);
        } elseif (preg_match('/\s+Unit$/i', $name)) {
            $name = preg_replace('/\s+Unit$/i', '', $name);
        }

        return trim($name);
    }
}