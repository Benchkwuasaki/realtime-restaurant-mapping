<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DepartmentController extends Controller
{
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

        return Inertia::render('Organization/Department/Index', [
            'departments' => $mappedDepartments,
            'totalDepartments' => $departments->count(),
            'totalDivisions' => $departments->sum(fn($d) => $d->divisions->count()),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:255',
            'department_acronym' => 'required|string|max:50',
            'department_description' => 'nullable|string',
        ]);

        Department::create($validated);

        return redirect()->route('department.index')->with('success', 'Department created successfully.');
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'department_name' => 'required|string|max:255',
            'department_acronym' => 'required|string|max:50',
            'department_description' => 'nullable|string',
        ]);

        $department->update($validated);

        return redirect()->route('department.index')->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        $department->delete();

        return redirect()->route('department.index')->with('success', 'Department deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $ids = $request->input('ids', []);
        Department::whereIn('department_id', $ids)->delete();

        return back()->with('success', count($ids) . ' department(s) deleted.');
    }
}
