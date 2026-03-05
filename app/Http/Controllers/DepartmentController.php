<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Position;

use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {
    }

    public function index()
    {
        $departments = Department::with('divisions')->get();

        $mappedDepartments = $departments->map(fn(Department $department) => [
            'department_id' => $department->department_id,
            'department_name' => $department->department_name,
            'department_acronym' => $department->department_acronym,
            'department_description' => $department->department_description,
            'divisions' => $department->divisions
                ->map(fn($division) => [
                    'division_id' => $division->division_id,
                    'division_name' => $division->division_name,
                ])
                ->values(),
        ]);
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'organization',
            'description' => 'Viewed Department Management Page',
        ]);

        return Inertia::render('Organization/Department/Index', [
            'departments' => $mappedDepartments,
            'totalDepartments' => $departments->count(),
            'totalDivisions' => $departments->sum(fn($d) => $d->divisions->count()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_acronym' => ['nullable', 'string', 'max:10'],
            'department_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $department = Department::create($validated);

        // ── Auto-create a default JO position for this department ─────────────
        $position = Position::create([
            'department_id' => $department->department_id,
            'division_id' => null,
            'unit_id' => null,
            'position_name' => 'Job Order',
            'position_type' => 'Job Order',
        ]);

        $position->items()->create([
            'item_name' => 'Job Order Item 1',
        ]);
        // ─────────────────────────────────────────────────────────────────────

        return redirect()->route('department.index')
            ->with('success', 'Department created successfully.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_acronym' => ['nullable', 'string', 'max:10'],
            'department_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $department->update($validated);

        return redirect()->route('department.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return redirect()->route('department.index')
            ->with('success', 'Department deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:departments,department_id'],
        ]);

        Department::whereIn('department_id', $request->ids)->delete();

        return redirect()->route('department.index')
            ->with('success', count($request->ids) . ' department(s) deleted successfully.');
    }
}
