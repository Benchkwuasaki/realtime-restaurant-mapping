<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        return Inertia::render('Organization/Department/Index', [
            'departments' => Department::all(),
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
}
