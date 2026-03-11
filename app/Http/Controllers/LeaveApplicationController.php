<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveApplicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $currentYear = now()->year;

        // ── Leave types (used for dropdown + balance lookup) ──────────────────
        $leave_types = LeaveType::orderBy('leave_type_name')
            ->get(['leave_type_id', 'leave_type_name']);

        $vacationTypeId = $leave_types->firstWhere('leave_type_name', 'Vacation Leave')?->leave_type_id;
        $sickTypeId = $leave_types->firstWhere('leave_type_name', 'Sick Leave')?->leave_type_id;

        // ── Employees with all data needed by the form ────────────────────────
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
                'department_name' => $e->item?->position?->department?->department_name ?? '',
                'position_name' => $e->item?->position?->position_name ?? '',
                'monthly_salary' => $e->salaryGradeStep?->monthly_salary
                    ? number_format((float) $e->salaryGradeStep->monthly_salary, 2)
                    : '',
                // Vacation Leave balance for current year
                'vl_total_earned' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $vacationTypeId)?->total_days ?? 0),
                'vl_balance' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $vacationTypeId)?->balance ?? 0),
                // Sick Leave balance for current year
                'sl_total_earned' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $sickTypeId)?->total_days ?? 0),
                'sl_balance' => (string) ($e->leaveBalances->firstWhere('leave_type_id', $sickTypeId)?->balance ?? 0),
            ]);

        // ── Existing leave applications ───────────────────────────────────────
        $leave_applications = LeaveApplication::with(['employee.basicInfo', 'leaveType', 'detail'])
            ->orderByDesc('date_of_filing')
            ->get()
            ->map(fn (LeaveApplication $app) => [
                'leave_application_id' => $app->leave_application_id,
                'employee_id' => $app->employee_id,
                'leave_type_id' => $app->leave_type_id,
                'recommendation_officer' => $app->recommendation_officer,
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
                'approved_for_specifics' => $app->approved_for_specifics,
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
                    'leave_location' => $app->detail->leave_location,
                    'illness_details' => $app->detail->illness_details,
                    'study_leave_purpose' => $app->detail->study_leave_purpose,
                ] : null,
            ]);

        $total_applications = $leave_applications->count();
        $total_pending = $leave_applications->where('status', 'Pending')->count();
        $total_approved = $leave_applications->where('status', 'Approved')->count();
        $total_disapproved = $leave_applications->where('status', 'Disapproved')->count();

        return Inertia::render('Leave/LeaveApplication/LeaveApplicationIndex', compact(
            'leave_applications',
            'employees',
            'leave_types',
            'total_applications',
            'total_pending',
            'total_approved',
            'total_disapproved',
        ));

        //        // Eager-load employee, leaveType, and detail to avoid N+1 queries
        // $leave_applications = LeaveApplication::with(['employee.basicInfo', 'leaveType', 'detail'])
        //     ->orderByDesc('date_of_filing')
        //     ->get()
        //     ->map(fn(LeaveApplication $app) => [

        //         // ── Core fields ──
        //         'leave_application_id'   => $app->leave_application_id,
        //         'employee_id'            => $app->employee_id,
        //         'leave_type_id'          => $app->leave_type_id,
        //         'recommendation_officer' => $app->recommendation_officer,
        //         'approval_officer'       => $app->approval_officer,
        //         'leave_type_availed'     => $app->leave_type_availed,

        //         // ── Dates — cast to plain date strings for the frontend ──
        //         'date_of_filing'         => $app->date_of_filing ? Carbon::parse($app->date_of_filing)->toDateString() : null,
        //         'start_date'             => $app->start_date ? Carbon::parse($app->start_date)->toDateString() : null,
        //         'end_date'               => $app->end_date ? Carbon::parse($app->end_date)->toDateString() : null,

        //         // ── Section 6.D — Commutation ──
        //         'is_requested'           => $app->is_requested,

        //         // ── Section 7.C — Pay status ──
        //         'is_with_pay'            => $app->is_with_pay,
        //         'approved_for_specifics' => $app->approved_for_specifics,

        //         // ── Workflow status ──
        //         'status'                 => $app->status,

        //         // ── Section 7.B / 7.D — Disapproval reasons ──
        //         'for_disapproval_reason' => $app->for_disapproval_reason, // recommending officer's reason
        //         'disapproved_reason'     => $app->disapproved_reason,     // approving officer's final reason

        //         // ── Timestamps ──
        //         'created_at'             => $app->created_at?->toDateTimeString(),
        //         'updated_at'             => $app->updated_at?->toDateTimeString(),
        //         'deleted_at'             => $app->deleted_at?->toDateTimeString(),

        //         // ── Related: employee name for display in the table ──
        //         // employee name lives on the basicInfo relationship
        //         'employee' => $app->employee ? [
        //             'employee_id'   => $app->employee->employee_id,
        //             'employee_name' => $app->employee->basicInfo->full_name ?? $app->employee->basicInfo->first_name,
        //         ] : null,

        //         // ── Related: leave type name for reference ──
        //         'leave_type' => $app->leaveType ? [
        //             'leave_type_id'   => $app->leaveType->leave_type_id,
        //             'leave_type_name' => $app->leaveType->leave_type_name,
        //         ] : null,

        //         // ── Related: section 6.B detail fields ──
        //         'detail' => $app->detail ? [
        //             'leave_application_detail_id' => $app->detail->leave_application_detail_id,
        //             'leave_location'              => $app->detail->leave_location,    // vacation / special privilege
        //             'illness_details'             => $app->detail->illness_details,   // sick / women's leave
        //             'study_leave_purpose'         => $app->detail->study_leave_purpose, // study leave
        //         ] : null,
        //     ]);

        // // Populate the employee dropdown in the modal.
        // // last_name lives on employee_basic_info, so we join to sort properly.
        // $employees = Employee::with('basicInfo')
        //     ->join('employee_basic_info', 'employees.employee_basic_info_id', '=', 'employee_basic_info.employee_basic_info_id')
        //     ->orderBy('employee_basic_info.last_name')
        //     ->select('employees.*')
        //     ->get()
        //     ->map(fn($e) => [
        //         'employee_id'   => $e->employee_id,
        //         'employee_name' => $e->basicInfo->full_name ?? $e->basicInfo->first_name,
        //     ]);

        // // Populate the leave type dropdown in the modal
        // $leave_types = LeaveType::orderBy('leave_type_name')
        //     ->get(['leave_type_id', 'leave_type_name']);

        // // Stat counts for the stat cards on the index page
        // $total_applications = $leave_applications->count();
        // $total_pending      = $leave_applications->where('status', 'Pending')->count();
        // $total_approved     = $leave_applications->where('status', 'Approved')->count();
        // $total_disapproved  = $leave_applications->where('status', 'Disapproved')->count();

        // return Inertia::render('Leave/LeaveApplication/LeaveApplicationIndex', compact(
        //     'leave_applications',
        //     'employees',
        //     'leave_types',
        //     'total_applications',
        //     'total_pending',
        //     'total_approved',
        //     'total_disapproved',
        // ));
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
        //
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
    public function update(Request $request, LeaveApplication $leaveApplication)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(LeaveApplication $leaveApplication)
    {
        //
    }
}
