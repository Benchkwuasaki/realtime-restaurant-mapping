<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PayrollRegisterController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    /**
     * List all processed/closed payroll periods available for the register.
     */
    public function index(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Payroll Register Page',
        ]);

        $periods = PayrollPeriod::withCount('payrollRecords')
            ->withSum('payrollRecords', 'net_pay')
            ->withSum('payrollRecords', 'basic_pay')
            ->whereIn('status', ['Processed', 'Closed'])
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(fn (PayrollPeriod $p) => [
                'payroll_period_id' => $p->payroll_period_id,
                'start_date' => $p->start_date->toDateString(),
                'end_date' => $p->end_date->toDateString(),
                'cut_off' => $p->cut_off,
                'status' => $p->status,
                'payroll_records_count' => $p->payroll_records_count,
                'total_net_pay' => (float) ($p->payroll_records_sum_net_pay ?? 0),
                'total_basic_pay' => (float) ($p->payroll_records_sum_basic_pay ?? 0),
            ]);

        return Inertia::render('Payroll/Outputs/PayrollRegister/Index', [
            'periods' => $periods,
        ]);
    }

    /**
     * Detailed register view for a specific payroll period — read-only, print-ready.
     */
    public function show(PayrollPeriod $period): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Viewed Payroll Register for Period #{$period->payroll_period_id}",
        ]);

        $records = PayrollRecord::with(['employee.basicInfo', 'employee.item.position', 'employee.salaryGradeStep'])
            ->where('payroll_period_id', $period->payroll_period_id)
            ->get()
            ->map(fn (PayrollRecord $r) => [
                'payroll_record_id' => $r->payroll_record_id,
                'employee_id' => $r->employee_id,
                'employee_name' => $r->employee?->basicInfo
                    ? $r->employee->basicInfo->last_name.', '.$r->employee->basicInfo->first_name
                    : '—',
                'position' => $r->employee?->item?->position?->position_name ?? '—',
                'salary_grade' => (int) ($r->employee?->salaryGradeStep?->salary_grade ?? 0),
                'step' => (int) ($r->employee?->salaryGradeStep?->step ?? 0),

                // Earnings
                'basic_pay' => (float) ($r->basic_pay ?? 0),
                'pera' => (float) ($r->pera ?? 0),
                'rice_allowance' => (float) ($r->rice_allowance ?? 0),
                'uniform_allowance' => (float) ($r->uniform_allowance ?? 0),
                'gross_pay' => $r->gross_pay, // computed accessor

                // Mandatory deductions
                'gsis_premium' => (float) ($r->gsis_premium ?? 0),
                'philhealth' => (float) ($r->philhealth ?? 0),
                'pag_ibig' => (float) ($r->pag_ibig ?? 0),
                'withholding_tax' => (float) ($r->withholding_tax ?? 0),

                // Attendance deductions
                'absent_days' => (int) ($r->absent_days ?? 0),
                'absent_deduction' => (float) ($r->absent_deduction ?? 0),
                'late_minutes' => (int) ($r->late_minutes ?? 0),
                'late_deduction' => (float) ($r->late_deduction ?? 0),

                // Other deductions
                'gsis_mpl' => (float) ($r->gsis_mpl ?? 0),
                'gsis_emergency' => (float) ($r->gsis_emergency ?? 0),
                'pag_ibig_mpl' => (float) ($r->pag_ibig_mpl ?? 0),
                'ama_y2k_union' => (float) ($r->ama_y2k_union ?? 0),
                'water_bill' => (float) ($r->water_bill ?? 0),
                'total_deductions' => $r->total_deductions, // computed accessor

                // Summary
                'net_pay' => (float) ($r->net_pay ?? 0),
                'floor_check_passed' => (bool) ($r->floor_check_passed ?? true),
                'status' => $r->status,
                'hr_officer_name' => $r->hr_officer_name ?? '—',
            ])
            ->sortBy('employee_name')  // alphabetical by last_name, first_name
            ->values();                // re-index after sort

        $summary = [
            'total_employees' => $records->count(),
            'total_basic_pay' => $records->sum('basic_pay'),
            'total_pera' => $records->sum('pera'),
            'total_rice_allowance' => $records->sum('rice_allowance'),
            'total_uniform_allowance' => $records->sum('uniform_allowance'),
            'total_gross' => $records->sum('gross_pay'),
            'total_gsis_premium' => $records->sum('gsis_premium'),
            'total_philhealth' => $records->sum('philhealth'),
            'total_pag_ibig' => $records->sum('pag_ibig'),
            'total_withholding_tax' => $records->sum('withholding_tax'),
            'total_absent_deduction' => $records->sum('absent_deduction'),
            'total_late_deduction' => $records->sum('late_deduction'),
            'total_gsis_mpl' => $records->sum('gsis_mpl'),
            'total_gsis_emergency' => $records->sum('gsis_emergency'),
            'total_pag_ibig_mpl' => $records->sum('pag_ibig_mpl'),
            'total_ama_y2k_union' => $records->sum('ama_y2k_union'),
            'total_water_bill' => $records->sum('water_bill'),
            'total_deductions' => $records->sum('total_deductions'),
            'total_net_pay' => $records->sum('net_pay'),
            'floor_issues' => $records->where('floor_check_passed', false)->count(),
            // HR officer name from first record with one
            'hr_officer_name' => $records->firstWhere('hr_officer_name', '!=', '—')['hr_officer_name'] ?? '—',
        ];

        return Inertia::render('Payroll/Outputs/PayrollRegister/Show', [
            'period' => [
                'payroll_period_id' => $period->payroll_period_id,
                'start_date' => $period->start_date->toDateString(),
                'end_date' => $period->end_date->toDateString(),
                'cut_off' => $period->cut_off,
                'status' => $period->status,
            ],
            'records' => $records,
            'summary' => $summary,
        ]);
    }
}
