<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Position;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
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
            ->map(fn (Unit $unit) => [
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
                    ->map(fn ($p) => [
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
            'totalPositions' => $units->sum(fn ($u) => count($u['positions'])),
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
                'positions' => $unit->positions->map(fn ($p) => [
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
            'position_name' => 'Head of '.$unit->unit_name.' Unit',
            'position_type' => 'Regular',
        ]);

        $itemNumber = Item::where('item_name', 'like', '%Unit Head%')->count();

        $headPosition->items()->create([
            'item_name' => 'Unit Head Item '.$itemNumber,
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
            ->with('success', count($request->ids).' unit(s) deleted successfully.');
    }

    /**
     * Return employees eligible to be assigned to the given unit.
     *
     * The unit belongs to a division which belongs to a department.
     * Eligible employees are those whose position matches ANY of:
     *   1. No item assigned at all
     *   2. Item with no position
     *   3. Position with no department (fully unlinked)
     *   4. Position with the same department, but no division yet
     *   5. Position with the same department AND same division, but no unit yet
     *
     * Excluded:
     *   - "Head of * Department" — department heads
     *   - "Head of * Division"   — division heads
     */
    public function unlinkedEmployees(Unit $unit): JsonResponse
    {
        try {
            // Resolve the unit's division and department
            $unit->load('division');
            $unitDivisionId   = $unit->division_id;
            $unitDepartmentId = $unit->division?->department_id;

            $employees = Employee::with([
                'basicInfo',
                'item.position',
            ])
            ->get()
            ->filter(function (Employee $employee) use ($unitDivisionId, $unitDepartmentId) {
                $item     = $employee->item;
                $position = $item?->position;

                // ── Exclude department heads ──────────────────────────────────
                if ($position && preg_match('/^Head of .+ Department$/i', $position->position_name)) {
                    return false;
                }

                // ── Exclude division heads ────────────────────────────────────
                if ($position && preg_match('/^Head of .+ Division$/i', $position->position_name)) {
                    return false;
                }

                // ── No item at all → eligible ─────────────────────────────────
                if (is_null($employee->item_id) || is_null($item)) {
                    return true;
                }

                // ── No position → eligible ────────────────────────────────────
                if (is_null($position)) {
                    return true;
                }

                // ── No department on position → eligible ──────────────────────
                if (is_null($position->department_id)) {
                    return true;
                }

                // ── Same department, no division yet → eligible ───────────────
                if (
                    $position->department_id === $unitDepartmentId &&
                    is_null($position->division_id)
                ) {
                    return true;
                }

                // ── Same department + same division, no unit yet → eligible ───
                if (
                    $position->department_id === $unitDepartmentId &&
                    $position->division_id === $unitDivisionId &&
                    is_null($position->unit_id)
                ) {
                    return true;
                }

                return false;
            })
            ->map(fn(Employee $employee) => [
                'employee_id'   => $employee->employee_id,
                'full_name'     => trim(collect([
                    $employee->basicInfo?->first_name ?? '',
                    $employee->basicInfo?->middle_name ?? '',
                    $employee->basicInfo?->last_name ?? '',
                ])->filter()->implode(' ')),
                'work_id'        => $employee->work_id,
                'position_name'  => $employee->item?->position?->position_name,
                'department_id'  => $employee->item?->position?->department_id,
                'division_id'    => $employee->item?->position?->division_id,
            ])
            ->values();

            return response()->json($employees);
        } catch (\Throwable $e) {
            \Log::error('Unit unlinkedEmployees error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Assign a set of employees to the given unit.
     *
     * - Sets position.unit_id to this unit
     * - Inherits division_id if the position had none
     * - Inherits department_id if the position had none
     */
    public function attachEmployees(Request $request, Unit $unit): RedirectResponse
    {
        $request->validate([
            'employee_ids'   => ['required', 'array'],
            'employee_ids.*' => ['integer', 'exists:employees,employee_id'],
        ]);

        $unit->load('division');

        Employee::with('item.position')
            ->whereIn('employee_id', $request->employee_ids)
            ->get()
            ->each(function (Employee $employee) use ($unit) {
                $position = $employee->item?->position;
                if (!$position) return;

                $updates = ['unit_id' => $unit->unit_id];

                // Inherit division if the position had none
                if (is_null($position->division_id)) {
                    $updates['division_id'] = $unit->division_id;
                }

                // Inherit department if the position had none
                if (is_null($position->department_id)) {
                    $updates['department_id'] = $unit->division?->department_id;
                }

                $position->update($updates);
            });

        return redirect()->route('unit.index')
            ->with('success', count($request->employee_ids) . ' employee(s) assigned to ' . $unit->unit_name . ' successfully.');
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
