<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmploymentClassification;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use App\Models\AttendanceRecord;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index()
    {
        $this->activityLogService->createLog([
            'user_id'  => Auth::id(),
            'module'   => 'general',
            'activity' => 'Viewed dashboard',
        ]);

        // ── Workforce ─────────────────────────────────────────────────────────

        $classifications = EmploymentClassification::orderBy('name')->pluck('name');

        $countsByClassification = Employee::query()
            ->whereNull('deleted_at')
            ->where('status', true)
            ->selectRaw('employment_classification, COUNT(*) as total')
            ->groupBy('employment_classification')
            ->pluck('total', 'employment_classification');

        $employeeClassificationCounts = $classifications->map(fn(string $name) => [
            'classification' => $name,
            'total'          => $countsByClassification->get($name, 0),
        ])->values();

        // ── Leave ─────────────────────────────────────────────────────────────

        $today = now()->toDateString();

        $onLeaveCount = LeaveApplication::query()
            ->where('status', 'Approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->whereNull('deleted_at')
            ->count();

        $pendingLeaveCount = LeaveApplication::query()
            ->where('status', 'Pending')
            ->whereNull('deleted_at')
            ->count();

        $urgentLeaveApplicationCount = LeaveApplication::query()
            ->where('status', 'Pending')
            ->whereRaw('DATEDIFF(?, date_of_filing) > 3', [$today])
            ->whereNull('deleted_at')
            ->count();

        $approvedTodayCount = LeaveApplication::query()
            ->where('status', 'Approved')
            ->whereDate('updated_at', $today)
            ->whereNull('deleted_at')
            ->count();

        $approvedApplications = LeaveApplication::query()
            ->where('status', 'Approved')
            ->whereNull('deleted_at')
            ->selectRaw('SUM(DATEDIFF(updated_at, date_of_filing)) as total_days, COUNT(*) as total_count')
            ->first();

        $avgWaitDays = ($approvedApplications->total_count > 0)
            ? round($approvedApplications->total_days / $approvedApplications->total_count, 1)
            : 0;

        // ── Monthly leave trend ───────────────────────────────────────────────

        $currentYear = now()->year;
        $monthLabels = ['J', 'F', 'M', 'A', 'My', 'Jn', 'Jl', 'Au', 'S', 'O', 'N', 'D'];

        $monthlyCounts = LeaveApplication::query()
            ->where('status', 'Approved')
            ->whereNull('deleted_at')
            ->whereYear('start_date', $currentYear)
            ->selectRaw('MONTH(start_date) as month, COUNT(*) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $leaveTrend = array_values(collect(range(1, 12))->map(fn($m) => [
            'm' => $monthLabels[$m - 1],
            'v' => (int) $monthlyCounts->get($m, 0),
        ])->toArray());

        // ── Leave type chart ──────────────────────────────────────────────────

        $chartColors = ['#818cf8', '#fb7185', '#22d3ee', '#f472b6', '#fb923c', '#34d399', '#fbbf24', '#a78bfa'];

        $activeLeaveTypes = LeaveType::where('status', true)
            ->orderBy('leave_type_name')
            ->pluck('leave_type_name');

        $leaveTypeColorMap = $activeLeaveTypes
            ->values()
            ->mapWithKeys(fn(string $name, int $i) => [
                $name => $chartColors[$i % count($chartColors)],
            ]);

        $leaveTypeCounts = array_values(LeaveApplication::query()
            ->whereNull('leave_applications.deleted_at')
            ->join('leave_types', 'leave_applications.leave_type_id', '=', 'leave_types.leave_type_id')
            ->where('leave_types.status', true)
            ->selectRaw('leave_types.leave_type_name as label, COUNT(*) as value')
            ->groupBy('leave_types.leave_type_name')
            ->orderByDesc('value')
            ->get()
            ->map(fn($row, $i) => [
                'label' => $row->label,
                'value' => (int) $row->value,
                'fill'  => $leaveTypeColorMap->get($row->label, $chartColors[$i % count($chartColors)]),
            ])
            ->toArray());

        // ── Top leave takers ──────────────────────────────────────────────────

        $topLeaveTakers = array_values(LeaveApplication::query()
            ->whereNull('leave_applications.deleted_at')
            ->where('leave_applications.status', 'Approved')
            ->join('employees', 'leave_applications.employee_id', '=', 'employees.employee_id')
            ->join('employee_basic_info', 'employees.employee_basic_info_id', '=', 'employee_basic_info.employee_basic_info_id')
            ->join('leave_types', 'leave_applications.leave_type_id', '=', 'leave_types.leave_type_id')
            ->where('leave_types.status', true)
            ->selectRaw('
                employee_basic_info.last_name,
                employee_basic_info.first_name,
                leave_types.leave_type_name as type,
                SUM(DATEDIFF(leave_applications.end_date, leave_applications.start_date) + 1) as days
            ')
            ->groupBy(
                'leave_applications.employee_id',
                'employee_basic_info.last_name',
                'employee_basic_info.first_name',
                'leave_types.leave_type_name'
            )
            ->orderByDesc('days')
            ->limit(5)
            ->get()
            ->map(fn($row, $i) => [
                'name'  => $row->first_name . ' ' . $row->last_name,
                'days'  => (int) $row->days,
                'type'  => $row->type,
                'color' => $leaveTypeColorMap->get($row->type, $chartColors[$i % count($chartColors)]),
            ])
            ->toArray());

        // ── Attendance ────────────────────────────────────────────────────────

        $onTimeToday = AttendanceRecord::whereDate('date', $today)
            ->where('status', 'PRESENT')
            ->where(fn($q) => $q->whereNull('late_minutes')->orWhere('late_minutes', 0))
            ->count();

        $lateToday = AttendanceRecord::whereDate('date', $today)
            ->where('status', 'PRESENT')
            ->where('late_minutes', '>', 0)
            ->count();

        $presentToday = $onTimeToday + $lateToday;

        $topLateToday = AttendanceRecord::with([
                'employee:employee_id,employee_basic_info_id',
                'employee.basicInfo:employee_basic_info_id,first_name,last_name',
                'employee.item.position.department:department_id,department_name',
            ])
            ->whereDate('date', $today)
            ->where('status', 'PRESENT')
            ->where('late_minutes', '>', 0)
            ->orderByDesc('late_minutes')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'name' => trim(($r->employee?->basicInfo?->first_name ?? '') . ' ' . ($r->employee?->basicInfo?->last_name ?? '')),
                'dept' => $r->employee?->item?->position?->department?->department_name ?? '—',
                'min'  => (int) $r->late_minutes,
            ]);

        // ── Render ────────────────────────────────────────────────────────────

        return Inertia::render('dashboard', [
            'employeeClassificationCounts' => $employeeClassificationCounts,
            'onLeaveCount'                 => $onLeaveCount,
            'pendingLeaveCount'            => $pendingLeaveCount,
            'urgentLeaveApplicationCount'  => $urgentLeaveApplicationCount,
            'approvedTodayCount'           => $approvedTodayCount,
            'avgWaitDays'                  => $avgWaitDays,
            'leaveTypeCounts'              => $leaveTypeCounts,
            'topLeaveTakers'               => $topLeaveTakers,
            'leaveTrend'                   => $leaveTrend,
            'presentToday'                 => $presentToday,
            'onTimeToday'                  => $onTimeToday,
            'lateToday'                    => $lateToday,
            'topLateToday'                 => $topLateToday,
        ]);
    }
}