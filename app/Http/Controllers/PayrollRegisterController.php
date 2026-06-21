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
                'employee_type' => $p->employee_type,
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

        $records = $this->buildRecords($period);
        $summary = $this->buildSummary($records);

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

    public function print(PayrollPeriod $period): Response
    {
        $records = $this->buildRecords($period);
        $summary = $this->buildSummary($records);

        return Inertia::render('Payroll/Outputs/PayrollRegister/Print', [
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

    private function buildRecords(PayrollPeriod $period)
    {
        return PayrollRecord::with([
            'employee.basicInfo',
            'employee.item.position',
            'employee.salaryGradeStep',
            'deductionItems',
        ])
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
                'basic_pay' => (float) ($r->basic_pay ?? 0),
                'pera' => (float) ($r->pera ?? 0),
                'rice_allowance' => (float) ($r->rice_allowance ?? 0),
                'uniform_allowance' => (float) ($r->uniform_allowance ?? 0),
                'overtime_pay' => (float) ($r->overtime_pay ?? 0),
                'gross_pay' => $r->gross_pay,
                'gsis_premium' => (float) ($r->gsis_premium ?? 0),
                'philhealth' => (float) ($r->philhealth ?? 0),
                'pag_ibig' => (float) ($r->pag_ibig ?? 0),
                'withholding_tax' => (float) ($r->withholding_tax ?? 0),
                'absent_days' => (float) ($r->absent_days ?? 0),
                'absent_deduction' => (float) ($r->absent_deduction ?? 0),
                'half_days' => (int) ($r->half_days ?? 0),
                'half_day_deduction' => (float) ($r->half_day_deduction ?? 0),
                'late_minutes' => (int) ($r->late_minutes ?? 0),
                'late_deduction' => (float) ($r->late_deduction ?? 0),
                'undertime_minutes' => (int) ($r->undertime_minutes ?? 0),
                'undertime_deduction' => (float) ($r->undertime_deduction ?? 0),
                'personal_slip_minutes' => (int) ($r->personal_slip_minutes ?? 0),
                'personal_slip_deduction' => (float) ($r->personal_slip_deduction ?? 0),
                'official_slip_minutes' => (int) ($r->official_slip_minutes ?? 0),
                'total_work_days' => (float) ($r->total_work_days ?? 0),
                'total_hours_worked' => (float) ($r->total_hours_worked ?? 0),
                'gsis_mpl' => (float) ($r->gsis_mpl ?? 0),
                'gsis_emergency' => (float) ($r->gsis_emergency ?? 0),
                'gsis_salary_loan' => (float) ($r->gsis_salary_loan ?? 0),
                'gsis_policy_loan' => (float) ($r->gsis_policy_loan ?? 0),
                'pag_ibig_mpl' => (float) ($r->pag_ibig_mpl ?? 0),
                'pag_ibig_housing' => (float) ($r->pag_ibig_housing ?? 0),
                'pag_ibig_calamity' => (float) ($r->pag_ibig_calamity ?? 0),
                'internal_org_savings' => (float) ($r->internal_org_savings ?? 0),
                'internal_org_second' => (float) ($r->internal_org_second ?? 0),
                'internal_org_loans' => (float) ($r->internal_org_loans ?? 0),
                'other_deductions_total' => (float) ($r->other_deductions_total ?? 0),
                'water_bill' => (float) ($r->water_bill ?? 0),
                'deduction_items' => $r->deductionItems->map(fn ($item) => [
                    'id' => $item->id,
                    'category' => $item->category,
                    'source_type' => $item->source_type,
                    'label' => $item->label,
                    'org_name' => $item->org_name,
                    'amount' => (float) $item->amount,
                    'effective_amount' => (float) $item->effective_amount,
                    'was_cut' => (bool) $item->was_cut,
                    'cut_amount' => (float) $item->cut_amount,
                    'waived' => (bool) $item->waived,
                ])->values(),
                'total_deductions' => $r->total_deductions,
                'net_pay' => (float) ($r->net_pay ?? 0),
                'floor_check_passed' => (bool) ($r->floor_check_passed ?? true),
                'floor_cut_amount' => (float) ($r->floor_cut_amount ?? 0),
                'status' => $r->status,
                'hr_officer_name' => $r->hr_officer_name ?? '—',
            ])
            ->sortBy('employee_name')
            ->values();
    }

    private function buildSummary($records): array
    {
        return [
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
            'total_half_day_deduction' => $records->sum('half_day_deduction'),
            'total_late_deduction' => $records->sum('late_deduction'),
            'total_undertime_deduction' => $records->sum('undertime_deduction'),
            'total_personal_slip_deduction' => $records->sum('personal_slip_deduction'),
            'total_gsis_mpl' => $records->sum('gsis_mpl'),
            'total_gsis_emergency' => $records->sum('gsis_emergency'),
            'total_gsis_salary_loan' => $records->sum('gsis_salary_loan'),
            'total_gsis_policy_loan' => $records->sum('gsis_policy_loan'),
            'total_pag_ibig_mpl' => $records->sum('pag_ibig_mpl'),
            'total_pag_ibig_housing' => $records->sum('pag_ibig_housing'),
            'total_pag_ibig_calamity' => $records->sum('pag_ibig_calamity'),
            'total_internal_org_savings' => $records->sum('internal_org_savings'),
            'total_internal_org_second' => $records->sum('internal_org_second'),
            'total_internal_org_loans' => $records->sum('internal_org_loans'),
            'total_other_deductions' => $records->sum('other_deductions_total'),
            'total_water_bill' => $records->sum('water_bill'),
            'total_deductions' => $records->sum('total_deductions'),
            'total_net_pay' => $records->sum('net_pay'),
            'floor_issues' => $records->where('floor_check_passed', false)->count(),
            'hr_officer_name' => $records->firstWhere('hr_officer_name', '!=', '—')['hr_officer_name'] ?? '—',
        ];
    }
}
