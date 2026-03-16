<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\LeaveEntitlement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LeaveApplicationController extends Controller
{
    public function index()
    {
        $currentYear = now()->year;
        $user = auth()->user();

        // id of employees with hr admin role
        $hrAdminEmployeeIds = User::role('hr_admin')
            ->get()
            ->map(fn ($u) => $u->employee?->employee_id)
            ->filter()
            ->values()
            ->toArray();

        // id of employees with document tracking operator role
        $dtoEmployeeIds = User::role('document_tracking_operator')
            ->get()
            ->map(fn ($u) => $u->employee?->employee_id)
            ->filter()
            ->values()
            ->toArray();

        $leave_entitlements = LeaveEntitlement::with('leaveType')
            ->orderBy('leave_type_id')
            ->orderBy('years_of_service')
            ->get()
            ->map(fn (LeaveEntitlement $e) => [
                'leave_entitlement_id' => $e->leave_entitlement_id,
                'leave_type_id' => $e->leave_type_id,
                'leave_type_name' => $e->leaveType?->leave_type_name ?? '',
                'leave_entitlement_description' => $e->leave_entitlement_description,
                'years_of_service' => $e->years_of_service,
                'days_entitled' => (float) $e->days_entitled,
                'is_paid' => (bool) ($e->leaveType?->is_paid ?? false),
                'eligible_sex' => $e->leaveType?->eligible_sex,
            ]);

        $vacationTypeId = $leave_entitlements->firstWhere('leave_type_name', 'Vacation Leave')['leave_type_id'] ?? null;
        $sickTypeId = $leave_entitlements->firstWhere('leave_type_name', 'Sick Leave')['leave_type_id'] ?? null;

        $employees = Employee::with([
            'basicInfo',
            'item.position.department',
            'salaryGradeStep',
            'leaveBalances' => fn ($q) => $q
                ->where('cycle_year', $currentYear)
                ->whereIn('leave_type_id', array_filter([$vacationTypeId, $sickTypeId])),
        ])
            ->join('employee_basic_info', 'employees.employee_basic_info_id', '=', 'employee_basic_info.employee_basic_info_id')
            ->orderBy('employee_basic_info.last_name')
            ->select('employees.*')
            ->get()
            ->map(fn (Employee $e) => [
                'employee_id' => $e->employee_id,
                'employee_name' => $e->basicInfo->full_name ?? $e->basicInfo->first_name,
                'last_name' => $e->basicInfo->last_name ?? '',
                'first_name' => $e->basicInfo->first_name ?? '',
                'middle_name' => $e->basicInfo->middle_name ?? '',
                'sex' => $e->basicInfo->sex,
                'department_name' => $e->item?->position?->department?->department_name ?? '',
                'position_name' => $e->item?->position?->position_name ?? '',
                'monthly_salary' => $e->salaryGradeStep?->monthly_salary
                    ? number_format((float) $e->salaryGradeStep->monthly_salary, 2)
                    : '',
                'vl_total_earned' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $vacationTypeId)?->total_days ?? 0),
                'vl_balance' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $vacationTypeId)?->balance ?? 0),
                'sl_total_earned' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $sickTypeId)?->total_days ?? 0),
                'sl_balance' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $sickTypeId)?->balance ?? 0),
            ]);

        // filter leave applications based on role
        $query = LeaveApplication::with(['employee.basicInfo', 'leaveType', 'detail'])
            ->orderByDesc('date_of_filing');

        if (
            $user->hasRole('document_tracking_operator') &&
            ! $user->hasRole('hr_admin') &&
            ! $user->hasRole('super_admin') &&
            ! $user->hasRole('ogm')
        ) {
            // dto alone: only leaves from their department
            $departmentId = $user->employee?->item?->position?->department_id;

            $employeeIds = Employee::whereHas('item.position', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            })->pluck('employee_id');

            $query->whereIn('employee_id', $employeeIds);

        } elseif (
            $user->hasRole('employee') &&
            ! $user->hasRole('hr_admin') &&
            ! $user->hasRole('super_admin') &&
            ! $user->hasRole('ogm')
        ) {
            // pure employee only: only their own leaves
            $query->where('employee_id', optional($user->employee)->employee_id);
        }
        // ogm, hr_admin, super_admin: no filter — show all

        $leave_applications = $query->get()
            ->map(fn (LeaveApplication $app) => [
                'leave_application_id' => $app->leave_application_id,
                'employee_id' => $app->employee_id,
                'leave_type_id' => $app->leave_type_id,
                'recommendation_officer' => $app->recommendation_officer,
                'office_department' => $app->office_department,
                'position' => $app->position,
                'salary' => $app->salary,
                'approval_officer' => $app->approval_officer,
                'leave_type_availed' => $app->leave_type_availed,
                'date_of_filing' => $app->date_of_filing
                    ? Carbon::parse($app->date_of_filing)->toDateString()
                    : null,
                'start_date' => $app->start_date
                    ? Carbon::parse($app->start_date)->toDateString()
                    : null,
                'end_date' => $app->end_date
                    ? Carbon::parse($app->end_date)->toDateString()
                    : null,
                'is_requested' => $app->is_requested,
                'is_with_pay' => $app->is_with_pay,
                'approved_with_pay' => $app->approved_with_pay,
                'approved_without_pay' => $app->approved_without_pay,
                'approved_others' => $app->approved_others,
                'status' => $app->status,
                'for_disapproval_reason' => $app->for_disapproval_reason,
                'disapproved_reason' => $app->disapproved_reason,
                'created_at' => $app->created_at?->toDateTimeString(),
                'updated_at' => $app->updated_at?->toDateTimeString(),
                'deleted_at' => $app->deleted_at?->toDateTimeString(),
                'employee' => $app->employee ? [
                    'employee_id' => $app->employee->employee_id,
                    'employee_name' => $app->employee->basicInfo->full_name
                        ?? $app->employee->basicInfo->first_name,
                ] : null,
                'leave_type' => $app->leaveType ? [
                    'leave_type_id' => $app->leaveType->leave_type_id,
                    'leave_type_name' => $app->leaveType->leave_type_name,
                ] : null,
                'detail' => $app->detail ? [
                    'leave_application_detail_id' => $app->detail->leave_application_detail_id,
                    'leave_location_type' => $app->detail->leave_location_type,
                    'leave_location' => $app->detail->leave_location,
                    'sick_type' => $app->detail->sick_type,
                    'sick_details' => $app->detail->sick_details,
                    'women_illness' => $app->detail->women_illness,
                    'study_purpose' => $app->detail->study_purpose,
                    'other_purpose' => $app->detail->other_purpose,
                    'monetization_vl_days' => $app->detail->monetization_vl_days,
                    'monetization_sl_days' => $app->detail->monetization_sl_days,
                ] : null,
            ]);

        $total_applications = $leave_applications->count();
        $total_pending = $leave_applications->where('status', 'Pending')->count();
        $total_approved = $leave_applications->where('status', 'Approved')->count();
        $total_disapproved = $leave_applications->where('status', 'Disapproved')->count();
        $auth_employee_id = $user->hasRole('employee') ? $user->employee->employee_id : null;
        $hr_admin_employee_ids = $hrAdminEmployeeIds;
        $dto_employee_ids = $dtoEmployeeIds;

        return Inertia::render('Leave/LeaveApplication/LeaveApplicationIndex', compact(
            'leave_applications',
            'employees',
            'leave_entitlements',
            'total_applications',
            'total_pending',
            'total_approved',
            'total_disapproved',
            'auth_employee_id',
            'hr_admin_employee_ids',
            'dto_employee_ids',
        ));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,employee_id'],
            'leave_type_id' => ['nullable', 'exists:leave_types,leave_type_id'],
            'leave_type_availed' => ['required', 'string', 'max:255'],
            'office_department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'salary' => ['nullable', 'numeric'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_requested' => ['required', 'boolean'],
            'is_with_pay' => ['required', 'boolean'],
            'recommendation_officer' => ['nullable', 'exists:employees,employee_id'],
            'approval_officer' => ['nullable', 'exists:employees,employee_id'],
            'status' => ['required', 'in:Pending,For Approval,For Disapproval,Approved,Disapproved'],
            'approved_with_pay' => ['nullable', 'numeric'],
            'approved_without_pay' => ['nullable', 'numeric'],
            'approved_others' => ['nullable', 'string', 'max:255'],
            'for_disapproval_reason' => ['nullable', 'string'],
            'disapproved_reason' => ['nullable', 'string'],
            'leave_location_type' => ['nullable', 'in:ph,abroad'],
            'leave_location' => ['nullable', 'string', 'max:255'],
            'sick_type' => ['nullable', 'in:hospital,outpatient'],
            'sick_details' => ['nullable', 'string', 'max:255'],
            'women_illness' => ['nullable', 'string', 'max:255'],
            'study_purpose' => ['nullable', 'string', 'max:255'],
            'other_purpose' => ['nullable', 'string', 'max:255'],
            'monetization_vl_days' => ['nullable', 'numeric'],
            'monetization_sl_days' => ['nullable', 'numeric'],
        ]);

        Log::info('Validated leave application data', [$validated]);

        $app = LeaveApplication::create([
            'employee_id' => $validated['employee_id'],
            'leave_type_id' => $validated['leave_type_id'] ?? null,
            'recommendation_officer' => $validated['recommendation_officer'] ?? null,
            'approval_officer' => $validated['approval_officer'] ?? null,
            'office_department' => $validated['office_department'] ?? null,
            'position' => $validated['position'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'leave_type_availed' => $validated['leave_type_availed'],
            'date_of_filing' => now(),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_requested' => $validated['is_requested'],
            'is_with_pay' => $validated['is_with_pay'],
            'approved_with_pay' => $validated['approved_with_pay'] ?? null,
            'approved_without_pay' => $validated['approved_without_pay'] ?? null,
            'approved_others' => $validated['approved_others'] ?? null,
            'status' => $validated['status'],
            'for_disapproval_reason' => $validated['for_disapproval_reason'] ?? null,
            'disapproved_reason' => $validated['disapproved_reason'] ?? null,
        ]);

        $app->detail()->create([
            'leave_location_type' => $validated['leave_location_type'] ?? null,
            'leave_location' => $validated['leave_location'] ?? null,
            'sick_type' => $validated['sick_type'] ?? null,
            'sick_details' => $validated['sick_details'] ?? null,
            'women_illness' => $validated['women_illness'] ?? null,
            'study_purpose' => $validated['study_purpose'] ?? null,
            'other_purpose' => $validated['other_purpose'] ?? null,
            'monetization_vl_days' => $validated['monetization_vl_days'] ?? null,
            'monetization_sl_days' => $validated['monetization_sl_days'] ?? null,
        ]);

        Log::info('Leave application created', [$app->leave_application_id]);

        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(LeaveApplication $leaveApplication)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(LeaveApplication $leaveApplication)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $leaveApplication = LeaveApplication::findOrFail($id);

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,employee_id'],
            'leave_type_id' => ['nullable', 'exists:leave_types,leave_type_id'],
            'leave_type_availed' => ['required', 'string', 'max:255'],
            'office_department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'salary' => ['nullable', 'numeric'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_requested' => ['required', 'boolean'],
            'is_with_pay' => ['required', 'boolean'],
            'recommendation_officer' => ['nullable', 'exists:employees,employee_id'],
            'approval_officer' => ['nullable', 'exists:employees,employee_id'],
            'status' => ['required', 'in:Pending,For Approval,For Disapproval,Approved,Disapproved'],
            'approved_with_pay' => ['nullable', 'numeric'],
            'approved_without_pay' => ['nullable', 'numeric'],
            'approved_others' => ['nullable', 'string', 'max:255'],
            'for_disapproval_reason' => ['nullable', 'string'],
            'disapproved_reason' => ['nullable', 'string'],
            'leave_location_type' => ['nullable', 'in:ph,abroad'],
            'leave_location' => ['nullable', 'string', 'max:255'],
            'sick_type' => ['nullable', 'in:hospital,outpatient'],
            'sick_details' => ['nullable', 'string', 'max:255'],
            'women_illness' => ['nullable', 'string', 'max:255'],
            'study_purpose' => ['nullable', 'string', 'max:255'],
            'other_purpose' => ['nullable', 'string', 'max:255'],
            'monetization_vl_days' => ['nullable', 'numeric'],
            'monetization_sl_days' => ['nullable', 'numeric'],
        ]);

        Log::info('Validated leave application update', [$validated]);

        $leaveApplication->update([
            'employee_id' => $validated['employee_id'],
            'leave_type_id' => $validated['leave_type_id'] ?? null,
            'recommendation_officer' => $validated['recommendation_officer'] ?? null,
            'approval_officer' => $validated['approval_officer'] ?? null,
            'office_department' => $validated['office_department'] ?? null,
            'position' => $validated['position'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'leave_type_availed' => $validated['leave_type_availed'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'is_requested' => $validated['is_requested'],
            'is_with_pay' => $validated['is_with_pay'],
            'approved_with_pay' => $validated['approved_with_pay'] ?? null,
            'approved_without_pay' => $validated['approved_without_pay'] ?? null,
            'approved_others' => $validated['approved_others'] ?? null,
            'status' => $validated['status'],
            'for_disapproval_reason' => $validated['for_disapproval_reason'] ?? null,
            'disapproved_reason' => $validated['disapproved_reason'] ?? null,
        ]);

        $detailData = [
            'leave_location_type' => $validated['leave_location_type'] ?? null,
            'leave_location' => $validated['leave_location'] ?? null,
            'sick_type' => $validated['sick_type'] ?? null,
            'sick_details' => $validated['sick_details'] ?? null,
            'women_illness' => $validated['women_illness'] ?? null,
            'study_purpose' => $validated['study_purpose'] ?? null,
            'other_purpose' => $validated['other_purpose'] ?? null,
            'monetization_vl_days' => $validated['monetization_vl_days'] ?? null,
            'monetization_sl_days' => $validated['monetization_sl_days'] ?? null,
        ];

        if ($leaveApplication->detail) {
            $leaveApplication->detail->update($detailData);
        } else {
            $leaveApplication->detail()->create(array_merge($detailData, [
                'leave_application_id' => $leaveApplication->leave_application_id,
            ]));
        }

        Log::info('Leave application updated', [$leaveApplication->leave_application_id]);

        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeaveApplication $leaveApplication)
    {
        //
    }
}
