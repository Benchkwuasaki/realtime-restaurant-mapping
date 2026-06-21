<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayrollReportController extends Controller
{
    public function index(Request $request)
    {
        // ── 1. Date range (default: current month) ────────────────────────────
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to',   Carbon::now()->endOfMonth()->toDateString());

        // ── 2. Payroll Records ────────────────────────────────────────────────
        // Chain: payroll_records → employees → basicInfo (name)
        //                                    → item → position → department
        //                        → payrollPeriod (period label)
        $records = PayrollRecord::with([
                'employee.basicInfo',
                'employee.item.position.department',
                'payrollPeriod',
            ])
            ->whereHas('payrollPeriod', function ($q) use ($dateFrom, $dateTo) {
                $q->where(function ($q2) use ($dateFrom, $dateTo) {
                    $q2->whereBetween('start_date', [$dateFrom, $dateTo])
                       ->orWhereBetween('end_date',  [$dateFrom, $dateTo]);
                });
            })
            ->get()
            ->map(function (PayrollRecord $r) {
                $emp    = $r->employee;
                $info   = $emp?->basicInfo;
                $dept   = $emp?->item?->position?->department;
                $period = $r->payrollPeriod;

                $fullName = $info
                    ? trim("{$info->first_name} {$info->last_name}")
                    : 'Unknown';

                $periodLabel = $period
                    ? Carbon::parse($period->start_date)->format('F Y')
                    : '—';

                $grossPay = (float) $r->basic_pay
                    + (float) $r->pera
                    + (float) $r->rice_allowance
                    + (float) $r->uniform_allowance
                    + (float) ($r->overtime_pay ?? 0);

                $allowanceTotal = (float) $r->pera
                    + (float) $r->rice_allowance
                    + (float) $r->uniform_allowance;

                $statusMap = [
                    'draft'  => 'Draft',
                    'posted' => 'Posted',
                    'locked' => 'Locked',
                ];

                return [
                    'id'              => $emp?->work_id ?? "REC-{$r->payroll_record_id}",
                    'name'            => $fullName,
                    'department'      => $dept?->department_name ?? '—',
                    'type'            => $emp?->employment_classification ?? '—',
                    'status'          => $statusMap[$r->status] ?? ucfirst($r->status),
                    'basicPay'        => (float) $r->basic_pay,
                    'allowance'       => $allowanceTotal,
                    'grossPay'        => $grossPay,
                    'gsis'            => (float) $r->gsis_premium,
                    'philhealth'      => (float) $r->philhealth,
                    'pagibig'         => (float) $r->pag_ibig,
                    'withholding'     => (float) $r->withholding_tax,
                    'otherDeductions' => (float) $r->other_deductions_total,
                    'netPay'          => (float) $r->net_pay,
                    'period'          => $periodLabel,
                ];
            });

        // ── 3. KPI Totals ─────────────────────────────────────────────────────
        $totalGross      = $records->sum('grossPay');
        $totalDeductions = $records->sum(fn ($r) =>
            $r['gsis'] + $r['philhealth'] + $r['pagibig'] + $r['withholding'] + $r['otherDeductions']
        );
        $totalNet      = $records->sum('netPay');
        $employeeCount = $records->count();

        // ── 4. Next Payroll Date ──────────────────────────────────────────────
        $nextPeriod = PayrollPeriod::where('status', 'Open')
            ->where('start_date', '>', Carbon::today())
            ->orderBy('start_date')
            ->first();

        $nextPayrollDate     = $nextPeriod
            ? Carbon::parse($nextPeriod->start_date)->format('M d')
            : '—';
        $nextPayrollDateFull = $nextPeriod
            ? Carbon::parse($nextPeriod->start_date)->format('F d, Y')
            : '—';

        // ── 5. Monthly Payroll Trend (last 12 months) ─────────────────────────
        $monthlyTrend = DB::table('payroll_records as pr')
            ->join('payroll_periods as pp', 'pr.payroll_period_id', '=', 'pp.payroll_period_id')
            ->select(
                DB::raw("DATE_FORMAT(pp.start_date, '%b') as month"),
                DB::raw("DATE_FORMAT(pp.start_date, '%Y-%m') as month_key"),
                DB::raw('SUM(pr.basic_pay + pr.pera + pr.rice_allowance + pr.uniform_allowance + pr.overtime_pay) as gross'),
                DB::raw('SUM(pr.net_pay) as net'),
                DB::raw('SUM(pr.gsis_premium + pr.philhealth + pr.pag_ibig + pr.withholding_tax
                             + pr.absent_deduction + pr.late_deduction + pr.undertime_deduction
                             + pr.other_deductions_total + pr.water_bill) as deductions')
            )
            ->where('pp.start_date', '>=', Carbon::now()->subMonths(11)->startOfMonth())
            ->groupBy('month_key', 'month')
            ->orderBy('month_key')
            ->get()
            ->map(fn ($row) => [
                'month'      => $row->month,
                'gross'      => (float) $row->gross,
                'net'        => (float) $row->net,
                'deductions' => (float) $row->deductions,
            ])
            ->values();

        // ── 6. Payroll Forecast (last 4 closed/processed periods + 2.5% growth)
        $recentPeriods = PayrollPeriod::whereIn('status', ['Processed', 'Closed'])
            ->orderByDesc('start_date')
            ->take(4)
            ->with('payrollRecords')
            ->get()
            ->sortBy('start_date')
            ->values();

        $forecast = $recentPeriods->map(function (PayrollPeriod $pp) {
            $prevNet    = (float) $pp->payrollRecords->sum('net_pay');
            $growthRate = 0.025;
            $change     = round($prevNet * $growthRate, 2);

            return [
                'period'   => Carbon::parse($pp->start_date)->format('M d')
                              . '–'
                              . Carbon::parse($pp->end_date)->format('d'),
                'forecast' => round($prevNet * (1 + $growthRate), 2),
                'previous' => $prevNet,
                'change'   => $change,
            ];
        })->values();

        // ── 7. Department list for filter dropdown ────────────────────────────
        $departments = Department::orderBy('department_name')
            ->pluck('department_name')
            ->toArray();

        // ── 8. Render ─────────────────────────────────────────────────────────
        // Path matches: resources/js/pages/ReportsAndAnalytics/Payroll/Index.tsx
        return Inertia::render('ReportsAndAnalytics/Payroll/Index', [
            'payrollRecords'      => $records->values(),
            'totalGross'          => $totalGross,
            'totalDeductions'     => $totalDeductions,
            'totalNet'            => $totalNet,
            'employeeCount'       => $employeeCount,
            'nextPayrollDate'     => $nextPayrollDate,
            'nextPayrollDateFull' => $nextPayrollDateFull,
            'monthlyTrend'        => $monthlyTrend,
            'forecast'            => $forecast,
            'departments'         => $departments,
            'filters'             => [
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
        ]);
    }
}