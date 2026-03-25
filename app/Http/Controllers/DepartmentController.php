<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Position;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    public function index()
    {
        $departments = Department::with('divisions')->get();

        $mappedDepartments = $departments->map(fn (Department $department) => [
            'department_id' => $department->department_id,
            'department_name' => $department->department_name,
            'department_acronym' => $department->department_acronym,
            'department_description' => $department->department_description,
            'divisions' => $department->divisions
                ->map(fn ($division) => [
                    'division_id' => $division->division_id,
                    'division_name' => $division->division_name,
                ])
                ->values(),
        ]);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'organization',
            'activity' => 'Viewed Department Management Page',
        ]);

        return Inertia::render('Organization/Department/Index', [
            'departments' => $mappedDepartments,
            'totalDepartments' => $departments->count(),
            'totalDivisions' => $departments->sum(fn ($d) => $d->divisions->count()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_name' => ['required', 'string', 'max:255'],
            'department_acronym' => ['nullable', 'string', 'max:10'],
            'department_description' => ['nullable', 'string', 'max:1000'],
        ]);

        $trimmedName = $this->cleanDepartmentName($validated['department_name']);
        $validated['department_name'] = $trimmedName;

        $department = Department::create($validated);
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

        $headPosition = Position::create([
            'department_id' => $department->department_id,
            'division_id' => null,
            'unit_id' => null,
            'position_name' => 'Head of '.$department->department_name.' Department',
            'position_type' => 'Regular',
        ]);

        $itemNumber = Item::where('item_name', 'like', '%Department Head%')->count();

        $headPosition->items()->create([
            'item_name' => 'Department Head Item '.$itemNumber,
        ]);

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
            ->with('success', count($request->ids).' department(s) deleted successfully.');
    }

    /**
     * Return employees who have no department linked via their position.
     * An employee is "unlinked" when:
     *   - they have no item assigned, OR
     *   - their item's position has a null department_id
     */
    public function unlinkedEmployees(): JsonResponse
    {
        try {
            $employees = Employee::with([
                    'basicInfo',
                    'item.position',
                ])
                ->get()
                ->filter(function (Employee $employee) {
                    // No item assigned at all
                    if (is_null($employee->item_id) || is_null($employee->item)) {
                        return true;
                    }
                    // Item has no position
                    if (is_null($employee->item->position)) {
                        return true;
                    }
                    // Position has no department
                    return is_null($employee->item->position->department_id);
                })
                ->map(fn(Employee $employee) => [
                    'employee_id'   => $employee->employee_id,
                    'full_name'     => trim(collect([
                        $employee->basicInfo?->first_name ?? '',
                        $employee->basicInfo?->middle_name ?? '',
                        $employee->basicInfo?->last_name ?? '',
                    ])->filter()->implode(' ')),
                    'work_id'       => $employee->work_id,
                    'position_name' => $employee->item?->position?->position_name,
                ])
                ->values();

            return response()->json($employees);
        } catch (\Throwable $e) {
            \Log::error('unlinkedEmployees error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Link a set of employees to the given department by updating the
     * department_id on each employee's position.
     */
    public function attachEmployees(Request $request, Department $department): RedirectResponse
    {
        $request->validate([
            'employee_ids'   => ['required', 'array'],
            'employee_ids.*' => ['integer', 'exists:employees,employee_id'],
        ]);

        Employee::with('item.position')
            ->whereIn('employee_id', $request->employee_ids)
            ->get()
            ->each(function (Employee $employee) use ($department) {
                $position = $employee->item?->position;
                if ($position) {
                    $position->update(['department_id' => $department->department_id]);
                }
            });

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module'  => 'organization',
            'activity' => 'Assigned ' . count($request->employee_ids) . ' employee(s) to ' . $department->department_name,
        ]);

        return redirect()->route('department.index')
            ->with('success', count($request->employee_ids) . ' employee(s) linked to ' . $department->department_name . ' successfully.');
    }

    public function cleanDepartmentName(string $name): string
    {
        if (preg_match('/^Department of\s+/i', $name)) {
            $name = preg_replace('/^Department of\s+/i', '', $name);
        } elseif (preg_match('/\s+Department$/i', $name)) {
            $name = preg_replace('/\s+Department$/i', '', $name);
        }

        return trim($name);
    }
}