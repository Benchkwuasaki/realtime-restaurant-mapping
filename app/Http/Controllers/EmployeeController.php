<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeBasicInfo;
use App\Models\Item;
use App\Models\SalaryGradeStep;
use App\Models\EmployeeAddress;
use App\Models\EmployeeEducation;
use App\Models\EmployeeAllowance;
use App\Models\FamilyInfo;
use App\Models\GovernmentAccount;
use App\Models\EligibilityInformation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display the employee list page.
     */
    // public function __construct(protected ActivityLogService $activityLogService)
    // {
    // }

    public function index()
    {

        // $this->activityLogService->createLog([
        //     'user_id' => Auth::id(),
        //     'module' => 'attendance',
        //     'description' => 'Viewed Employee Page',
        // ]);
        $tasks = Employee::with([
            'basicInfo',
            'item.position.department',
            'item.position.division',
            'item.position.unit',
        ])
            ->get()
            ->map(fn(Employee $employee) => $this->formatForTable($employee));

        return Inertia::render('Employee/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function create()
    {
        return Inertia::render('Employee/CreateEmployee', [
            'items' => Item::with('position.department')->get(),
            'salaryGradeSteps' => SalaryGradeStep::orderBy('salary_grade')
                ->orderBy('step')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name'                 => ['required', 'string', 'max:255'],
            'last_name'                  => ['required', 'string', 'max:255'],
            'middle_name'                => ['nullable', 'string', 'max:255'],
            'name_extension'             => ['nullable', 'string', 'max:50'],
            'birth_date'                 => ['required', 'date'],
            'sex'                        => ['required', 'boolean'],
            'civil_status'               => ['required', 'string'],
            'place_of_birth'             => ['nullable', 'string', 'max:255'],
            'personal_email'             => ['nullable', 'email', 'max:255'],
            'phone_number'               => ['required', 'string', 'max:20'],
            'item_id'                    => ['required', 'exists:items,item_id'],
            'salary_grade_step_id'       => ['required', 'exists:salary_grade_steps,salary_grade_step_id'],
            'employment_classification'  => ['required', 'string'],
            'work_email'                 => ['required', 'email', 'unique:employees,work_email'],
            'password'                   => ['required', 'string', 'min:8'],
            'date_applied'               => ['required', 'date'],
            'date_hired'                 => ['required', 'date'],
            'work_schedule_start'        => ['required', 'date_format:H:i'],
            'work_schedule_end'          => ['required', 'date_format:H:i'],
            'status'                     => ['required', 'boolean'],
            'addresses'                  => ['nullable', 'array'],
            'addresses.*.street_address' => ['nullable', 'string', 'max:255'],
            'addresses.*.city'           => ['nullable', 'string', 'max:255'],
            'addresses.*.state'          => ['nullable', 'string', 'max:255'],
            'addresses.*.zip_code'       => ['nullable', 'string', 'max:20'],
            'family_info'                => ['nullable', 'array'],
            'family_info.*.full_name'    => ['required_with:family_info', 'string', 'max:255'],
            'family_info.*.contact_number' => ['nullable', 'string', 'max:20'],
            'family_info.*.relationship' => ['nullable', 'string', 'max:100'],
            'government_accounts'        => ['nullable', 'array'],
            'government_accounts.*.account_type'   => ['required_with:government_accounts', 'string', 'max:100'],
            'government_accounts.*.account_number' => ['required_with:government_accounts', 'string', 'max:100'],
            'education'                  => ['nullable', 'array'],
            'education.*.level'          => ['nullable', 'string', 'max:100'],
            'education.*.school_name'    => ['required_with:education', 'string', 'max:255'],
            'education.*.school_address' => ['nullable', 'string', 'max:255'],
            'education.*.graduation_date' => ['nullable', 'date'],
            'education.*.degree'         => ['nullable', 'string', 'max:255'],
            'eligibility_information'    => ['nullable', 'array'],
            'eligibility_information.*.eligibility_name' => ['required_with:eligibility_information', 'string', 'max:255'],
            'eligibility_information.*.year_passed'      => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($request) {
            $basicInfo = EmployeeBasicInfo::create([
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'middle_name'    => $request->middle_name,
                'name_extension' => $request->name_extension,
                'birth_date'     => $request->birth_date,
                'sex'            => $request->sex,
                'civil_status'   => $request->civil_status,
                'place_of_birth' => $request->place_of_birth,
                'personal_email' => $request->personal_email,
                'phone_number'   => $request->phone_number,
            ]);

            $employee = Employee::create([
                'employee_basic_info_id'    => $basicInfo->employee_basic_info_id,
                'item_id'                   => $request->item_id,
                'salary_grade_step_id'      => $request->salary_grade_step_id,
                'employment_classification' => $request->employment_classification,
                'work_email'                => $request->work_email,
                'password'                  => Hash::make($request->password),
                'date_applied'              => $request->date_applied,
                'date_hired'                => $request->date_hired,
                'work_schedule_start'       => $request->work_schedule_start,
                'work_schedule_end'         => $request->work_schedule_end,
                'status'                    => $request->status,
            ]);

            foreach ($request->addresses ?? [] as $address) {
                EmployeeAddress::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'street_address'         => $address['street_address'] ?? null,
                    'city'                   => $address['city'] ?? null,
                    'state'                  => $address['state'] ?? null,
                    'zip_code'               => $address['zip_code'] ?? null,
                ]);
            }

            foreach ($request->family_info ?? [] as $member) {
                FamilyInfo::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'full_name'              => $member['full_name'],
                    'contact_number'         => $member['contact_number'] ?? null,
                    'relationship'           => $member['relationship'] ?? null,
                ]);
            }

            foreach ($request->government_accounts ?? [] as $account) {
                GovernmentAccount::create([
                    'employee_id'    => $employee->employee_id,
                    'account_type'   => $account['account_type'],
                    'account_number' => $account['account_number'],
                ]);
            }

            foreach ($request->education ?? [] as $edu) {
                EmployeeEducation::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'level'                  => $edu['level'] ?? null,
                    'school_name'            => $edu['school_name'],
                    'school_address'         => $edu['school_address'] ?? null,
                    'graduation_date'        => $edu['graduation_date'] ?? null,
                    'degree'                 => $edu['degree'] ?? null,
                ]);
            }

            foreach ($request->eligibility_information ?? [] as $eligibility) {
                EligibilityInformation::create([
                    'employee_id'      => $employee->employee_id,
                    'eligibility_name' => $eligibility['eligibility_name'],
                    'year_passed'      => $eligibility['year_passed'] ?? null,
                ]);
            }
        });

        return redirect()->route('employee.index')
            ->with('success', 'Employee created successfully.');
    }

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
            'salaryGradeStep',
            'serviceRecords',
            'seminarsAndTrainings',
            'eligibilityInformation',
            'governmentAccounts',
            'uploadedFiles',
        ]);

        return Inertia::render('Employee/Show', [
            'employee' => $employee,
            'items'    => Item::with([
                'position.department',
                'position.division',
                'position.unit',
            ])->get(),
        ]);
    }

    public function edit(Employee $employee)
    {
        $employee->load(['basicInfo', 'item.position']);

        return Inertia::render('Employee/Edit', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'first_name'                => 'sometimes|required|string|max:255',
            'last_name'                 => 'sometimes|required|string|max:255',
            'middle_name'               => 'nullable|string|max:255',
            'name_extension'            => 'nullable|string|max:255',
            'birth_date'                => 'sometimes|required|date',
            'sex'                       => 'sometimes|required|boolean',
            'personal_email'            => 'nullable|email|max:255',
            'phone_number'              => 'nullable|string|max:255',
            'civil_status'              => 'nullable|in:single,married,divorced,widowed',
            'place_of_birth'            => 'nullable|string|max:255',
            'item_id'                   => 'sometimes|required|exists:items,item_id',
            'salary_grade_step_id'      => 'sometimes|required|exists:salary_grade_steps,salary_grade_step_id',
            'employment_classification' => 'sometimes|required|in:Regular,Job Order,Casual',
            'work_email'                => 'sometimes|required|email|unique:employees,work_email,' . $employee->employee_id . ',employee_id',
            'password'                  => 'nullable|string|min:8',
            'date_applied'              => 'sometimes|required|date',
            'date_hired'                => 'sometimes|required|date',
            'work_schedule_start'       => 'sometimes|required|date_format:H:i',
            'work_schedule_end'         => 'sometimes|required|date_format:H:i',
            'status'                    => 'sometimes|required|boolean',
        ]);

        $employee->basicInfo->update($request->only([
            'first_name',
            'last_name',
            'middle_name',
            'name_extension',
            'birth_date',
            'sex',
            'personal_email',
            'phone_number',
            'civil_status',
            'place_of_birth',
        ]));

        $employeeData = $request->only([
            'item_id',
            'salary_grade_step_id',
            'employment_classification',
            'work_email',
            'date_applied',
            'date_hired',
            'work_schedule_start',
            'work_schedule_end',
        ]);

        if ($request->has('status')) {
            $employeeData['status'] = $request->boolean('status');
        }

        if ($request->filled('password')) {
            $employeeData['password'] = Hash::make($request->password);
        }

        $employee->update($employeeData);

        return redirect()->route('employee.show', $employee)
            ->with('success', 'Employee updated successfully.');
    }

    public function toggleStatus(Employee $employee)
    {
        $employee->update(['status' => !$employee->status]);

        return back()->with('success', 'Employee status updated.');
    }

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
            'status'        => (bool) $employee->status,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Government Accounts
    // ─────────────────────────────────────────────────────────────────────────

    public function storeGovernmentAccount(Request $request, Employee $employee)
    {
        $request->validate([
            'account_type'   => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:100'],
        ]);

        // One record per type — replace if exists
        $employee->governmentAccounts()
            ->where('account_type', $request->account_type)
            ->delete();

        GovernmentAccount::create([
            'employee_id'    => $employee->employee_id,
            'account_type'   => $request->account_type,
            'account_number' => $request->account_number,
        ]);

        return back()->with('success', 'Government account saved.');
    }

    public function updateGovernmentAccount(Request $request, Employee $employee, GovernmentAccount $account)
    {
        $request->validate(['account_number' => ['required', 'string', 'max:100']]);
        abort_if($account->employee_id !== $employee->employee_id, 403);

        $account->update(['account_number' => $request->account_number]);

        return back()->with('success', 'Government account updated.');
    }

    public function destroyGovernmentAccount(Employee $employee, GovernmentAccount $account)
    {
        abort_if($account->employee_id !== $employee->employee_id, 403);
        $account->delete();

        return back()->with('success', 'Government account deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Eligibility
    // ─────────────────────────────────────────────────────────────────────────

    public function storeEligibility(Request $request, Employee $employee)
    {
        $request->validate([
            'eligibility_name' => ['required', 'string', 'max:255'],
            'year_passed'      => ['nullable', 'date'],
        ]);

        EligibilityInformation::create([
            'employee_id'      => $employee->employee_id,
            'eligibility_name' => $request->eligibility_name,
            'year_passed'      => $request->year_passed,
        ]);

        return back()->with('success', 'Eligibility added.');
    }

    public function updateEligibility(Request $request, Employee $employee, EligibilityInformation $eligibility)
    {
        $request->validate([
            'eligibility_name' => ['required', 'string', 'max:255'],
            'year_passed'      => ['nullable', 'date'],
        ]);
        abort_if($eligibility->employee_id !== $employee->employee_id, 403);

        // Update the existing record — never creates a duplicate
        $eligibility->update([
            'eligibility_name' => $request->eligibility_name,
            'year_passed'      => $request->year_passed,
        ]);

        return back()->with('success', 'Eligibility updated.');
    }

    public function destroyEligibility(Employee $employee, EligibilityInformation $eligibility)
    {
        abort_if($eligibility->employee_id !== $employee->employee_id, 403);
        $eligibility->delete();

        return back()->with('success', 'Eligibility deleted.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['exists:employees,employee_id']]);

        $employees = Employee::whereIn('employee_id', $request->ids)->get();

        foreach ($employees as $employee) {
            $basicInfo = $employee->basicInfo;
            $employee->delete();
            $basicInfo?->delete();
        }
    }
}
