<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\LeaveApplication;
use Inertia\Inertia;
use Inertia\Response;

class LeaveCalendarController extends Controller
{
    public function index(): Response
    {
        $leaves = LeaveApplication::with([
            'employee.basicInfo',
            'employee.item.position.department',
            'leaveType',
        ])
        ->get()
        ->map(fn(LeaveApplication $leave) => [
            'leave_application_id' => $leave->leave_application_id,
            'employee_name'        => $leave->employee->basicInfo->full_name ?? '—',
            'department_name'      => $leave->employee->item?->position?->department?->department_name ?? '—',
            'leave_type_name'      => $leave->leaveType->leave_type_name,
            'start_date'           => $leave->start_date->format('Y-m-d'),
            'end_date'             => $leave->end_date->format('Y-m-d'),
            'days_requested'       => (float) $leave->days_requested,
            'status'               => $leave->status,
        ]);

        return Inertia::render('Leave/LeaveCalendar/Index', [
            'leaves' => $leaves,
        ]);
    }
}