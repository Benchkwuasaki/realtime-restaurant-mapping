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
        // Mirrors EmployeeController::index() — use Eloquent with() instead of
        // raw joins so the relationship chain is guaranteed to resolve correctly.
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
            ->values();

        // ── Leave Balances ─────────────────────────────────────────────────────
        // Group by employee so each row = one person with summed totals across
        // all leave types for the current cycle year.
        $currentYear = now()->year;

        $balances = EmployeeLeaveBalance::with([
            'employee.basicInfo',
            'employee.item.position.department',
        ])
            ->where('cycle_year', $currentYear)
            ->get()
            ->groupBy(fn ($b) => $b->employee_id)
            ->map(fn ($rows) => [
                'name'      => ($bi = $rows->first()?->employee?->basicInfo)
                                ? trim($bi->first_name . ' ' . $bi->last_name)
                                : 'Unknown',
                'dept'      => $rows->first()?->employee?->item?->position?->department?->department_name ?? 'Unassigned',
                'total'     => (float) $rows->sum('total_days'),
                'used'      => (float) $rows->sum('used_days'),
                'remaining' => (float) $rows->sum('balance'),
            ])
            ->sortBy('name')
            ->values();

        return Inertia::render('ReportsAndAnalytics/Leave/Index', [
            'requests' => $requests,
            'balances' => $balances,
        ]);
    }
}