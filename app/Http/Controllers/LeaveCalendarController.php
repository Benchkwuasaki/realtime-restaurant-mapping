<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\WorkingDaysCalculator;
use App\Models\LeaveApplication;
use Inertia\Inertia;
use Inertia\Response;

class LeaveCalendarController extends Controller
{
    public function index(): Response
    {
        $calculator = new WorkingDaysCalculator(now()->year);

        $leaves = LeaveApplication::with([
            'employee.basicInfo',
            'employee.item.position.department',
            'leaveType',
        ])
            ->get()
            ->map(fn(LeaveApplication $leave) => [
                'leave_application_id' => $leave->leave_application_id,
                'employee_name' => $leave->employee->basicInfo->full_name ?? '—',
                'department_name' => $leave->employee->item?->position?->department?->department_name ?? '—',
                'leave_type_name' => $leave->leaveType->leave_type_name,
                'start_date' => $leave->start_date->format('Y-m-d'),
                'end_date' => $leave->end_date->format('Y-m-d'),
                'days_requested' => $calculator->calculate($leave->start_date, $leave->end_date),
                'status' => match ($leave->status) {
                    'Approved' => 'approved', 
                    'For Approval' => 'for_approval',
                    'Pending' => 'pending',
                    'For Disapproval' => 'for_disapproval',
                    'Disapproved' => 'rejected',
                    'Cancelled' => 'cancelled',
                },
            ]);

        return Inertia::render('Leave/LeaveCalendar/Index', [
            'leaves' => $leaves,
        ]);
    }
}