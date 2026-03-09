<?php

namespace App\Http\Controllers;

use App\Models\PayrollDeductionSetting;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GovernmentRemittanceReportController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    /**
     * Display government remittance report
     */
    public function index(Request $request): Response
    {
        $periodId = $request->get('period_id');
        $agency = $request->get('agency', 'all');

        // Get all payroll periods for the dropdown
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->payroll_period_id,
                'label' => $p->start_date->format('F j').' – '.$p->end_date->format('F j, Y'),
                'start_date' => $p->start_date->format('Y-m-d'),
                'end_date' => $p->end_date->format('Y-m-d'),
            ]);

        // Get selected period ONLY if period_id is provided - NO DEFAULT
        $selectedPeriod = $periodId
            ? PayrollPeriod::find($periodId)
            : null;

        // Get payroll settings
        $settings = PayrollDeductionSetting::getSettings();

        // Initialize empty arrays
        $remittances = [];
        $summary = [
            'employee_deductions' => 0,
            'employer_payment' => 0,
            'total_remit' => 0,
            'employees_covered' => 0,
        ];

        // Only fetch and calculate if a period is selected
        if ($selectedPeriod) {
            // Get payroll records for the selected period with employee details
            $payrollRecords = PayrollRecord::with([
                'employee.basicInfo',
                'employee.item.position',
                'employee.salaryGradeStep',
            ])
                ->where('payroll_period_id', $selectedPeriod->payroll_period_id)
                ->get();

            // Calculate remittances for all agencies
            $remittances = $this->calculateRemittances($payrollRecords, $settings);

            // Calculate summary totals
            $summary = $this->calculateSummary($remittances);
        } else {
            // Return empty agency structures when no period selected
            $remittances = [
                'gsis' => $this->emptyAgencyData('gsis', 'GSIS', 'Government Service Insurance System'),
                'philhealth' => $this->emptyAgencyData('philhealth', 'PhilHealth', 'Philippine Health Insurance Corporation', 'Tiger Partner in Health'),
                'pagibig' => $this->emptyAgencyData('pagibig', 'Pag-IBIG', 'Home Development Mutual Fund', 'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno'),
                'bir' => $this->emptyAgencyData('bir', 'BIR', 'Bureau of Internal Revenue'),
            ];
        }

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Government Remittance Report'.
                ($selectedPeriod ? ' for period '.$selectedPeriod->start_date->format('M d, Y') : ''),
        ]);

        return Inertia::render('Payroll/Outputs/GovernmentRemittanceReport/Index', [
            'periods' => $periods,
            'selectedPeriod' => $selectedPeriod ? [
                'id' => $selectedPeriod->payroll_period_id,
                'label' => $selectedPeriod->start_date->format('F j').' – '.$selectedPeriod->end_date->format('F j, Y'),
                'start_date' => $selectedPeriod->start_date->format('Y-m-d'),
                'end_date' => $selectedPeriod->end_date->format('Y-m-d'),
            ] : null,
            'remittances' => $remittances,
            'currentAgency' => $agency,
            'summary' => $summary,
            'settings' => [
                'gsis_employee_rate' => (float) ($settings->gsis_employee_rate ?? 9),
                'gsis_employer_rate' => (float) ($settings->gsis_employer_rate ?? 12),
                'philhealth_rate' => (float) ($settings->philhealth_rate ?? 2.5),
                'philhealth_employer_rate' => (float) ($settings->philhealth_employer_rate ?? 2.5),
                'pagibig_monthly' => (float) ($settings->pagibig_monthly ?? 100),
                'pagibig_per_payroll' => (float) (($settings->pagibig_monthly ?? 100) / 2),
            ],
        ]);
    }

    /**
     * Calculate remittances for all government agencies
     */
    private function calculateRemittances($payrollRecords, $settings): array
    {
        if ($payrollRecords->isEmpty()) {
            return [
                'gsis' => $this->emptyAgencyData('gsis', 'GSIS', 'Government Service Insurance System'),
                'philhealth' => $this->emptyAgencyData('philhealth', 'PhilHealth', 'Philippine Health Insurance Corporation', 'Tiger Partner in Health'),
                'pagibig' => $this->emptyAgencyData('pagibig', 'Pag-IBIG', 'Home Development Mutual Fund', 'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno'),
                'bir' => $this->emptyAgencyData('bir', 'BIR', 'Bureau of Internal Revenue'),
            ];
        }

        $pagibigPerPayroll = ($settings->pagibig_monthly ?? 100) / 2;

        // Calculate GSIS with sorting
        $gsisEmployees = $payrollRecords->map(function ($record) use ($settings) {
            $monthlyBasic = $record->basic_pay * 2;

            // Get employee name
            $employeeName = $record->employee?->basicInfo
                ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                : '—';

            // Get position
            $position = $record->employee?->item?->position?->position_name ?? '—';

            // Get classification
            $classification = $record->employee?->employment_classification ?? '—';

            return [
                'id' => $record->employee_id,
                'name' => $employeeName,
                'position' => $position,
                'classification' => $classification,
                'basic_pay' => $monthlyBasic,
                'employee_share' => round($monthlyBasic * ($settings->gsis_employee_rate / 100), 2),
                'employer_share' => round($monthlyBasic * ($settings->gsis_employer_rate / 100), 2),
                'subtotal' => round(
                    ($monthlyBasic * ($settings->gsis_employee_rate / 100)) +
                    ($monthlyBasic * ($settings->gsis_employer_rate / 100)),
                    2
                ),
                // Add sort key for alphabetical ordering
                'sort_name' => $employeeName !== '—' ? $employeeName : 'ZZZZZ'.$record->employee_id,
            ];
        })
            ->sortBy('sort_name')  // Sort alphabetically by name
            ->values()
            ->map(function ($item) {
                // Remove the sort key before returning
                unset($item['sort_name']);

                return $item;
            });

        // Calculate PhilHealth with sorting
        $philhealthEmployees = $payrollRecords->map(function ($record) use ($settings) {
            $monthlyBasic = $record->basic_pay * 2;

            // Get employee name
            $employeeName = $record->employee?->basicInfo
                ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                : '—';

            // Get position
            $position = $record->employee?->item?->position?->position_name ?? '—';

            // Get classification
            $classification = $record->employee?->employment_classification ?? '—';

            // PhilHealth: 5% total (2.5% each) with floor ₱500 and ceiling ₱5,000 monthly
            $totalContribution = round($monthlyBasic * (($settings->philhealth_rate + $settings->philhealth_employer_rate) / 100), 2);
            $totalContribution = max(500.0, min(5000.0, $totalContribution));

            $employeeShare = round($totalContribution / 2, 2);
            $employerShare = round($totalContribution / 2, 2);

            return [
                'id' => $record->employee_id,
                'name' => $employeeName,
                'position' => $position,
                'classification' => $classification,
                'basic_pay' => $monthlyBasic,
                'employee_share' => $employeeShare,
                'employer_share' => $employerShare,
                'subtotal' => $employeeShare + $employerShare,
                'sort_name' => $employeeName !== '—' ? $employeeName : 'ZZZZZ'.$record->employee_id,
            ];
        })
            ->sortBy('sort_name')
            ->values()
            ->map(function ($item) {
                unset($item['sort_name']);

                return $item;
            });

        // Calculate Pag-IBIG with sorting
        $pagibigEmployees = $payrollRecords->map(function ($record) use ($pagibigPerPayroll) {
            $monthlyBasic = $record->basic_pay * 2;

            // Get employee name
            $employeeName = $record->employee?->basicInfo
                ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                : '—';

            // Get position
            $position = $record->employee?->item?->position?->position_name ?? '—';

            // Get classification
            $classification = $record->employee?->employment_classification ?? '—';

            return [
                'id' => $record->employee_id,
                'name' => $employeeName,
                'position' => $position,
                'classification' => $classification,
                'basic_pay' => $monthlyBasic,
                'employee_share' => $pagibigPerPayroll,
                'employer_share' => $pagibigPerPayroll,
                'subtotal' => $pagibigPerPayroll * 2,
                'sort_name' => $employeeName !== '—' ? $employeeName : 'ZZZZZ'.$record->employee_id,
            ];
        })
            ->sortBy('sort_name')
            ->values()
            ->map(function ($item) {
                unset($item['sort_name']);

                return $item;
            });

        // Calculate BIR (Withholding Tax) with sorting
        $birEmployees = $payrollRecords->map(function ($record) {
            $monthlyTax = $record->withholding_tax * 2;

            // Get employee name
            $employeeName = $record->employee?->basicInfo
                ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                : '—';

            // Get position
            $position = $record->employee?->item?->position?->position_name ?? '—';

            // Get classification
            $classification = $record->employee?->employment_classification ?? '—';

            return [
                'id' => $record->employee_id,
                'name' => $employeeName,
                'position' => $position,
                'classification' => $classification,
                'basic_pay' => $record->basic_pay * 2,
                'employee_share' => $monthlyTax,
                'employer_share' => 0,
                'subtotal' => $monthlyTax,
                'sort_name' => $employeeName !== '—' ? $employeeName : 'ZZZZZ'.$record->employee_id,
            ];
        })
            ->sortBy('sort_name')
            ->values()
            ->map(function ($item) {
                unset($item['sort_name']);

                return $item;
            });

        return [
            'gsis' => [
                'agency' => 'gsis',
                'agency_name' => 'GSIS',
                'full_name' => 'Government Service Insurance System',
                'tagline' => '',
                'rate_description' => "Employee: {$settings->gsis_employee_rate}% · Employer: {$settings->gsis_employer_rate}% of basic salary",
                'total_employee_share' => $gsisEmployees->sum('employee_share'),
                'total_employer_share' => $gsisEmployees->sum('employer_share'),
                'total' => $gsisEmployees->sum('subtotal'),
                'employees' => $gsisEmployees,
            ],
            'philhealth' => [
                'agency' => 'philhealth',
                'agency_name' => 'PhilHealth',
                'full_name' => 'Philippine Health Insurance Corporation',
                'tagline' => 'Tiger Partner in Health',
                'rate_description' => "Employee: {$settings->philhealth_rate}% · Employer: {$settings->philhealth_employer_rate}% of basic salary (50/50 split)",
                'total_employee_share' => $philhealthEmployees->sum('employee_share'),
                'total_employer_share' => $philhealthEmployees->sum('employer_share'),
                'total' => $philhealthEmployees->sum('subtotal'),
                'employees' => $philhealthEmployees,
            ],
            'pagibig' => [
                'agency' => 'pagibig',
                'agency_name' => 'Pag-IBIG',
                'full_name' => 'Home Development Mutual Fund',
                'tagline' => 'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno',
                'rate_description' => 'Employee: ₱'.number_format($pagibigPerPayroll, 2).' · Employer: ₱'.number_format($pagibigPerPayroll, 2).' per payroll',
                'total_employee_share' => $pagibigEmployees->sum('employee_share'),
                'total_employer_share' => $pagibigEmployees->sum('employer_share'),
                'total' => $pagibigEmployees->sum('subtotal'),
                'employees' => $pagibigEmployees,
            ],
            'bir' => [
                'agency' => 'bir',
                'agency_name' => 'BIR',
                'full_name' => 'Bureau of Internal Revenue',
                'tagline' => '',
                'rate_description' => 'Withholding Tax (Monthly)',
                'total_employee_share' => $birEmployees->sum('employee_share'),
                'total_employer_share' => 0,
                'total' => $birEmployees->sum('subtotal'),
                'employees' => $birEmployees,
            ],
        ];
    }

    /**
     * Calculate summary totals across all agencies
     */
    private function calculateSummary($remittances): array
    {
        $totalEmployeeDeductions = 0;
        $totalEmployerPayment = 0;
        $employeesCovered = 0;

        foreach (['gsis', 'philhealth', 'pagibig', 'bir'] as $agency) {
            if (isset($remittances[$agency])) {
                $totalEmployeeDeductions += $remittances[$agency]['total_employee_share'];
                $totalEmployerPayment += $remittances[$agency]['total_employer_share'];

                // Get unique employees count
                if (! empty($remittances[$agency]['employees'])) {
                    $employeesCovered = max($employeesCovered, count($remittances[$agency]['employees']));
                }
            }
        }

        return [
            'employee_deductions' => round($totalEmployeeDeductions, 2),
            'employer_payment' => round($totalEmployerPayment, 2),
            'total_remit' => round($totalEmployeeDeductions + $totalEmployerPayment, 2),
            'employees_covered' => $employeesCovered,
        ];
    }

    /**
     * Empty agency data structure
     */
    private function emptyAgencyData($agency, $name, $fullName = '', $tagline = ''): array
    {
        return [
            'agency' => $agency,
            'agency_name' => $name,
            'full_name' => $fullName,
            'tagline' => $tagline,
            'rate_description' => '',
            'total_employee_share' => 0,
            'total_employer_share' => 0,
            'total' => 0,
            'employees' => [],
        ];
    }
}
