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

class JobOrderPositionController extends Controller
{
    public function index(): Response
    {
        $positions = Position::jobOrder()
            ->with(['department', 'division', 'unit', 'items.employee'])
            ->orderBy('position_name')
            ->get()
            ->map(fn(Position $p) => [
                'position_id'    => $p->position_id,
                'position_name'  => $p->position_name,
                'position_type'  => $p->position_type,
                'department_id'  => $p->department_id,
                'division_id'    => $p->division_id,
                'unit_id'        => $p->unit_id,
                'department'     => [
                    'department_id'   => $p->department->department_id,
                    'department_name' => $p->department->department_name,
                ],
                'division' => $p->division ? [
                    'division_id'   => $p->division->division_id,
                    'division_name' => $p->division->division_name,
                    'department_id' => $p->division->department_id,
                ] : null,
                'unit' => $p->unit ? [
                    'unit_id'     => $p->unit->unit_id,
                    'unit_name'   => $p->unit->unit_name,
                    'division_id' => $p->unit->division_id,
                ] : null,
                'total_slots'    => $p->items->count(),
                'occupied_slots' => $p->items->filter(fn($i) => $i->employee !== null)->count(),
                'employees'      => $p->items
                    ->filter(fn($item) => $item->employee !== null)
                    ->map(fn($item) => [
                        'id'         => $item->employee->employee_id,
                        'first_name' => $item->employee->basicInfo->first_name,
                        'last_name'  => $item->employee->basicInfo->last_name,
                        'email'      => $item->employee->work_email,
                        'is_active'  => $item->employee->status,
                        'item_name'  => $item->item_name,
                    ])
                    ->values(),
            ]);

        $departments = Department::orderBy('department_name')
            ->get(['department_id', 'department_name']);

        $divisions = Division::orderBy('division_name')
            ->get(['division_id', 'division_name', 'department_id']);

        $units = Unit::orderBy('unit_name')
            ->get(['unit_id', 'unit_name', 'division_id']);

        return Inertia::render('Organization/JobOrderPosition/Index', [
            'positions'   => $positions,
            'departments' => $departments,
            'divisions'   => $divisions,
            'units'       => $units,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_id'   => ['nullable', 'integer', 'exists:divisions,division_id'],
            'unit_id'       => ['nullable', 'integer', 'exists:units,unit_id'],
            'item_slots'    => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $position = Position::create([
            ...collect($validated)->except('item_slots')->toArray(),
            'position_type' => 'Job Order',
        ]);

        for ($i = 1; $i <= $validated['item_slots']; $i++) {
            $position->items()->create([
                'item_name' => $validated['position_name'] . ' Item ' . $i,
            ]);
        }

        return redirect()->route('job-order-position.index')
            ->with('success', 'Job order position created successfully.');
    }

    public function update(Request $request, Position $position): RedirectResponse
    {
        abort_if($position->position_type !== 'Job Order', 403);

        $validated = $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_id' => ['required', 'integer', 'exists:departments,department_id'],
            'division_id'   => ['nullable', 'integer', 'exists:divisions,division_id'],
            'unit_id'       => ['nullable', 'integer', 'exists:units,unit_id'],
            'item_slots'    => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $position->update(collect($validated)->except('item_slots')->toArray());

        $currentCount = $position->items()->count();
        $newCount     = $validated['item_slots'];

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

        return redirect()->route('job-order-position.index')
            ->with('success', 'Job order position updated successfully.');
    }

    public function destroy(Position $position): RedirectResponse
    {
        abort_if($position->position_type !== 'Job Order', 403);

        $position->delete();

        return redirect()->route('job-order-position.index')
            ->with('success', 'Job order position deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:positions,position_id'],
        ]);

        Position::jobOrder()
            ->whereIn('position_id', $request->ids)
            ->delete();

        return redirect()->route('job-order-position.index')
            ->with('success', count($request->ids) . ' job order position(s) deleted successfully.');
    }
}