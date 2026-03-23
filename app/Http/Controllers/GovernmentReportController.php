<?php

namespace App\Http\Controllers;

use App\Models\GovernmentAccType;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GovernmentReportController extends Controller
{
    public function index()
    {
        // ── Rates (same source as remittance controller) ──────────────────
        $accTypes      = GovernmentAccType::all()->keyBy('code');
        $gsis          = $accTypes->get('GSIS');
        $phic          = $accTypes->get('PHILHEALTH');
        $pagibigAcc    = $accTypes->get('PAGIBIG');

        $gsisEmpRate       = (float) ($gsis?->employee_rate ?? 9.0);
        $gsisErRate        = (float) ($gsis?->employer_rate ?? 12.0);
        $phRate            = (float) ($phic?->employee_rate ?? 2.5);
        $phFloor           = (float) (($phic?->min_contribution ?? 250.0) * 2);
        $phCeiling         = (float) (($phic?->max_contribution ?? 2500.0) * 2);
        $pagibigFixed      = (float) ($pagibigAcc?->fixed_amount ?? 100.0);
        $pagibigPerPayroll = $pagibigFixed / 2;

        // ── Helper: get employee name (same as remittance controller) ─────
        $getName = fn($r) => $r->employee?->basicInfo
            ? $r->employee->basicInfo->last_name.', '.$r->employee->basicInfo->first_name
            : ($r->employee_name ?? '—');

        // ── Latest period (same query logic as remittance controller) ─────
        $latestPeriod = PayrollPeriod::whereIn('status', ['Closed', 'Processed'])
            ->whereRaw('DAY(start_date) = 16')
            ->orderBy('start_date', 'desc')
            ->first();

       $records = $latestPeriod
    ? PayrollRecord::with(['employee.basicInfo', 'employee.item.position'])
        ->whereHas('payrollPeriod', function ($query) use ($latestPeriod) {
            $query->where('start_date', $latestPeriod->start_date)
                  ->where('end_date', $latestPeriod->end_date);
        })
        ->whereHas('employee', function ($query) {
            $query->whereRaw('LOWER(employment_classification) IN (?, ?)', ['regular', 'casual']);
        })
        ->get()
    : collect();

        $periodLabel = $latestPeriod
            ? Carbon::parse($latestPeriod->end_date)->format('M Y')
            : '—';

        // ── Summary KPIs ──────────────────────────────────────────────────
        $totalGsis = $records->sum(fn($r) =>
            round($r->basic_pay * 2 * (($gsisEmpRate + $gsisErRate) / 100), 2)
        );

        $totalPhilhealth = $records->sum(function ($r) use ($phRate, $phFloor, $phCeiling) {
            $monthly = $r->basic_pay * 2;
            $total   = round($monthly * ($phRate * 2 / 100), 2);
            return max($phFloor, min($phCeiling, $total));
        });

        $totalPagibig = $records->count() * $pagibigFixed;
        $totalTax     = (float) $records->sum('withholding_tax') * 2;

        // ── GSIS table ────────────────────────────────────────────────────
        $gsisData = $records->map(fn($r) => [
            'name'     => $getName($r),
            'gsis'     => $r->employee?->gsis_number ?? '—',
            'employee' => round($r->basic_pay * 2 * ($gsisEmpRate / 100), 2),
            'employer' => round($r->basic_pay * 2 * ($gsisErRate / 100), 2),
            'total'    => round($r->basic_pay * 2 * (($gsisEmpRate + $gsisErRate) / 100), 2),
            'period'   => $periodLabel,
        ])->values();

        // ── PhilHealth table ──────────────────────────────────────────────
        $philhealthData = $records->map(function ($r) use ($phRate, $phFloor, $phCeiling, $getName) {
            $monthly = $r->basic_pay * 2;
            $total   = max($phFloor, min($phCeiling, round($monthly * ($phRate * 2 / 100), 2)));
            return [
                'name'     => $getName($r),
                'ph'       => $r->employee?->philhealth_number ?? '—',
                'salary'   => $monthly,
                'employee' => round($total / 2, 2),
                'employer' => round($total / 2, 2),
                'total'    => $total,
            ];
        })->values();

        // ── Pag-IBIG table ────────────────────────────────────────────────
        $pagibigData = $records->map(fn($r) => [
            'name'     => $getName($r),
            'pagibig'  => $r->employee?->pagibig_number ?? '—',
            'salary'   => $r->basic_pay * 2,
            'employee' => $pagibigPerPayroll,
            'employer' => $pagibigPerPayroll,
            'total'    => $pagibigFixed,
        ])->values();

        // ── BIR table ─────────────────────────────────────────────────────
        $birData = $records->where('withholding_tax', '>', 0)->map(fn($r) => [
            'name'    => $getName($r),
            'tin'     => $r->employee?->tin ?? '—',
            'taxable' => $r->basic_pay * 2,
            'tax'     => $r->withholding_tax * 2,
            'period'  => $periodLabel,
        ])->values();

        // ── Remittance status (last 2 periods, same query style) ──────────
        $recentPeriods = PayrollPeriod::whereIn('status', ['Closed', 'Processed'])
            ->whereRaw('DAY(start_date) = 16')
            ->orderBy('start_date', 'desc')
            ->take(2)
            ->get();

        $remittanceData = [];
        foreach ($recentPeriods as $p) {
            $recs = PayrollRecord::whereHas('payrollPeriod', function ($q) use ($p) {
                $q->where('start_date', $p->start_date)->where('end_date', $p->end_date);
            })->get();

            $label  = Carbon::parse($p->end_date)->format('M Y');
            $isPaid = $p->status === 'Closed';

            foreach ([
                ['type' => 'GSIS',       'amount' => $recs->sum(fn($r) => $r->basic_pay * 2 * (($gsisEmpRate + $gsisErRate) / 100)), 'days' => 10],
                ['type' => 'PhilHealth', 'amount' => $recs->sum(fn($r) => max($phFloor, min($phCeiling, round($r->basic_pay * 2 * ($phRate * 2 / 100), 2)))), 'days' => 15],
                ['type' => 'Pag-IBIG',   'amount' => $recs->count() * $pagibigFixed, 'days' => 15],
                ['type' => 'BIR',        'amount' => $recs->sum('withholding_tax') * 2, 'days' => 10],
            ] as $item) {
                $remittanceData[] = [
                    'type'   => $item['type'],
                    'period' => $label,
                    'amount' => round((float) $item['amount'], 2),
                    'due'    => Carbon::parse($p->end_date)->addDays($item['days'])->format('M d, Y'),
                    'status' => $isPaid ? 'Paid' : 'Pending',
                ];
            }
        }

        // ── Trend (last 12 periods, same query style) ─────────────────────
        $trendPeriods = PayrollPeriod::whereIn('status', ['Closed', 'Processed'])
            ->whereRaw('DAY(start_date) = 16')
            ->orderBy('start_date', 'asc')
            ->take(12)
            ->get();

        $trendData = $trendPeriods->map(function ($p) use ($gsisEmpRate, $gsisErRate, $phRate, $phFloor, $phCeiling, $pagibigFixed) {
            $recs = PayrollRecord::whereHas('payrollPeriod', function ($q) use ($p) {
                $q->where('start_date', $p->start_date)->where('end_date', $p->end_date);
            })->get();

            return [
                'month'      => Carbon::parse($p->end_date)->format('M'),
                'GSIS'       => round($recs->sum(fn($r) => $r->basic_pay * 2 * (($gsisEmpRate + $gsisErRate) / 100)), 2),
                'PhilHealth' => round($recs->sum(fn($r) => max($phFloor, min($phCeiling, round($r->basic_pay * 2 * ($phRate * 2 / 100), 2)))), 2),
                'PagIBIG'    => $recs->count() * $pagibigFixed,
                'BIR'        => round($recs->sum('withholding_tax') * 2, 2),
            ];
        })->values();

        return Inertia::render('ReportsAndAnalytics/Government/Index', [
            'summary' => [
                'total_gsis'       => round($totalGsis, 2),
                'total_philhealth' => round($totalPhilhealth, 2),
                'total_pagibig'    => round($totalPagibig, 2),
                'total_tax'        => round($totalTax, 2),
                'total_remittance' => round($totalGsis + $totalPhilhealth + $totalPagibig + $totalTax, 2),
            ],
            'gsisData'       => $gsisData,
            'philhealthData' => $philhealthData,
            'pagibigData'    => $pagibigData,
            'birData'        => $birData,
            'remittanceData' => $remittanceData,
            'trendData'      => $trendData,
            'period'         => $periodLabel,
        ]);
    }
}