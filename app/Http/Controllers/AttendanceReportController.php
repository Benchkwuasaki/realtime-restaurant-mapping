<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceReportController extends Controller
{
    // ── Leave statuses (used in multiple places) ──────────────────────────────
    private const LEAVE_STATUSES   = ['ON_LEAVE_WP', 'ON_LEAVE_NP'];
    private const PRESENT_STATUSES = ['PRESENT', 'HALF_DAY'];
    private const ALL_ACTIVE_STATUSES = ['PRESENT', 'HALF_DAY', 'ON_LEAVE_WP', 'ON_LEAVE_NP'];

    public function index(Request $request)
    {
        $department = $request->get('department');
        $dateFrom   = $request->get('date_from', Carbon::today()->subMonth()->toDateString());
        $dateTo     = $request->get('date_to', Carbon::today()->toDateString());
        $today      = Carbon::today()->toDateString();

        // ── Employee IDs scoped to department ────────────────────────────────
        $employeeIds = Employee::query()
            ->where('status', true)
            ->when($department && $department !== 'All Departments', function ($q) use ($department) {
                $q->whereHas('item.position.department', fn($d) => $d->where('department_name', $department));
            })
            ->pluck('employee_id');

        $totalEmployees = $employeeIds->count();
        $divisor        = $totalEmployees ?: 1;

        // ── Department list for filter dropdown ───────────────────────────────
        $departments = DB::table('departments')->orderBy('department_name')->pluck('department_name');

        // ── Today's Summary ───────────────────────────────────────────────────
        $todayQ = AttendanceRecord::whereIn('employee_id', $employeeIds)->whereDate('date', $today);

        $presentToday  = (clone $todayQ)->where('status', 'PRESENT')->count();
        $halfDayToday  = (clone $todayQ)->where('status', 'HALF_DAY')->count();
        $absentToday   = (clone $todayQ)->where('status', 'ABSENT')->count();
        $onLeaveWpToday = (clone $todayQ)->where('status', 'ON_LEAVE_WP')->count();
        $onLeaveNpToday = (clone $todayQ)->where('status', 'ON_LEAVE_NP')->count();
        $onLeaveToday  = $onLeaveWpToday + $onLeaveNpToday;

        // Late = PRESENT with late_minutes > 0
        $lateToday = (clone $todayQ)
            ->where('status', 'PRESENT')
            ->where('late_minutes', '>', 0)
            ->count();

        // Attendance rate counts PRESENT + HALF_DAY (leave is excused, not counted as present)
        $attendanceRate = round((($presentToday + $halfDayToday) / $divisor) * 100, 1);

        // Yesterday delta
        $yQ      = AttendanceRecord::whereIn('employee_id', $employeeIds)->whereDate('date', Carbon::yesterday());
        $yActive = (clone $yQ)->whereIn('status', self::PRESENT_STATUSES)->count();
        $yRate   = round(($yActive / $divisor) * 100, 1);
        $delta   = round($attendanceRate - $yRate, 1);
        $direction = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'same');

        // ── Daily Breakdown ───────────────────────────────────────────────────
        $dailyBreakdown = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->selectRaw("
                DATE_FORMAT(date, '%a %d')            as day,
                date                                   as date,
                SUM(status = 'PRESENT')                as present,
                SUM(status = 'PRESENT' AND late_minutes > 0) as late,
                SUM(status = 'HALF_DAY')               as half_day,
                SUM(status = 'ABSENT')                 as absent,
                SUM(status = 'ON_LEAVE_WP')            as on_leave_wp,
                SUM(status = 'ON_LEAVE_NP')            as on_leave_np
            ")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // ── Weekly Breakdown ──────────────────────────────────────────────────
        $weeklyBreakdown = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->where('date', '>=', Carbon::now()->subWeeks(7)->startOfWeek())
            ->selectRaw("
                YEARWEEK(date, 1)                                                              as yw,
                MIN(DATE_FORMAT(date, '%b %d'))                                                as week,
                SUM(status = 'PRESENT')                                                        as present,
                SUM(status = 'ABSENT')                                                         as absent,
                SUM(status IN ('ON_LEAVE_WP','ON_LEAVE_NP'))                                  as on_leave,
                SUM(status = 'PRESENT' AND late_minutes > 0)                                   as late,
                ROUND(SUM(status IN ('PRESENT','HALF_DAY')) / {$divisor} * 100, 1)            as rate
            ")
            ->groupBy('yw')
            ->orderBy('yw')
            ->get();

        // ── Monthly Trend (12 months) ─────────────────────────────────────────
        $monthlyRaw = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->where('date', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->selectRaw("
                DATE_FORMAT(date, '%b %Y')                                              as month,
                YEAR(date)                                                               as yr,
                MONTH(date)                                                              as mo,
                ROUND(SUM(status IN ('PRESENT','HALF_DAY')) / {$divisor} * 100, 1)    as rate,
                SUM(status IN ('ON_LEAVE_WP','ON_LEAVE_NP'))                           as on_leave
            ")
            ->groupByRaw("yr, mo, DATE_FORMAT(date, '%b %Y')")
            ->orderByRaw("yr, mo")
            ->get();

        $monthly = $monthlyRaw->values()->map(function ($row, $i) use ($monthlyRaw) {
            $slice = $monthlyRaw->slice(max(0, $i - 2), 3);
            return [
                'month'    => $row->month,
                'rate'     => (float) $row->rate,
                'trend'    => round($slice->avg('rate'), 1),
                'on_leave' => (int) $row->on_leave,
            ];
        });

        // ── Department Breakdown ──────────────────────────────────────────────
        $deptBreakdown = DB::table('employees')
            ->join('items',       'employees.item_id',       '=', 'items.item_id')
            ->join('positions',   'items.position_id',       '=', 'positions.position_id')
            ->join('departments', 'positions.department_id', '=', 'departments.department_id')
            ->leftJoin('attendance_records', function ($join) use ($today) {
                $join->on('attendance_records.employee_id', '=', 'employees.employee_id')
                    ->whereDate('attendance_records.date', $today);
            })
            ->where('employees.status', true)
            ->when(
                $department && $department !== 'All Departments',
                fn($q) => $q->where('departments.department_name', $department)
            )
            ->selectRaw("
                departments.department_name                                               as department,
                COUNT(DISTINCT employees.employee_id)                                     as total,
                SUM(attendance_records.status = 'PRESENT')                                as present,
                SUM(attendance_records.status = 'PRESENT'
                    AND attendance_records.late_minutes > 0)                              as late,
                SUM(attendance_records.status = 'HALF_DAY')                               as half_day,
                SUM(attendance_records.status = 'ABSENT')                                 as absent,
                SUM(attendance_records.status = 'ON_LEAVE_WP')                           as on_leave_wp,
                SUM(attendance_records.status = 'ON_LEAVE_NP')                           as on_leave_np,
                ROUND(
                    SUM(attendance_records.status IN ('PRESENT','HALF_DAY'))
                    / NULLIF(COUNT(DISTINCT employees.employee_id), 0) * 100
                , 1)                                                                      as rate
            ")
            ->groupBy('departments.department_id', 'departments.department_name')
            ->orderBy('departments.department_name')
            ->get()
            ->map(fn($r) => [
                'department'   => $r->department,
                'total'        => (int)   $r->total,
                'present'      => (int)  ($r->present      ?? 0),
                'late'         => (int)  ($r->late         ?? 0),
                'half_day'     => (int)  ($r->half_day     ?? 0),
                'absent'       => (int)  ($r->absent       ?? 0),
                'on_leave_wp'  => (int)  ($r->on_leave_wp  ?? 0),
                'on_leave_np'  => (int)  ($r->on_leave_np  ?? 0),
                'on_leave'     => (int) (($r->on_leave_wp  ?? 0) + ($r->on_leave_np ?? 0)),
                'rate'         => (float)($r->rate         ?? 0),
                'rate_category' => ($r->rate ?? 0) >= 90 ? 'good' : (($r->rate ?? 0) >= 80 ? 'average' : 'poor'),
            ]);

        // ── Department Employees (for row-click drawer) ───────────────────────
        $deptEmployeesRaw  = $this->fetchDeptEmployeesRaw($department, $dateFrom, $dateTo);
        $departmentEmployees = $this->groupDeptEmployees($deptEmployeesRaw);

        // ── Export JSON for print window ──────────────────────────────────────
        if ($request->get('export') === 'print') {
            $printDateFrom = $request->get('date_from', Carbon::today()->subMonth()->toDateString());
            $printDateTo   = $request->get('date_to', Carbon::today()->toDateString());
            $printDept     = $request->get('department');

            $rawRows = $this->fetchDeptEmployeesRaw($printDept, $printDateFrom, $printDateTo);
            $grouped = $this->groupDeptEmployees($rawRows);

            return response()->json([
                'department_employees' => $grouped,
                'filters' => [
                    'date_from'  => $printDateFrom,
                    'date_to'    => $printDateTo,
                    'department' => $printDept ?? 'All Departments',
                ],
            ]);
        }

        return Inertia::render('ReportsAndAnalytics/Attendance/Index', [
            'summary' => [
                'total_employees'       => $totalEmployees,
                'present_today'         => $presentToday,
                'late_today'            => $lateToday,
                'absent_today'          => $absentToday,
                'half_day_today'        => $halfDayToday,
                'on_leave_today'        => $onLeaveToday,
                'on_leave_wp_today'     => $onLeaveWpToday,
                'on_leave_np_today'     => $onLeaveNpToday,
                'attendance_rate'       => $attendanceRate,
                'rate_delta'            => abs($delta),
                'rate_delta_direction'  => $direction,
            ],
            'daily_breakdown'       => $dailyBreakdown,
            'weekly_breakdown'      => $weeklyBreakdown,
            'monthly_trend'         => $monthly,
            'department_breakdown'  => $deptBreakdown,
            'department_employees'  => $departmentEmployees,
            'departments'           => $departments,
            'filters' => [
                'department' => $department ?? 'All Departments',
                'date_from'  => $dateFrom,
                'date_to'    => $dateTo,
            ],
        ]);
    }

    // ── Shared query helpers ──────────────────────────────────────────────────

    private function fetchDeptEmployeesRaw(?string $department, string $dateFrom, string $dateTo)
    {
        return DB::table('employees')
            ->join('items',               'employees.item_id',               '=', 'items.item_id')
            ->join('positions',           'items.position_id',               '=', 'positions.position_id')
            ->join('departments',         'positions.department_id',         '=', 'departments.department_id')
            ->join('employee_basic_info', 'employees.employee_basic_info_id','=', 'employee_basic_info.employee_basic_info_id')
            ->leftJoin('attendance_records', function ($join) use ($dateFrom, $dateTo) {
                $join->on('attendance_records.employee_id', '=', 'employees.employee_id')
                    ->whereBetween('attendance_records.date', [$dateFrom, $dateTo]);
            })
            ->where('employees.status', true)
            ->when(
                $department && $department !== 'All Departments',
                fn($q) => $q->where('departments.department_name', $department)
            )
            ->select([
                'departments.department_name as department',
                'employees.employee_id',
                DB::raw("TRIM(CONCAT(
                    employee_basic_info.first_name, ' ',
                    CASE WHEN employee_basic_info.middle_name IS NOT NULL AND employee_basic_info.middle_name != ''
                         THEN CONCAT(employee_basic_info.middle_name, ' ')
                         ELSE ''
                    END,
                    employee_basic_info.last_name
                )) as name"),
                'employees.avatar_url',
                'positions.position_name as position',
                'attendance_records.date',
                'attendance_records.status',
                'attendance_records.time_in',
                'attendance_records.time_out',
                'attendance_records.late_minutes',
            ])
            ->orderBy('departments.department_name')
            ->orderBy('employee_basic_info.last_name')
            ->orderBy('employee_basic_info.first_name')
            ->orderBy('attendance_records.date')
            ->get();
    }

    private function groupDeptEmployees($rawRows): array
    {
        return $rawRows
            ->groupBy('department')
            ->map(
                fn($deptRows) => $deptRows
                    ->groupBy('employee_id')
                    ->map(fn($empRows) => [
                        'employee_id' => $empRows->first()->employee_id,
                        'name'        => $empRows->first()->name,
                        'avatar_url'  => $empRows->first()->avatar_url,
                        'position'    => $empRows->first()->position,
                        'records'     => $empRows
                            ->filter(fn($r) => $r->date !== null)
                            ->map(fn($r) => [
                                'date'         => Carbon::parse($r->date)->toDateString(),
                                'status'       => $r->status,
                                'time_in'      => $r->time_in  ? Carbon::parse($r->time_in)->format('H:i:s')  : null,
                                'time_out'     => $r->time_out ? Carbon::parse($r->time_out)->format('H:i:s') : null,
                                'late_minutes' => $r->late_minutes !== null ? (int) $r->late_minutes : null,
                            ])
                            ->values(),
                    ])
                    ->values()
            )
            ->toArray();
    }
}