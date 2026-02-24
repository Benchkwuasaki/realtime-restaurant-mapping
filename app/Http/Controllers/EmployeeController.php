<?php

namespace App\Http\Controllers;

<<<<<<< HEAD
use App\Models\Employee;
use App\Models\EmployeeBasicInfo;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
=======
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
>>>>>>> 0ddddb0987cdf244066b80c2213c1e31c1a3553d
use Inertia\Inertia;

class EmployeeController extends Controller
{
<<<<<<< HEAD
    /**
     * Display the employee list page.
     */
    public function index()
    {
        $tasks = Employee::with([
            'basicInfo',
            'item.position.department',
            'item.position.division',
            'item.position.unit',
        ])
            ->get()
            ->map(fn(Employee $employee) => $this->formatForTable($employee));
=======
    public function index()
    {
        $tasks = json_decode(file_get_contents(base_path('resources/js/components/Employeee/data/task.json')), true);
>>>>>>> 0ddddb0987cdf244066b80c2213c1e31c1a3553d

        return Inertia::render('Employee/Index', [
            'tasks' => $tasks,
        ]);
<<<<<<< HEAD
=======
    }

    public function create()
    {
        return Inertia::render('Employee/CreateEmployee');
>>>>>>> 0ddddb0987cdf244066b80c2213c1e31c1a3553d
    }

    /**
     * Show the create employee form.
     */
    public function create()
    {
        return Inertia::render('Employee/Create');
    }

    /**
     * Store a new employee.
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name'              => 'required|string|max:255',
            'last_name'               => 'required|string|max:255',
            'middle_name'             => 'nullable|string|max:255',
            'name_extension'          => 'nullable|string|max:255',
            'birth_date'              => 'required|date',
            'sex'                     => 'required|boolean',
            'personal_email'          => 'nullable|email|max:255',
            'phone_number'            => 'nullable|string|max:255',
            'civil_status'            => 'nullable|in:single,married,divorced,widowed',
            'place_of_birth'          => 'nullable|string|max:255',
            'item_id'                 => 'required|exists:items,item_id',
            'salary_grade_step_id'    => 'required|exists:salary_grade_steps,salary_grade_step_id',
            'employment_classification' => 'required|in:Regular,Job Order,Casual',
            'work_email'              => 'required|email|unique:employees,work_email',
            'password'                => 'required|string|min:8',
            'date_applied'            => 'required|date',
            'date_hired'              => 'required|date',
            'work_schedule_start'     => 'required|date_format:H:i',
            'work_schedule_end'       => 'required|date_format:H:i',
            'status'                  => 'required|boolean', // true = Active, false = Inactive
        ]);

        $basicInfo = EmployeeBasicInfo::create([
            'first_name'     => $request->first_name,
            'last_name'      => $request->last_name,
            'middle_name'    => $request->middle_name,
            'name_extension' => $request->name_extension,
            'birth_date'     => $request->birth_date,
            'sex'            => $request->sex,
            'personal_email' => $request->personal_email,
            'phone_number'   => $request->phone_number,
            'civil_status'   => $request->civil_status,
            'place_of_birth' => $request->place_of_birth,
        ]);

        Employee::create([
            'employee_basic_info_id'   => $basicInfo->employee_basic_info_id,
            'item_id'                  => $request->item_id,
            'salary_grade_step_id'     => $request->salary_grade_step_id,
            'employment_classification' => $request->employment_classification,
            'work_email'               => $request->work_email,
            'password'                 => Hash::make($request->password),
            'date_applied'             => $request->date_applied,
            'date_hired'               => $request->date_hired,
            'work_schedule_start'      => $request->work_schedule_start,
            'work_schedule_end'        => $request->work_schedule_end,
            'status'                   => $request->boolean('status'),
        ]);

        return redirect()->route('employee.index')->with('success', 'Employee created successfully.');
    }

    /**
     * Show a single employee.
     */
    public function show(Employee $employee)
    {
        $employee->load([
            'basicInfo.addresses',
            'basicInfo.educations',
            'basicInfo.familyInfo',
            'item.position.department',
            'item.position.division',
            'item.position.unit',
            'allowances',
            'serviceRecords',
            'seminarsAndTrainings',
            'eligibilityInformation',
            'uploadedFiles',
            'waterBill',
        ]);

        return Inertia::render('Employee/Show', [
            'employee' => $employee,
        ]);
    }

    /**
     * Show the edit form for an employee.
     */
    public function edit(Employee $employee)
    {
        $employee->load(['basicInfo', 'item.position']);

        return Inertia::render('Employee/Edit', [
            'employee' => $employee,
        ]);
    }

    /**
     * Update an existing employee.
     */
    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'first_name'              => 'sometimes|required|string|max:255',
            'last_name'               => 'sometimes|required|string|max:255',
            'middle_name'             => 'nullable|string|max:255',
            'name_extension'          => 'nullable|string|max:255',
            'birth_date'              => 'sometimes|required|date',
            'sex'                     => 'sometimes|required|boolean',
            'personal_email'          => 'nullable|email|max:255',
            'phone_number'            => 'nullable|string|max:255',
            'civil_status'            => 'nullable|in:single,married,divorced,widowed',
            'place_of_birth'          => 'nullable|string|max:255',
            'item_id'                 => 'sometimes|required|exists:items,item_id',
            'salary_grade_step_id'    => 'sometimes|required|exists:salary_grade_steps,salary_grade_step_id',
            'employment_classification' => 'sometimes|required|in:Regular,Job Order,Casual',
            'work_email'              => 'sometimes|required|email|unique:employees,work_email,' . $employee->employee_id . ',employee_id',
            'password'                => 'nullable|string|min:8',
            'date_applied'            => 'sometimes|required|date',
            'date_hired'              => 'sometimes|required|date',
            'work_schedule_start'     => 'sometimes|required|date_format:H:i',
            'work_schedule_end'       => 'sometimes|required|date_format:H:i',
            'status'                  => 'sometimes|required|boolean',
        ]);

        $employee->basicInfo->update($request->only([
            'first_name', 'last_name', 'middle_name', 'name_extension',
            'birth_date', 'sex', 'personal_email', 'phone_number',
            'civil_status', 'place_of_birth',
        ]));

        $employeeData = $request->only([
            'item_id', 'salary_grade_step_id', 'employment_classification',
            'work_email', 'date_applied', 'date_hired',
            'work_schedule_start', 'work_schedule_end',
        ]);

        // Use request->boolean() to safely cast 0/1/true/false
        if ($request->has('status')) {
            $employeeData['status'] = $request->boolean('status');
        }

        if ($request->filled('password')) {
            $employeeData['password'] = Hash::make($request->password);
        }

        $employee->update($employeeData);

        return redirect()->route('employee.index')->with('success', 'Employee updated successfully.');
    }

    /**
     * Toggle the active/inactive status of an employee.
     */
    public function toggleStatus(Employee $employee)
    {
        $employee->update([
            'status' => !$employee->status, // flips true <-> false
        ]);

        return back()->with('success', 'Employee status updated.');
    }

    /**
     * Delete an employee.
     */
    public function destroy(Employee $employee)
    {
        $basicInfo = $employee->basicInfo;
        $employee->delete();
        $basicInfo->delete();

        return redirect()->route('employee.index')->with('success', 'Employee deleted successfully.');
    }

    // ── Helpers ────────────────────────────────────────────────────

    private function formatForTable(Employee $employee): array
    {
        $position = $employee->item?->position;

        return [
            'id'            => (string) $employee->employee_id,
            'name'          => $employee->basicInfo?->full_name ?? '—',
            'position'      => $position?->position_name ?? '—',
            'unit'          => $position?->unit?->unit_name ?? '—',
            'division'      => $position?->division?->division_name ?? '—',
            'department'    => $position?->department?->department_name ?? '—',
            'contactNumber' => $employee->basicInfo?->phone_number ?? '—',
            'email'         => $employee->work_email,
            // Cast explicitly so MySQL's 0/1 tinyint becomes a true PHP bool,
            // which Inertia will serialize to JSON true/false (not 0/1).
            'status'        => (bool) $employee->status,
        ];
    }
}