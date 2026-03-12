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


    public function index(Request $request)
    {
        $department = $request->get('department');
        $dateFrom = $request->get('date_from', Carbon::today()->subMonth()->toDateString());
        $dateTo = $request->get('date_to', Carbon::today()->toDateString());
        $today = Carbon::today()->toDateString();

        // ── Employee IDs scoped to department ────────────────────────────────

        $employeeIds = Employee::query()
            ->where('status', true)
            ->when($department && $department !== 'All Departments', function ($q) use ($department) {
                $q->whereHas('item.position.department', fn($d) => $d->where('department_name', $department));
            })
            ->pluck('employee_id');

        $totalEmployees = $employeeIds->count();
        $divisor = $totalEmployees ?: 1;

        // ── Department list for filter dropdown ───────────────────────────────

        $departments = DB::table('departments')->orderBy('department_name')->pluck('department_name');

        // ── Today's Summary ───────────────────────────────────────────────────

        $todayQ = AttendanceRecord::whereIn('employee_id', $employeeIds)->whereDate('date', $today);

        $presentToday = (clone $todayQ)->where('status', 'PRESENT')->count();
        $lateToday = (clone $todayQ)->where('status', 'LATE')->count();
        $absentToday = (clone $todayQ)->where('status', 'ABSENT')->count();
        $halfDayToday = (clone $todayQ)->where('status', 'HALF_DAY')->count();

        $attendanceRate = round((($presentToday + $lateToday + $halfDayToday) / $divisor) * 100, 1);

        // Yesterday delta
        $yQ = AttendanceRecord::whereIn('employee_id', $employeeIds)->whereDate('date', Carbon::yesterday());
        $yPresent = (clone $yQ)->whereIn('status', ['PRESENT', 'LATE', 'HALF_DAY'])->count();
        $yRate = round(($yPresent / $divisor) * 100, 1);
        $delta = round($attendanceRate - $yRate, 1);
        $direction = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'same');

        // ── Daily Breakdown ───────────────────────────────────────────────────

        $dailyBreakdown = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->selectRaw("DATE_FORMAT(date, '%a %d') as day,
                SUM(status = 'PRESENT')  as present,
                SUM(status = 'LATE')     as late,
                SUM(status = 'HALF_DAY') as half_day,
                SUM(status = 'ABSENT')   as absent")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // ── Weekly Breakdown ──────────────────────────────────────────────────

        $weeklyBreakdown = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->where('date', '>=', Carbon::now()->subWeeks(7)->startOfWeek())
            ->selectRaw("YEARWEEK(date, 1) as yw,
                MIN(DATE_FORMAT(date, '%b %d')) as week,
                SUM(status = 'PRESENT')  as present,
                SUM(status = 'ABSENT')   as absent,
                ROUND(SUM(status IN ('PRESENT','LATE','HALF_DAY')) / {$divisor} * 100, 1) as rate")
            ->groupBy('yw')
            ->orderBy('yw')
            ->get();

        // ── Monthly Trend (12 months) ─────────────────────────────────────────

        $monthlyRaw = AttendanceRecord::whereIn('employee_id', $employeeIds)
            ->where('date', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->selectRaw("DATE_FORMAT(date, '%b %Y') as month,
                YEAR(date) as yr, MONTH(date) as mo,
                ROUND(SUM(status IN ('PRESENT','LATE','HALF_DAY')) / {$divisor} * 100, 1) as rate")
            ->groupByRaw("yr, mo, DATE_FORMAT(date, '%b %Y')")
            ->orderByRaw("yr, mo")
            ->get();

        $monthly = $monthlyRaw->values()->map(function ($row, $i) use ($monthlyRaw) {
            $slice = $monthlyRaw->slice(max(0, $i - 2), 3);
            return [
                'month' => $row->month,
                'rate' => (float) $row->rate,
                'trend' => round($slice->avg('rate'), 1),
            ];
        });

        // ── Department Breakdown ──────────────────────────────────────────────

        $deptBreakdown = DB::table('employees')
            ->join('items', 'employees.item_id', '=', 'items.item_id')
            ->join('positions', 'items.position_id', '=', 'positions.position_id')
            ->join('departments', 'positions.department_id', '=', 'departments.department_id')
            ->leftJoin('attendance_records', function ($join) use ($today) {
                $join->on('attendance_records.employee_id', '=', 'employees.employee_id')
                    ->whereDate('attendance_records.date', $today);
            })
            ->where('employees.status', true)
            ->when(
                $department && $department !== 'All Departments',
                fn($q) =>
                $q->where('departments.department_name', $department)
            )
            ->selectRaw("
        departments.department_name                                              as department,
        COUNT(DISTINCT employees.employee_id)                                    as total,
        SUM(attendance_records.status = 'PRESENT')                               as present,
        SUM(attendance_records.status = 'LATE')                                  as late,
        SUM(attendance_records.status = 'HALF_DAY')                              as half_day,
        SUM(attendance_records.status = 'ABSENT')                                as absent,
        ROUND(
            SUM(attendance_records.status IN ('PRESENT','LATE','HALF_DAY'))
            / NULLIF(COUNT(DISTINCT employees.employee_id), 0) * 100
        , 1)                                                                     as rate
    ")
            ->groupBy('departments.department_id', 'departments.department_name')
            ->orderBy('departments.department_name')
            ->get()
            ->map(fn($r) => [
                'department' => $r->department,
                'total' => (int) $r->total,
                'present' => (int) ($r->present ?? 0),
                'late' => (int) ($r->late ?? 0),
                'half_day' => (int) ($r->half_day ?? 0),
                'absent' => (int) ($r->absent ?? 0),
                'rate' => (float) ($r->rate ?? 0),
                'rate_category' => ($r->rate ?? 0) >= 90 ? 'good' : (($r->rate ?? 0) >= 80 ? 'average' : 'poor'),
            ]);


        // Export CSV
        if ($request->get('export') === 'csv') {
            $filename = 'attendance-report-' . now()->format('Y-m-d') . '.csv';
            $headers = ['Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=$filename"];

            $callback = function () use ($deptBreakdown, $dailyBreakdown) {
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Department', 'Total', 'Present', 'Late', 'Half Day', 'Absent', 'Rate %']);
                foreach ($deptBreakdown as $row) {
                    fputcsv($out, [$row['department'], $row['total'], $row['present'], $row['late'], $row['half_day'], $row['absent'], $row['rate']]);
                }
                fclose($out);
            };

            return response()->stream($callback, 200, $headers);
        }
        return Inertia::render(
            'ReportsAndAnalytics/Attendance/Index',
            [
                'summary' => [
                    'total_employees' => $totalEmployees,
                    'present_today' => $presentToday,
                    'late_today' => $lateToday,
                    'absent_today' => $absentToday,
                    'half_day_today' => $halfDayToday,
                    'attendance_rate' => $attendanceRate,
                    'rate_delta' => abs($delta),
                    'rate_delta_direction' => $direction,
                ],
                'daily_breakdown' => $dailyBreakdown,
                'weekly_breakdown' => $weeklyBreakdown,
                'monthly_trend' => $monthly,
                'department_breakdown' => $deptBreakdown,
                'departments' => $departments,
                'filters' => [
                    'department' => $department ?? 'All Departments',
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ]
        );
    }
}