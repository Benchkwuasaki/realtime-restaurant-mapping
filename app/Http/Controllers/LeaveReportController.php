<?php

namespace App\Http\Controllers;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveApplication;
use Inertia\Inertia;

class LeaveReportController extends Controller
{
    public function index()
    {
        // ── Leave Requests ────────────────────────────────────────────────────
        $requests = LeaveApplication::with([
            'employee.basicInfo',
            'employee.item.position.department',
            'leaveType',
        ])
            ->get()
            ->map(fn ($r) => [
                'id'       => (string) $r->leave_application_id,
                'employee' => $r->employee?->basicInfo
                                ? trim($r->employee->basicInfo->first_name . ' ' . $r->employee->basicInfo->last_name)
                                : 'Unknown',
                'dept'     => $r->employee?->item?->position?->department?->department_name ?? 'Unassigned',
                'type'     => $r->leaveType?->leave_type_name ?? 'Other',
                'status'   => $r->status,
                'start'    => $r->start_date?->toDateString(),
                'end'      => $r->end_date?->toDateString(),
                'days'     => $r->start_date && $r->end_date
                                ? $r->start_date->diffInDays($r->end_date) + 1
                                : 0,
            ])
            ->filter(fn ($r) => $r['start'] && $r['end'])
            ->values()
            ->all();            // plain PHP array — no Collection object passed to Inertia

        // ── Leave Balances ────────────────────────────────────────────────────
        // Each employee gets one entry with their info + an array of per-leave-type
        // rows. The React component uses the `leaves` array to populate the drawer.
        $currentYear = now()->year;

        $balances = EmployeeLeaveBalance::with([
            'employee.basicInfo',
            'employee.item.position.department',
            'leaveType',
        ])
            ->where('cycle_year', $currentYear)
            ->get()
            ->groupBy(fn ($b) => $b->employee_id)
            ->map(function ($rows) {
                $first     = $rows->first();
                $employee  = $first?->employee;
                $basicInfo = $employee?->basicInfo;

                $name = $basicInfo
                    ? trim($basicInfo->first_name . ' ' . $basicInfo->last_name)
                    : 'Unknown';

                $department = $employee?->item?->position?->department?->department_name
                           ?? 'Unassigned';

                // Adapt division / unit to your actual basicInfo column names.
                // Remove whichever fields your EmployeeBasicInfo doesn't have.
                $division = $basicInfo?->division ?? null;
                $unit     = $basicInfo?->unit     ?? null;

                // Position title from the plantilla item chain.
                $position = $employee?->item?->position?->position_title
                         ?? $basicInfo?->position
                         ?? 'N/A';

                $leaves = $rows
                    ->map(fn ($b) => [
                        'leave_type_id'   => $b->leave_type_id,
                        'leave_type_name' => $b->leaveType?->leave_type_name ?? 'Unknown',
                        'is_paid'         => (bool) ($b->leaveType?->is_paid ?? false),
                        'total_days'      => (float) $b->total_days,
                        'used_days'       => (float) $b->used_days,
                        'balance'         => (float) $b->balance,
                    ])
                    ->sortBy('leave_type_name')
                    ->values()
                    ->all();         // plain PHP array — no Collection object passed to Inertia

                return [
                    'employee_id' => $first->employee_id,
                    'name'        => $name,
                    'work_id'     => $employee?->work_id ?? '',
                    'position'    => $position,
                    'department'  => $department,
                    'division'    => $division,
                    'unit'        => $unit,
                    'avatar_url'  => $employee?->avatar_url ?? null,
                    'leaves'      => $leaves,
                ];
            })
            ->sortBy('name')
            ->values()
            ->all();            // plain PHP array — no Collection object passed to Inertia

        return Inertia::render('ReportsAndAnalytics/Leave/Index', [
            'requests' => $requests,
            'balances' => $balances,
        ]);
    }
}