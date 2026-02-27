<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Division;
use App\Models\Position;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PositionController extends Controller
{
    public function index(): Response
    {
        $positions = Position::with(['department', 'division', 'unit', 'items.employee'])
            ->orderBy('position_name')
            ->get()
            ->map(fn(Position $position) => [
                'position_id' => $position->position_id,
                'position_name' => $position->position_name,
                'department_id' => $position->department_id,
                'division_id' => $position->division_id,
                'unit_id' => $position->unit_id,
                'department' => [
                    'department_id' => $position->department->department_id,
                    'department_name' => $position->department->department_name,
                ],
                'division' => $position->division ? [
                    'division_id' => $position->division->division_id,
                    'division_name' => $position->division->division_name,
                    'department_id' => $position->division->department_id,
                ] : null,
                'unit' => $position->unit ? [
                    'unit_id' => $position->unit->unit_id,
                    'unit_name' => $position->unit->unit_name,
                    'division_id' => $position->unit->division_id,
                ] : null,
                'total_slots' => $position->items->count(),
                'occupied_slots' => $position->items->filter(fn($i) => $i->employee !== null)->count(),
                'employees' => $position->items
                    ->filter(fn($item) => $item->employee !== null)
                    ->map(fn($item) => [
                        'id' => $item->employee->employee_id,
                        'first_name' => $item->employee->basicInfo->first_name,
                        'last_name' => $item->employee->basicInfo->last_name,
                        'email' => $item->employee->work_email,
                        'is_active' => $item->employee->status,
                        'item_name' => $item->item_name,
                    ])
                    ->values(),
            ]);

        $departments = Department::orderBy('department_name')->get(['department_id', 'department_name']);
        $divisions = Division::orderBy('division_name')->get(['division_id', 'division_name', 'department_id']);
        $units = Unit::orderBy('unit_name')->get(['unit_id', 'unit_name', 'division_id']);

        return Inertia::render('Organization/Position/Index', [
            'positions' => $positions,
            'departments' => $departments,
            'divisions' => $divisions,
            'units' => $units,
        ]);
    }

    public function show(Position $position): Response
    {
        $position->load(['department', 'division', 'unit', 'items']);

        return Inertia::render('Organization/Position/Show', [
            'position' => [
                'position_id' => $position->position_id,
                'position_name' => $position->position_name,
                'department_id' => $position->department_id,
                'division_id' => $position->division_id,
                'unit_id' => $position->unit_id,
                'department' => [
                    'department_id' => $position->department->department_id,
                    'department_name' => $position->department->department_name,
                ],
                'division' => $position->division ? [
                    'division_id' => $position->division->division_id,
                    'division_name' => $position->division->division_name,
                    'department_id' => $position->division->department_id,
                ] : null,
                'unit' => $position->unit ? [
                    'unit_id' => $position->unit->unit_id,
                    'unit_name' => $position->unit->unit_name,
                    'division_id' => $position->unit->division_id,
                ] : null,
                'items' => $position->items->map(fn($i) => [
                    'item_id' => $i->item_id,
                    'item_name' => $i->item_name,
                ]),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_id' => ['required', 'integer', 'exists:divisions,division_id'],
            'unit_id' => ['nullable', 'integer', 'exists:units,unit_id'],
            'item_slots' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $position = Position::create(collect($validated)->except('item_slots')->toArray());

        for ($i = 1; $i <= $validated['item_slots']; $i++) {
            $position->items()->create([
                'item_name' => $validated['position_name'] . ' Item ' . $i,
            ]);
        }

        return redirect()->route('position.index')
            ->with('success', 'Position created successfully.');
    }

    public function update(Request $request, Position $position): RedirectResponse
    {
        $validated = $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_id' => ['required', 'integer', 'exists:divisions,division_id'],
            'unit_id' => ['nullable', 'integer', 'exists:units,unit_id'],
            'item_slots' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $position->update(collect($validated)->except('item_slots')->toArray());

        $currentCount = $position->items()->count();
        $newCount = $validated['item_slots'];

        if ($newCount > $currentCount) {
            for ($i = $currentCount + 1; $i <= $newCount; $i++) {
                $position->items()->create([
                    'item_name' => $validated['position_name'] . ' Item ' . $i,
                ]);
            }
        } elseif ($newCount < $currentCount) {
            $position->items()
                ->orderByDesc('item_id')
                ->get()
                ->filter(fn($item) => $item->employee === null)
                ->take($currentCount - $newCount)
                ->each(fn($item) => $item->delete());
        }

        $position->items()->orderBy('item_id')->get()->each(function ($item, $index) use ($validated) {
            $item->update(['item_name' => $validated['position_name'] . ' Item ' . ($index + 1)]);
        });

        return redirect()->route('position.index')
            ->with('success', 'Position updated successfully.');
    }

    public function destroy(Position $position): RedirectResponse
    {
        $position->delete();

        return redirect()->route('position.index')
            ->with('success', 'Position deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:positions,position_id'],
        ]);

        Position::whereIn('position_id', $request->ids)->delete();

        return redirect()->route('position.index')
            ->with('success', count($request->ids) . ' position(s) deleted successfully.');
    }
}