<?php

namespace App\Http\Controllers;

use App\Models\EligibilityInformation;
use App\Models\Employee;
use App\Models\EmployeeAddress;
use App\Models\EmployeeBasicInfo;
use App\Models\EmployeeEducation;
use App\Models\EmployeeUploadedFile;
use App\Models\FamilyInfo;
use App\Models\GovernmentAccount;
use App\Models\ITem;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Index
    // ─────────────────────────────────────────────────────────────────────────

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'employee',
            'description' => 'Viewed Employee Page',
        ]);

        $employees = Employee::with([
            'basicInfo',
            'item.position.department',
            'item.position.division',
            'item.position.unit',
        ])
            ->get()
            ->map(fn (Employee $employee) => $this->formatForTable($employee));

        return Inertia::render('Employee/Index', [
            'employees' => $employees,
            'totalEmployees' => $employees->count(),
            'activeEmployees' => $employees->where('status', true)->count(),
            'inactiveEmployees' => $employees->where('status', false)->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create
    // ─────────────────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('Employee/CreateEmployee', [
            'items' => Item::with(['position.department', 'position.division', 'position.unit', 'employee'])
                ->get()
                ->map(fn (Item $item) => [
                    'item_id' => $item->item_id,
                    'is_occupied' => $item->employee !== null,
                    'position' => $item->position ? [
                        'position_name' => $item->position->position_name,
                        'position_type' => $item->position->position_type,
                        'department_id' => $item->position->department_id,
                        'division_id' => $item->position->division_id,
                        'unit_id' => $item->position->unit_id,
                        'department' => $item->position->department
                            ? ['department_name' => $item->position->department->department_name]
                            : null,
                        'division' => $item->position->division
                            ? ['division_name' => $item->position->division->division_name]
                            : null,
                        'unit' => $item->position->unit
                            ? ['unit_name' => $item->position->unit->unit_name]
                            : null,
                    ] : null,
                ]),
            'salaryGradeSteps' => SalaryGradeStep::orderBy('salary_grade')->orderBy('step')->get(),
            'employmentClassifications' => \App\Models\EmploymentClassification::orderBy('name')->get(['id', 'name', 'description']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Store
    // ─────────────────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $request->validate([
            // ── Personal Information ───────────────────────────────────────────────
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'name_extension' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['required', 'date', 'before:today'],
            'sex' => ['required', 'boolean'],
            'civil_status' => ['required', 'string', 'in:single,married,divorced,widowed'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'phone_number' => ['required', 'string', 'regex:/^09\d{9}$/'],

            // ── Employment Details ─────────────────────────────────────────────────
            'item_id' => ['required', 'exists:items,item_id'],
            'salary_grade_step_id' => ['required', 'exists:salary_grade_steps,salary_grade_step_id'],
            'employment_classification' => ['required', 'string', 'exists:employment_classifications,name'],
            'work_email' => ['required', 'email', 'max:255', Rule::unique('employees', 'work_email')->whereNull('deleted_at')],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-_=+[\]{};:\'",.<>?\/\\|`~]).+$/',
            ],
            'date_applied' => ['required', 'date'],
            'date_hired' => ['required', 'date', 'after_or_equal:date_applied'],
            'work_schedule_start' => ['required', 'date_format:H:i'],
            'work_schedule_end' => ['required', 'date_format:H:i', 'different:work_schedule_start'],
            'status' => ['required', 'boolean'],

            // ── Addresses ─────────────────────────────────────────────────────────
            'addresses' => ['required', 'array', 'min:1'],
            'addresses.*.street_address' => ['required', 'string', 'max:255'],
            'addresses.*.city' => ['required', 'string', 'max:255'],
            'addresses.*.state' => ['required', 'string', 'max:255'],
            'addresses.*.zip_code' => ['required', 'string', 'max:20'],

            // ── Family Information ────────────────────────────────────────────────
            'family_info' => ['required', 'array', 'min:1'],
            'family_info.*.full_name' => ['required', 'string', 'max:255'],
            'family_info.*.contact_number' => ['nullable', 'string', 'max:20'],
            'family_info.*.relationship' => ['required', 'string', 'max:100'],
            'family_info.*.sex' => ['nullable', 'boolean'],
            'family_info.*.date_of_birth' => ['nullable', 'date'],
            'family_info.*.place_of_birth' => ['nullable', 'string', 'max:255'],

            // ── Government Accounts ───────────────────────────────────────────────
            'government_accounts' => ['required', 'array', 'min:1'],
            'government_accounts.*.account_type' => ['required', 'string', 'max:100'],
            'government_accounts.*.account_number' => ['required', 'string', 'max:100'],

            // ── Education ─────────────────────────────────────────────────────────
            'education' => ['required', 'array', 'min:1'],
            'education.*.level' => ['required', 'string', 'max:100'],
            'education.*.school_name' => ['required', 'string', 'max:255'],
            'education.*.school_address' => ['nullable', 'string', 'max:255'],
            'education.*.graduation_date' => ['nullable', 'date'],
            'education.*.degree' => ['nullable', 'string', 'max:255'],

            // ── Eligibility ───────────────────────────────────────────────────────
            'eligibility_information' => ['required', 'array', 'min:1'],
            'eligibility_information.*.eligibility_name' => ['required', 'string', 'max:255'],
            'eligibility_information.*.year_passed' => ['required', 'date'],
        ]);

        // ── Duplicate government account type check ────────────────────────────────
        $accountTypes = collect($request->government_accounts)->pluck('account_type');
        if ($accountTypes->count() !== $accountTypes->unique()->count()) {
            return back()->withErrors([
                'government_accounts' => 'Each government account type must be unique.',
            ])->withInput();
        }

        DB::transaction(function () use ($request) {

            $basicInfo = EmployeeBasicInfo::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
                'name_extension' => $request->name_extension,
                'birth_date' => $request->birth_date,
                'sex' => $request->sex,
                'civil_status' => $request->civil_status,
                'place_of_birth' => $request->place_of_birth,
                'personal_email' => $request->personal_email,
                'phone_number' => $request->phone_number,
            ]);

            $employee = Employee::create([
                'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                'item_id' => $request->item_id,
                'salary_grade_step_id' => $request->salary_grade_step_id,
                'employment_classification' => $request->employment_classification,
                'work_email' => $request->work_email,
                'password' => Hash::make($request->password),
                'date_applied' => $request->date_applied,
                'date_hired' => $request->date_hired,
                'work_schedule_start' => $request->work_schedule_start,
                'work_schedule_end' => $request->work_schedule_end,
                'status' => $request->status,
            ]);

            foreach ($request->addresses as $address) {
                EmployeeAddress::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'street_address' => $address['street_address'],
                    'city' => $address['city'],
                    'state' => $address['state'],
                    'zip_code' => $address['zip_code'],
                ]);
            }

            foreach ($request->family_info as $member) {
                FamilyInfo::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'full_name' => $member['full_name'],
                    'contact_number' => ! empty($member['contact_number']) ? $member['contact_number'] : null,
                    'relationship' => $member['relationship'],
                    'sex' => isset($member['sex']) && $member['sex'] !== '' ? (bool) $member['sex'] : null,
                    'date_of_birth' => ! empty($member['date_of_birth']) ? $member['date_of_birth'] : null,
                    'place_of_birth' => ! empty($member['place_of_birth']) ? $member['place_of_birth'] : null,
                ]);
            }

            foreach ($request->government_accounts as $account) {
                GovernmentAccount::create([
                    'employee_id' => $employee->employee_id,
                    'account_type' => $account['account_type'],
                    'account_number' => $account['account_number'],
                ]);
            }

            foreach ($request->education as $edu) {
                EmployeeEducation::create([
                    'employee_basic_info_id' => $basicInfo->employee_basic_info_id,
                    'level' => $edu['level'],
                    'school_name' => $edu['school_name'],
                    'school_address' => ! empty($edu['school_address']) ? $edu['school_address'] : null,
                    'graduation_date' => ! empty($edu['graduation_date']) ? $edu['graduation_date'] : null,
                    'degree' => ! empty($edu['degree']) ? $edu['degree'] : null,
                ]);
            }

            foreach ($request->eligibility_information as $eligibility) {
                EligibilityInformation::create([
                    'employee_id' => $employee->employee_id,
                    'eligibility_name' => $eligibility['eligibility_name'],
                    'year_passed' => $eligibility['year_passed'],
                ]);
            }
        });

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'employee',
            'description' => 'Created employee: '.$request->first_name.' '.$request->last_name,
        ]);

        return redirect()->route('employee.index')
            ->with('success', 'Employee created successfully.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Show
    // ─────────────────────────────────────────────────────────────────────────

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
            'leaveBalances',
            'internalOrganizations',
        ]);

        return Inertia::render('Employee/Show', [
            'employee' => [
                'employee_id' => $employee->employee_id,
                'work_email' => $employee->work_email,
                'employment_classification' => $employee->employment_classification,
                'date_applied' => $employee->date_applied,
                'date_hired' => $employee->date_hired,
                'work_schedule_start' => $employee->work_schedule_start,
                'work_schedule_end' => $employee->work_schedule_end,
                'status' => $employee->status,
                'avatar_url' => $employee->avatar_url,

                // snake_case keys — match the TypeScript interface exactly
                'basic_info' => $employee->basicInfo,
                'item' => $employee->item,
                'salary_grade_step' => $employee->salaryGradeStep,
                'allowances' => $employee->allowances,
                'eligibility_information' => $employee->eligibilityInformation,
                'government_accounts' => $employee->governmentAccounts,
                'leave_balances' => $employee->leaveBalances,
                'internal_organizations' => $employee->internalOrganizations,

                // camelCase keys — match the TypeScript interface exactly
                'uploadedFiles' => $employee->uploadedFiles,
                'seminarsAndTrainings' => $employee->seminarsAndTrainings->map(fn ($s) => [
                    'id' => $s->employee_seminar_training_id,
                    'seminar_name' => $s->seminar_training_name,
                    'venue' => $s->venue,
                    'date_attended' => $s->date_attended,
                ]),
                'serviceRecords' => $employee->serviceRecords,
            ],
            'items' => Item::with([
                'position.department',
                'position.division',
                'position.unit',
                'employee',
            ])
                ->get()
                ->map(fn (Item $item) => [
                    'item_id' => $item->item_id,
                    'is_occupied' => $item->employee !== null
                        && $item->employee->employee_id !== $employee->employee_id,
                    'position' => $item->position ? [
                        'position_name' => $item->position->position_name,
                        'department' => $item->position->department
                            ? ['department_name' => $item->position->department->department_name]
                            : null,
                        'division' => $item->position->division
                            ? ['division_name' => $item->position->division->division_name]
                            : null,
                        'unit' => $item->position->unit
                            ? ['unit_name' => $item->position->unit->unit_name]
                            : null,
                    ] : null,
                ]),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edit
    // ─────────────────────────────────────────────────────────────────────────

    public function edit(Employee $employee)
    {
        $employee->load(['basicInfo', 'item.position']);

        return Inertia::render('Employee/Edit', [
            'employee' => $employee,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────────────────────────────────

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'name_extension' => 'nullable|string|max:255',
            'birth_date' => 'sometimes|required|date',
            'sex' => 'sometimes|required|boolean',
            'personal_email' => 'nullable|email|max:255',
            'phone_number' => 'nullable|string|max:255',
            'civil_status' => 'nullable|in:single,married,divorced,widowed',
            'place_of_birth' => 'nullable|string|max:255',

            'item_id' => 'sometimes|required|exists:items,item_id',
            'salary_grade_step_id' => 'sometimes|required|exists:salary_grade_steps,salary_grade_step_id',
            'employment_classification' => 'sometimes|required|string|exists:employment_classifications,name',
            'work_email' => 'sometimes|required|email|unique:employees,work_email,'.$employee->employee_id.',employee_id',
            'password' => 'nullable|string|min:8',
            'date_applied' => 'sometimes|required|date',
            'date_hired' => 'sometimes|required|date',
            'work_schedule_start' => 'sometimes|required|date_format:H:i',
            'work_schedule_end' => 'sometimes|required|date_format:H:i',
            'status' => 'sometimes|required|boolean',
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

    // ─────────────────────────────────────────────────────────────────────────
    // Toggle Status / Destroy / Bulk Destroy
    // ─────────────────────────────────────────────────────────────────────────

    public function toggleStatus(Employee $employee)
    {
        $employee->update(['status' => ! $employee->status]);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'employee',
            'description' => ($employee->status ? 'Activated' : 'Deactivated').' employee: '.$employee->basicInfo?->full_name,
        ]);

        return back()->with('success', 'Employee status updated.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'employee',
            'description' => 'Deleted employee: '.$employee->basicInfo?->full_name,
        ]);

        return redirect()->route('employee.index')->with('success', 'Employee deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:employees,employee_id'],
        ]);

        $employees = Employee::whereIn('employee_id', $request->ids)->get();

        foreach ($employees as $employee) {
            $employee->delete();
        }

        return back()->with('success', count($request->ids).' employee(s) deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function formatForTable(Employee $employee): array
    {
        $position = $employee->item?->position;

        return [
            'id' => (string) $employee->employee_id,
            'name' => $employee->basicInfo?->full_name ?? '—',
            'position' => $position?->position_name ?? '—',
            'unit' => $position?->unit?->unit_name ?? '—',
            'division' => $position?->division?->division_name ?? '—',
            'department' => $position?->department?->department_name ?? '—',
            'contactNumber' => $employee->basicInfo?->phone_number ?? '—',
            'email' => $employee->work_email,
            'status' => (bool) $employee->status,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Government Accounts
    // ─────────────────────────────────────────────────────────────────────────

    public function storeGovernmentAccount(Request $request, Employee $employee)
    {
        $request->validate([
            'account_type' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:100'],
        ]);

        // One record per type — replace if exists
        $employee->governmentAccounts()
            ->where('account_type', $request->account_type)
            ->delete();

        GovernmentAccount::create([
            'employee_id' => $employee->employee_id,
            'account_type' => $request->account_type,
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
            'year_passed' => ['nullable', 'date'],
        ]);

        EligibilityInformation::create([
            'employee_id' => $employee->employee_id,
            'eligibility_name' => $request->eligibility_name,
            'year_passed' => $request->filled('year_passed') ? $request->year_passed : null,
        ]);

        return back()->with('success', 'Eligibility added.');
    }

    public function updateEligibility(Request $request, Employee $employee, EligibilityInformation $eligibility)
    {
        $request->validate([
            'eligibility_name' => ['required', 'string', 'max:255'],
            'year_passed' => ['nullable', 'date'],
        ]);
        abort_if($eligibility->employee_id !== $employee->employee_id, 403);

        $eligibility->update([
            'eligibility_name' => $request->eligibility_name,
            'year_passed' => $request->filled('year_passed') ? $request->year_passed : null,
        ]);

        return back()->with('success', 'Eligibility updated.');
    }

    public function destroyEligibility(Employee $employee, EligibilityInformation $eligibility)
    {
        abort_if($eligibility->employee_id !== $employee->employee_id, 403);
        $eligibility->delete();

        return back()->with('success', 'Eligibility deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Family Info
    // ─────────────────────────────────────────────────────────────────────────

    public function storeFamily(Request $request, Employee $employee)
    {
        $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'relationship' => ['nullable', 'string', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'sex' => ['nullable', 'boolean'],
            'date_of_birth' => ['nullable', 'date'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
        ]);

        FamilyInfo::create([
            'employee_basic_info_id' => $employee->employee_basic_info_id,
            'full_name' => $request->full_name,
            'relationship' => $request->filled('relationship') ? $request->relationship : null,
            'contact_number' => $request->filled('contact_number') ? $request->contact_number : null,
            // filled() returns false for both null AND empty string "" — prevents date/boolean column errors
            'sex' => $request->filled('sex') ? (bool) $request->sex : null,
            'date_of_birth' => $request->filled('date_of_birth') ? $request->date_of_birth : null,
            'place_of_birth' => $request->filled('place_of_birth') ? $request->place_of_birth : null,
        ]);

        return back()->with('success', 'Family member added.');
    }

    public function updateFamily(Request $request, Employee $employee, int $index)
    {
        $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'relationship' => ['nullable', 'string', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'sex' => ['nullable', 'boolean'],
            'date_of_birth' => ['nullable', 'date'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
        ]);

        $member = FamilyInfo::where('employee_basic_info_id', $employee->employee_basic_info_id)
            ->orderBy((new FamilyInfo)->getKeyName())
            ->get()
            ->get($index);

        abort_if(! $member, 404, 'Family member not found.');

        $member->update([
            'full_name' => $request->full_name,
            'relationship' => $request->filled('relationship') ? $request->relationship : null,
            'contact_number' => $request->filled('contact_number') ? $request->contact_number : null,
            'sex' => $request->filled('sex') ? (bool) $request->sex : null,
            'date_of_birth' => $request->filled('date_of_birth') ? $request->date_of_birth : null,
            'place_of_birth' => $request->filled('place_of_birth') ? $request->place_of_birth : null,
        ]);

        return back()->with('success', 'Family member updated.');
    }

    public function destroyFamily(Employee $employee, int $index)
    {
        $member = FamilyInfo::where('employee_basic_info_id', $employee->employee_basic_info_id)
            ->orderBy('id')
            ->get()
            ->get($index);

        abort_if(! $member, 404, 'Family member not found.');

        $member->delete();

        return back()->with('success', 'Family member deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Education
    // ─────────────────────────────────────────────────────────────────────────

    public function storeEducation(Request $request, Employee $employee)
    {
        $request->validate([
            'school_name' => ['required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:100'],
            'school_address' => ['nullable', 'string', 'max:255'],
            'degree' => ['nullable', 'string', 'max:255'],
            'graduation_date' => ['nullable', 'date'],
        ]);

        EmployeeEducation::create([
            'employee_basic_info_id' => $employee->employee_basic_info_id,
            'school_name' => $request->school_name,
            'level' => $request->filled('level') ? $request->level : null,
            'school_address' => $request->filled('school_address') ? $request->school_address : null,
            'degree' => $request->filled('degree') ? $request->degree : null,
            'graduation_date' => $request->filled('graduation_date') ? $request->graduation_date : null,
        ]);

        return back()->with('success', 'Education record added.');
    }

    public function updateEducation(Request $request, Employee $employee, int $index)
    {
        $request->validate([
            'school_name' => ['required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:100'],
            'school_address' => ['nullable', 'string', 'max:255'],
            'degree' => ['nullable', 'string', 'max:255'],
            'graduation_date' => ['nullable', 'date'],
        ]);

        $edu = EmployeeEducation::where('employee_basic_info_id', $employee->employee_basic_info_id)
            ->orderBy((new EmployeeEducation)->getKeyName())
            ->get()
            ->get($index);

        abort_if(! $edu, 404, 'Education record not found.');

        $edu->update([
            'school_name' => $request->school_name,
            'level' => $request->filled('level') ? $request->level : null,
            'school_address' => $request->filled('school_address') ? $request->school_address : null,
            'degree' => $request->filled('degree') ? $request->degree : null,
            'graduation_date' => $request->filled('graduation_date') ? $request->graduation_date : null,
        ]);

        return back()->with('success', 'Education record updated.');
    }

    public function destroyEducation(Employee $employee, int $index)
    {
        $edu = EmployeeEducation::where('employee_basic_info_id', $employee->employee_basic_info_id)
            ->orderBy('id')
            ->get()
            ->get($index);

        abort_if(! $edu, 404, 'Education record not found.');

        $edu->delete();

        return back()->with('success', 'Education record deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Seminars & Trainings
    // ─────────────────────────────────────────────────────────────────────────

    public function storeSeminar(Request $request, Employee $employee)
    {
        $request->validate([
            'seminar_name' => ['required', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'date_attended' => ['nullable', 'date'],
        ]);

        $employee->seminarsAndTrainings()->create([
            'seminar_name' => $request->seminar_training_name,
            'organizer' => $request->filled('venue') ? $request->venue : null,
            'date_attended' => $request->filled('date_attended') ? $request->date_attended : null,
        ]);

        return back()->with('success', 'Seminar added.');
    }

    public function updateSeminar(Request $request, Employee $employee, $seminar)
    {
        $request->validate([
            'seminar_name' => ['required', 'string', 'max:255'],
            'organizer' => ['nullable', 'string', 'max:255'],
            'date_attended' => ['nullable', 'date'],
        ]);

        $record = $employee->seminarsAndTrainings()->findOrFail($seminar);

        $record->update([
            'seminar_name' => $request->seminar_training_name,
            'organizer' => $request->filled('venue') ? $request->venue : null,
            'date_attended' => $request->filled('date_attended') ? $request->date_attended : null,
        ]);

        return back()->with('success', 'Seminar updated.');
    }

    public function destroySeminar(Employee $employee, $seminar)
    {
        $record = $employee->seminarsAndTrainings()->findOrFail($seminar);
        $record->delete();

        return back()->with('success', 'Seminar deleted.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Service Records
    // ─────────────────────────────────────────────────────────────────────────

    public function storeServiceRecord(Request $request, Employee $employee)
    {
        $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_name' => ['nullable', 'string', 'max:255'],
            'year_start' => ['nullable', 'digits:4', 'integer', 'min:1900', 'max:2100'],
            'year_end' => ['nullable', 'digits:4', 'integer', 'min:1900', 'max:2100'],
        ]);

        $employee->serviceRecords()->create([
            'position_name' => $request->position_name,
            'department_name' => $request->filled('department_name') ? $request->department_name : null,
            'year_start' => $request->filled('year_start') ? $request->year_start : null,
            'year_end' => $request->filled('year_end') ? $request->year_end : null,
        ]);

        return back()->with('success', 'Service record added.');
    }

    public function updateServiceRecord(Request $request, Employee $employee, $record)
    {
        $request->validate([
            'position_name' => ['required', 'string', 'max:255'],
            'department_name' => ['nullable', 'string', 'max:255'],
            'year_start' => ['nullable', 'digits:4', 'integer', 'min:1900', 'max:2100'],
            'year_end' => ['nullable', 'digits:4', 'integer', 'min:1900', 'max:2100'],
        ]);

        $serviceRecord = $employee->serviceRecords()->findOrFail($record);

        $serviceRecord->update([
            'position_name' => $request->position_name,
            'department_name' => $request->filled('department_name') ? $request->department_name : null,
            'year_start' => $request->filled('year_start') ? $request->year_start : null,
            'year_end' => $request->filled('year_end') ? $request->year_end : null,
        ]);

        return back()->with('success', 'Service record updated.');
    }

    public function destroyServiceRecord(Employee $employee, $record)
    {
        $serviceRecord = $employee->serviceRecords()->findOrFail($record);
        $serviceRecord->delete();

        return back()->with('success', 'Service record deleted.');
    }

    public function updateAvatar(Request $request, Employee $employee)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'],
        ]);

        if ($employee->avatar_path) {
            Storage::disk('public')->delete($employee->avatar_path);
        }

        $path = $request->file('avatar')->store(
            'avatars/'.$employee->employee_id,
            'public'
        );

        $employee->update([
            'avatar_path' => $path,
            'avatar_url' => Storage::url($path),   // ← fixed
        ]);

        return back()->with('success', 'Avatar updated successfully.');
    }

    public function storeFile(Request $request, Employee $employee)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:25600'], // 25MB
        ]);

        $uploaded = $request->file('file');

        $path = $uploaded->store(
            'employee-files/'.$employee->employee_id,
            'public'
        );

        $employee->uploadedFiles()->create([
            'file_name' => $uploaded->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $uploaded->getSize(),
            'file_url' => Storage::url($path),
        ]);

        return back()->with('success', 'File uploaded successfully.');
    }

    public function destroyFile(Employee $employee, EmployeeUploadedFile $file)
    {
        abort_if($file->employee_id !== $employee->employee_id, 403);
        Storage::disk('public')->delete($file->file_path);
        $file->delete();

        return back()->with('success', 'File deleted.');
    }
}
