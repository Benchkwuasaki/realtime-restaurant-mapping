<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaySlipGenerationController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    public function index(Request $request)
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Pay Slip Generation Page',
        ]);

        // ── Employees (sorted alphabetically) ────────────────────────────────
        $employees = Employee::with(['basicInfo', 'item.position'])
            ->get()
            ->map(fn (Employee $e) => [
                'employee_id' => $e->employee_id,
                'full_name' => trim(
                    ($e->basicInfo->last_name ?? '').', '.
                    ($e->basicInfo->first_name ?? '').' '.
                    ($e->basicInfo->middle_name ?? '')
                ),
                'employment_classification' => ucfirst(strtolower($e->employment_classification ?? 'regular')),
            ])
            ->sortBy('full_name')
            ->values();

        // ── Periods — deduplicated by date range, Processed or Closed only ───
        $payroll_periods = PayrollPeriod::whereIn('status', ['Processed', 'Closed'])
            ->orderByDesc('start_date')
            ->get()
            ->unique(fn ($p) => $p->start_date->format('Y-m-d').'_'.$p->end_date->format('Y-m-d'))
            ->map(fn (PayrollPeriod $p) => [
                'payroll_period_id' => $p->payroll_period_id,
                'label' => $this->formatPeriodLabel($p->start_date, $p->end_date),
                'start_date' => $p->start_date,
                'end_date' => $p->end_date,
                'cut_off' => $p->cut_off,
                'status' => $p->status,
            ])
            ->values();

        // ── Build period → classifications map ────────────────────────────────
        // For each period (grouped by date range), find which employee
        // classifications actually have at least one payroll record.
        //
        // We join payroll_records → employees, then group by the canonical
        // period key (start_date_end_date) so the deduplication above is
        // respected on the frontend as well.

        // ── Build period → employee IDs map ──────────────────────────────────
        // Used by the frontend to filter the employee dropdown to only those
        // who have an actual payroll record in the selected period.
        $periodEmployees = DB::table('payroll_records')
            ->join('payroll_periods as pp', 'payroll_records.payroll_period_id', '=', 'pp.payroll_period_id')
            ->whereIn('pp.status', ['Processed', 'Closed'])
            ->select(
                'pp.start_date',
                'pp.end_date',
                'payroll_records.employee_id'
            )
            ->distinct()
            ->get()
            ->groupBy(fn ($row) => Carbon::parse($row->start_date)->format('Y-m-d').'_'.Carbon::parse($row->end_date)->format('Y-m-d'))
            ->map(fn ($rows) => $rows->pluck('employee_id')->unique()->values()->toArray());

        $periodClassifications = DB::table('payroll_records')
            ->join('payroll_periods', 'payroll_records.payroll_period_id', '=', 'payroll_periods.payroll_period_id')
            ->join('employees', 'payroll_records.employee_id', '=', 'employees.employee_id')
            ->whereIn('payroll_periods.status', ['Processed', 'Closed'])
            ->select(
                'payroll_periods.start_date',
                'payroll_periods.end_date',
                'employees.employment_classification'
            )
            ->distinct()
            ->get()
            // Group by the same deduplication key used for periods above
            ->groupBy(fn ($row) => Carbon::parse($row->start_date)->format('Y-m-d').'_'.Carbon::parse($row->end_date)->format('Y-m-d'))
            ->map(fn ($rows) => $rows
                ->pluck('employment_classification')
                ->map(fn ($c) => ucfirst(strtolower($c)))
                ->unique()
                ->values()
            );

        // Attach the classifications list and employee IDs to each period
        $payroll_periods = $payroll_periods->map(function ($p) use ($periodClassifications, $periodEmployees) {
            $key = Carbon::parse($p['start_date'])->format('Y-m-d').'_'.Carbon::parse($p['end_date'])->format('Y-m-d');
            $p['available_classifications'] = $periodClassifications->get($key, collect())->values()->toArray();

            return $p;
        })->values();

        // ── Request params ────────────────────────────────────────────────────
        $selectedEmployeeId = $request->integer('employee_id') ?: null;
        $selectedPeriodId = $request->integer('period_id') ?: null;
        $isBulk = $request->boolean('bulk');
        $bulkClassification = $request->string('classification')->toString();

        // ── Single payslip ────────────────────────────────────────────────────
        $payslip = null;
        if (! $isBulk && $selectedEmployeeId && $selectedPeriodId) {
            $payslip = $this->buildPayslip($selectedEmployeeId, $selectedPeriodId);
        }

        // ── Bulk payslips ─────────────────────────────────────────────────────
        $bulkPayslips = [];
        if ($isBulk && $selectedPeriodId) {
            $query = Employee::with(['basicInfo', 'item.position', 'salaryGradeStep']);

            if ($bulkClassification !== '') {
                $query->where('employment_classification', 'like', $bulkClassification);
            }

            $bulkPayslips = $query
                ->get()
                ->map(fn (Employee $e) => $this->buildPayslip($e->employee_id, $selectedPeriodId))
                ->filter()      // remove nulls (no record for this period)
                ->sortBy('employee_name')
                ->values()
                ->toArray();
        }

        return Inertia::render('Payroll/Outputs/PaySlipGeneration/Index', [
            'employees' => $employees,
            'payroll_periods' => $payroll_periods,
            'payslip' => $payslip,
            'bulk_payslips' => $bulkPayslips,
            'selected_employee_id' => $selectedEmployeeId,
            'selected_period_id' => $selectedPeriodId,
            'is_bulk' => $isBulk,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildPayslip(int $employeeId, int $periodId): ?array
    {
        $employee = Employee::with([
            'basicInfo',
            'item.position',
            'salaryGradeStep',
        ])->find($employeeId);

        if (! $employee) {
            return null;
        }

        $period = PayrollPeriod::find($periodId);
        if (! $period) {
            return null;
        }

        $allPeriodIds = PayrollPeriod::where('start_date', $period->start_date)
            ->where('end_date', $period->end_date)
            ->pluck('payroll_period_id')
            ->toArray();

        $record = PayrollRecord::where('employee_id', $employeeId)
            ->whereIn('payroll_period_id', $allPeriodIds)
            ->first();

        if (! $record) {
            return null;
        }

        $basicInfo = $employee->basicInfo;
        $position = $employee->item?->position;
        $sgStep = $employee->salaryGradeStep;

        return [
            'employee_name' => trim(
                ($basicInfo->last_name ?? '').', '.
                ($basicInfo->first_name ?? '').' '.
                ($basicInfo->middle_name ?? '')
            ),
            'position' => $position?->position_name ?? '—',
            'salary_grade' => (int) ($sgStep?->salary_grade ?? 0),
            'step' => (int) ($sgStep?->step ?? 0),
            'employment_classification' => ucfirst(strtolower($employee->employment_classification ?? 'regular')),
            'period_label' => $this->formatPeriodLabel($period->start_date, $period->end_date),

            'basic_pay' => (float) ($record->basic_pay ?? 0),
            'pera' => (float) ($record->pera ?? 0),
            'rice_allowance' => (float) ($record->rice_allowance ?? 0),
            'uniform_allowance' => (float) ($record->uniform_allowance ?? 0),

            'gsis_premium' => (float) ($record->gsis_premium ?? 0),
            'philhealth' => (float) ($record->philhealth ?? 0),
            'pag_ibig' => (float) ($record->pag_ibig ?? 0),
            'withholding_tax' => (float) ($record->withholding_tax ?? 0),

            'absent_days' => (int) ($record->absent_days ?? 0),
            'absent_deduction' => (float) ($record->absent_deduction ?? 0),
            'late_minutes' => (int) ($record->late_minutes ?? 0),
            'late_deduction' => (float) ($record->late_deduction ?? 0),

            'gsis_mpl' => (float) ($record->gsis_mpl ?? 0),
            'gsis_emergency' => (float) ($record->gsis_emergency ?? 0),
            'pag_ibig_mpl' => (float) ($record->pag_ibig_mpl ?? 0),
            'ama_y2k_union' => (float) ($record->ama_y2k_union ?? 0),
            'water_bill' => (float) ($record->water_bill ?? 0),

            'net_pay' => (float) ($record->net_pay ?? 0),
            'floor_check_passed' => (bool) ($record->floor_check_passed ?? true),
            'posted_date' => $record->posted_at
                                        ? Carbon::parse($record->posted_at)->format('M d, Y')
                                        : '—',
            'hr_officer' => $record->hr_officer_name ?? '—',
        ];
    }

    private function formatPeriodLabel(string $startDate, string $endDate): string
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($start->month === $end->month && $start->year === $end->year) {
            return $start->format('M d').' – '.$end->format('d, Y');
        }

        return $start->format('M d').' – '.$end->format('M d, Y');
    }
}
