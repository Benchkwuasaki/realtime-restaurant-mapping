<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Division;
use App\Models\Employee;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DivisionController extends Controller
{
    public function index(): Response
    {
        $divisions = Division::with(['department', 'units'])
            ->orderBy('division_name')
            ->get()
            ->map(fn (Division $division) => [
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
                    ->map(fn ($u) => [
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
            'totalUnits' => $divisions->sum(fn ($d) => count($d['units'])),
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
                'units' => $division->units->map(fn ($u) => [
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

        $trimmedName = $this->cleanDivisionName($validated['division_name']);
        $validated['division_name'] = $trimmedName;

        $division = Division::create($validated);

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

        $headPosition = Position::create([
            'department_id' => $division->department_id,
            'division_id' => $division->division_id,
            'unit_id' => null,
            'position_name' => 'Head of '.$division->division_name.' Division',
            'position_type' => 'Regular',
        ]);

        $itemNumber = Item::where('item_name', 'like', '%Division Head%')->count();

        $headPosition->items()->create([
            'item_name' => 'Division Head Item '.$itemNumber,
        ]);

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
            ->with('success', count($request->ids).' division(s) deleted successfully.');
    }

    /**
     * Return employees eligible to be assigned to the given division.
     *
     * Eligible = any of:
     *   1. No item assigned at all
     *   2. Has an item whose position has no department (fully unlinked)
     *   3. Has an item whose position belongs to the same department as the
     *      division BUT has no division assigned yet
     *
     * Excluded:
     *   - Employees whose position name matches "Head of * Department"
     *     (they are department heads and should not be assigned to a division)
     */
    public function unlinkedEmployees(Division $division): JsonResponse
    {
        try {
            $divisionDepartmentId = $division->department_id;

            $employees = Employee::with([
                'basicInfo',
                'item.position',
            ])
                ->get()
                ->filter(function (Employee $employee) use ($divisionDepartmentId) {
                    $item = $employee->item;
                    $position = $item?->position;

                    // ── Exclude department heads ──────────────────────────────────
                    // Position name pattern: "Head of * Department"
                    if ($position && preg_match('/^Head of .+ Department$/i', $position->position_name)) {
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
                        $position->department_id === $divisionDepartmentId &&
                        is_null($position->division_id)
                    ) {
                        return true;
                    }

                    return false;
                })
                ->map(fn (Employee $employee) => [
                    'employee_id' => $employee->employee_id,
                    'full_name' => trim(collect([
                        $employee->basicInfo?->first_name ?? '',
                        $employee->basicInfo?->middle_name ?? '',
                        $employee->basicInfo?->last_name ?? '',
                    ])->filter()->implode(' ')),
                    'work_id' => $employee->work_id,
                    'position_name' => $employee->item?->position?->position_name,
                    'department_id' => $employee->item?->position?->department_id,
                ])
                ->values();

            return response()->json($employees);
        } catch (\Throwable $e) {
            \Log::error('Division unlinkedEmployees error: '.$e->getMessage());

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Assign a set of employees to the given division.
     *
     * - Updates position.division_id to this division
     * - If the employee had no department on their position, inherits the
     *   division's department (department_id is also updated)
     */
    public function attachEmployees(Request $request, Division $division): RedirectResponse
    {
        $request->validate([
            'employee_ids' => ['required', 'array'],
            'employee_ids.*' => ['integer', 'exists:employees,employee_id'],
        ]);

        Employee::with('item.position')
            ->whereIn('employee_id', $request->employee_ids)
            ->get()
            ->each(function (Employee $employee) use ($division) {
                $position = $employee->item?->position;
                if (! $position) {
                    return;
                }

                $updates = ['division_id' => $division->division_id];

                // Inherit department if the position had none
                if (is_null($position->department_id)) {
                    $updates['department_id'] = $division->department_id;
                }

                $position->update($updates);
            });

        return redirect()->route('division.index')
            ->with('success', count($request->employee_ids).' employee(s) assigned to '.$division->division_name.' successfully.');
    }

    public function cleanDivisionName(string $name): string
    {
        if (preg_match('/^Division of\s+/i', $name)) {
            $name = preg_replace('/^Division of\s+/i', '', $name);
        } elseif (preg_match('/\s+Division$/i', $name)) {
            $name = preg_replace('/\s+Division$/i', '', $name);
        }

        return trim($name);
    }
}
