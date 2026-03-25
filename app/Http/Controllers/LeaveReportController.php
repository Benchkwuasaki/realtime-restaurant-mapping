<?php

namespace App\Http\Controllers;

use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveApplication;
use App\Models\LeaveAccrualRecord;
use App\Models\Employee;
use App\Models\LeaveType;
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
            ->all();

        // ── Leave Balances ────────────────────────────────────────────────────
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

                $division = $basicInfo?->division ?? null;
                $unit     = $basicInfo?->unit     ?? null;

                $position = $employee?->item?->position?->position_name
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
                    ->all();

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
            ->all();

        return Inertia::render('ReportsAndAnalytics/Leave/Index', [
            'requests' => $requests,
            'balances' => $balances,
        ]);
    }

    /**
     * Returns the full chronological leave card transaction log for one
     * employee × one leave type, suitable for the CSC Leave Card format.
     *
     * Route: GET /reports/leave/leave-card/{employeeId}/{leaveTypeId}
     * Name:  reports_and_analytics.leave.leave-card
     */
    public function leaveCard(int $employeeId, int $leaveTypeId)
    {
        $employee  = Employee::with(['basicInfo', 'item.position.department'])
                        ->findOrFail($employeeId);
        $leaveType = LeaveType::findOrFail($leaveTypeId);

        $basicInfo = $employee->basicInfo;
        $name      = $basicInfo
            ? trim($basicInfo->first_name . ' ' . $basicInfo->last_name)
            : 'Unknown';

        // ── Accrual rows (credits earned) ─────────────────────────────────────
        $accruals = LeaveAccrualRecord::with('posting')
            ->where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->get()
            ->map(fn ($a) => [
                'date'        => $a->posting?->posting_date?->toDateString(),
                'reference'   => null,
                'particulars' => 'Earned — ' . $a->attendance_days . ' attendance days',
                'earned'      => (float) $a->accrual_earned,
                'used'        => null,
                'balance'     => (float) $a->balance_after,
                'type'        => 'credit',
            ]);

        // ── Application rows (debits used) ────────────────────────────────────
        $applications = LeaveApplication::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->whereIn('status', ['Approved'])
            ->get()
            ->map(fn ($a) => [
                'date'        => $a->start_date?->toDateString(),
                'reference'   => (string) $a->leave_application_id,
                'particulars' => $a->start_date->format('M d') . ' – ' . $a->end_date->format('M d, Y'),
                'earned'      => null,
                'used'        => (float) ($a->start_date->diffInDays($a->end_date) + 1),
                'balance'     => null,  // computed on the frontend from running total
                'type'        => 'debit',
            ]);

        // ── Merge, sort chronologically, recompute running balance ────────────
        // If balance_after is available from accruals we use it; for debit rows
        // we recompute the running balance from the sorted transaction list so
        // the frontend always receives a consistent `balance` column.
        $transactions = $accruals
            ->merge($applications)
            ->sortBy('date')
            ->values();

        // Seed from the first accrual record's balance_before if available.
        $runningBalance = (float) (LeaveAccrualRecord::where('employee_id', $employeeId)
            ->where('leave_type_id', $leaveTypeId)
            ->orderBy('leave_accrual_record_id')
            ->value('balance_before') ?? 0);

        $transactions = $transactions->map(function ($row) use (&$runningBalance) {
            if ($row['type'] === 'credit') {
                $runningBalance = $row['balance'] ?? ($runningBalance + ($row['earned'] ?? 0));
                $row['balance'] = round($runningBalance, 4);
            } else {
                $runningBalance = round($runningBalance - ($row['used'] ?? 0), 4);
                $row['balance'] = $runningBalance;
            }
            return $row;
        })->values()->all();

        return response()->json([
            'employee' => [
                'name'       => $name,
                'work_id'    => $employee->work_id ?? '',
                'position'   => $employee->item?->position?->position_name ?? 'N/A',
                'department' => $employee->item?->position?->department?->department_name ?? 'N/A',
                'division'   => $employee->item?->position?->division?->division_name ?? null,
                'unit'       => $employee->item?->position?->unit?->unit_name ?? null,
            ],
            'leave_type' => [
                'id'          => $leaveType->leave_type_id,
                'name'        => $leaveType->leave_type_name,
                'is_paid'     => (bool) $leaveType->is_paid,
                'is_accrual'  => (bool) $leaveType->is_accrual,
            ],
            'transactions' => $transactions,
            'as_of'        => now()->toDateString(),
        ]);
    }
}