<?php

namespace App\Http\Controllers;

use App\Models\GovernmentAccType;
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
        $employeeTypeFilter = $request->get('employee_type', 'all');

        $allPeriods = PayrollPeriod::orderBy('start_date', 'desc')
            ->whereRaw('DAY(start_date) = 16')
            ->get();

        $periods = $allPeriods->filter(function ($period) {
            return PayrollRecord::where('payroll_period_id', $period->payroll_period_id)
                ->whereHas('employee', function ($query) {
                    $query->whereRaw('LOWER(employment_classification) IN (?, ?)', ['regular', 'casual']);
                })
                ->exists();
        })->map(fn ($p) => [
            'id' => $p->payroll_period_id,
            'label' => $p->start_date->format('F j').' – '.$p->end_date->format('F j, Y'),
            'start_date' => $p->start_date->format('Y-m-d'),
            'end_date' => $p->end_date->format('Y-m-d'),
        ]);

        // Default to the latest available period when none is specified
        if (! $periodId && $periods->isNotEmpty()) {
            $periodId = $periods->first()['id'];
        }

        $selectedPeriod = $periodId
            ? PayrollPeriod::find($periodId)
            : null;

        // Load rates from GovernmentAccType — the single source of truth
        // (same table that PayrollDeductionSettingsController reads/writes)
        $s = PayrollDeductionSetting::getSettings();
        $accTypes = GovernmentAccType::all()->keyBy('code');
        $gsis = $accTypes->get('GSIS');
        $phic = $accTypes->get('PHILHEALTH');
        $pagibig = $accTypes->get('PAGIBIG');

        $rates = [
            // GSIS
            'gsis_employee_rate' => (float) ($gsis?->employee_rate ?? 9.0),
            'gsis_employer_rate' => (float) ($gsis?->employer_rate ?? 12.0),
            // PhilHealth — one rate stored; employer mirrors employee (50/50 split)
            'philhealth_employee_rate' => (float) ($phic?->employee_rate ?? 2.5),
            'philhealth_employer_rate' => (float) ($phic?->employee_rate ?? 2.5),
            // PhilHealth floor/ceiling stored per-payroll; convert to monthly for report
            'philhealth_floor' => (float) (($phic?->min_contribution ?? 250.0) * 2),
            'philhealth_ceiling' => (float) (($phic?->max_contribution ?? 2500.0) * 2),
            // Pag-IBIG — fixed_amount is monthly cap; divide by 2 for per-payroll
            'pagibig_per_payroll' => (float) (($pagibig?->fixed_amount ?? 100.0) / 2),
        ];

        // Initialize empty arrays
        $remittances = [];
        $summary = [
            'employee_deductions' => 0,
            'employer_payment' => 0,
            'total_remit' => 0,
            'employees_covered' => 0,
            'by_employee_type' => [
                'regular' => [
                    'count' => 0,
                    'deductions' => 0,
                    'employer' => 0,
                    'total' => 0,
                ],
                'casual' => [
                    'count' => 0,
                    'deductions' => 0,
                    'employer' => 0,
                    'total' => 0,
                ],
            ],
        ];

        // Only fetch and calculate if a period is selected
        if ($selectedPeriod) {
            // Get ALL payroll records for the date range, regardless of employee type
            $payrollRecords = PayrollRecord::with([
                'employee.basicInfo',
                'employee.item.position',
                'employee.salaryGradeStep',
            ])
                ->whereHas('payrollPeriod', function ($query) use ($selectedPeriod) {
                    $query->where('start_date', $selectedPeriod->start_date)
                        ->where('end_date', $selectedPeriod->end_date);
                })
                ->get();

            // Calculate remittances for all agencies (with employee type data and filtering)
            $remittances = $this->calculateRemittances($payrollRecords, $rates, $employeeTypeFilter);

            // Calculate summary totals
            $summary = $this->calculateSummary($remittances, $payrollRecords);
        } else {
            // Return empty agency structures when no period selected
            $remittances = [
                'gsis' => $this->emptyAgencyData('gsis', 'GSIS', 'Government Service Insurance System'),
                'philhealth' => $this->emptyAgencyData('philhealth', 'PhilHealth', 'Philippine Health Insurance Corporation', 'Tiger Partner in Health'),
                'pagibig' => $this->emptyAgencyData('pagibig', 'Pag-IBIG', 'Home Development Mutual Fund', 'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno'),
                'bir' => $this->emptyAgencyData('bir', 'BIR', 'Bureau of Internal Revenue'),
            ];
        }

        // Get employee type counts for the selected period
        $employeeTypeCounts = $this->getEmployeeTypeCounts($selectedPeriod);

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
                'gsis_employee_rate' => $rates['gsis_employee_rate'],
                'gsis_employer_rate' => $rates['gsis_employer_rate'],
                'philhealth_rate' => $rates['philhealth_employee_rate'],
                'philhealth_employer_rate' => $rates['philhealth_employer_rate'],
                'pagibig_monthly' => $rates['pagibig_per_payroll'] * 2,
                'pagibig_per_payroll' => $rates['pagibig_per_payroll'],
            ],
            'employeeTypeCounts' => $employeeTypeCounts,
            'currentEmployeeTypeFilter' => $employeeTypeFilter,
        ]);
    }

    /**
     * Get counts of employees by type for the selected period
     */
    private function getEmployeeTypeCounts($selectedPeriod): array
    {
        if (! $selectedPeriod) {
            return [
                'regular' => 0,
                'casual' => 0,
                'total' => 0,
            ];
        }

        $records = PayrollRecord::with('employee')
            ->whereHas('payrollPeriod', function ($query) use ($selectedPeriod) {
                $query->where('start_date', $selectedPeriod->start_date)
                    ->where('end_date', $selectedPeriod->end_date);
            })
            ->get();

        $regularCount = $records->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'regular';
        })->count();

        $casualCount = $records->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'casual';
        })->count();

        return [
            'regular' => $regularCount,
            'casual' => $casualCount,
            'total' => $records->count(),
        ];
    }

    /**
     * Calculate remittances for all government agencies with optional employee type filter
     * and organized by employee type (Regular first, then Casual)
     */
    private function calculateRemittances($payrollRecords, array $rates, $employeeTypeFilter = 'all'): array
    {
        if ($payrollRecords->isEmpty()) {
            return [
                'gsis' => $this->emptyAgencyData('gsis', 'GSIS', 'Government Service Insurance System'),
                'philhealth' => $this->emptyAgencyData('philhealth', 'PhilHealth', 'Philippine Health Insurance Corporation', 'Tiger Partner in Health'),
                'pagibig' => $this->emptyAgencyData('pagibig', 'Pag-IBIG', 'Home Development Mutual Fund', 'Pagtutulungan sa Kinabukasan: Ikaw, Bangko, Industriya at Gobyerno'),
                'bir' => $this->emptyAgencyData('bir', 'BIR', 'Bureau of Internal Revenue'),
            ];
        }

        $pagibigPerPayroll = $rates['pagibig_per_payroll'];
        $philhealthEmployeeRate = $rates['philhealth_employee_rate'];
        $philhealthEmployerRate = $rates['philhealth_employer_rate'];
        $philhealthFloor = $rates['philhealth_floor'];
        $philhealthCeiling = $rates['philhealth_ceiling'];

        // Filter records by employee type if needed
        $filteredRecords = $payrollRecords;
        if ($employeeTypeFilter !== 'all') {
            $filteredRecords = $payrollRecords->filter(function ($record) use ($employeeTypeFilter) {
                return strtolower($record->employee?->employment_classification ?? '') === $employeeTypeFilter;
            });
        }

        // Split records by employee type
        $regularRecords = $filteredRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'regular';
        });

        $casualRecords = $filteredRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'casual';
        });

        // Helper function to map records to employee data
        $mapRecordsToEmployees = function ($records, $type) use ($rates, $pagibigPerPayroll, $philhealthEmployeeRate, $philhealthEmployerRate, $philhealthFloor, $philhealthCeiling) {
            return $records->map(function ($record) use ($rates, $pagibigPerPayroll, $type, $philhealthEmployeeRate, $philhealthEmployerRate, $philhealthFloor, $philhealthCeiling) {
                $monthlyBasic = $record->basic_pay * 2;

                // Get employee name
                $employeeName = $record->employee?->basicInfo
                    ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                    : '—';

                // Get position
                $position = $record->employee?->item?->position?->position_name ?? '—';

                // Get classification
                $classification = $record->employee?->employment_classification ?? '—';

                // PhilHealth: floor/ceiling from GovernmentAccType (stored per-payroll × 2 = monthly)
                $totalContribution = round($monthlyBasic * (($philhealthEmployeeRate + $philhealthEmployerRate) / 100), 2);
                $totalContribution = max($philhealthFloor, min($philhealthCeiling, $totalContribution));
                $philhealthEmployeeShare = round($totalContribution / 2, 2);
                $philhealthEmployerShare = round($totalContribution / 2, 2);

                // For BIR
                $monthlyTax = $record->withholding_tax * 2;

                return [
                    'id' => $record->employee_id,
                    'name' => $employeeName,
                    'position' => $position,
                    'classification' => $classification,
                    'employee_type' => $type,
                    'basic_pay' => $monthlyBasic,
                    // GSIS
                    'gsis_employee' => round($monthlyBasic * ($rates['gsis_employee_rate'] / 100), 2),
                    'gsis_employer' => round($monthlyBasic * ($rates['gsis_employer_rate'] / 100), 2),
                    'gsis_total' => round(
                        ($monthlyBasic * ($rates['gsis_employee_rate'] / 100)) +
                        ($monthlyBasic * ($rates['gsis_employer_rate'] / 100)),
                        2
                    ),
                    // PhilHealth
                    'philhealth_employee' => $philhealthEmployeeShare,
                    'philhealth_employer' => $philhealthEmployerShare,
                    'philhealth_total' => $philhealthEmployeeShare + $philhealthEmployerShare,
                    // Pag-IBIG
                    'pagibig_employee' => $pagibigPerPayroll,
                    'pagibig_employer' => $pagibigPerPayroll,
                    'pagibig_total' => $pagibigPerPayroll * 2,
                    // BIR
                    'bir_employee' => $monthlyTax,
                    'bir_employer' => 0,
                    'bir_total' => $monthlyTax,
                    // Sort key for alphabetical ordering within type
                    'sort_name' => $employeeName !== '—' ? $employeeName : 'ZZZZZ'.$record->employee_id,
                ];
            })->sortBy('sort_name')->values();
        };

        // Get employees by type
        $regularEmployees = $mapRecordsToEmployees($regularRecords, 'regular');
        $casualEmployees = $mapRecordsToEmployees($casualRecords, 'casual');

        // Combine all employees with Regular first, then Casual
        $allEmployees = $regularEmployees->concat($casualEmployees)->map(function ($item) {
            unset($item['sort_name']);

            return $item;
        });

        $regularTotals = [
            'gsis_employee' => $regularEmployees->sum('gsis_employee'),
            'gsis_employer' => $regularEmployees->sum('gsis_employer'),
            'gsis_total' => $regularEmployees->sum('gsis_total'),
            'philhealth_employee' => $regularEmployees->sum('philhealth_employee'),
            'philhealth_employer' => $regularEmployees->sum('philhealth_employer'),
            'philhealth_total' => $regularEmployees->sum('philhealth_total'),
            'pagibig_employee' => $regularEmployees->sum('pagibig_employee'),
            'pagibig_employer' => $regularEmployees->sum('pagibig_employer'),
            'pagibig_total' => $regularEmployees->sum('pagibig_total'),
            'bir_employee' => $regularEmployees->sum('bir_employee'),
            'bir_employer' => $regularEmployees->sum('bir_employer'),
            'bir_total' => $regularEmployees->sum('bir_total'),
        ];

        $casualTotals = [
            'gsis_employee' => $casualEmployees->sum('gsis_employee'),
            'gsis_employer' => $casualEmployees->sum('gsis_employer'),
            'gsis_total' => $casualEmployees->sum('gsis_total'),
            'philhealth_employee' => $casualEmployees->sum('philhealth_employee'),
            'philhealth_employer' => $casualEmployees->sum('philhealth_employer'),
            'philhealth_total' => $casualEmployees->sum('philhealth_total'),
            'pagibig_employee' => $casualEmployees->sum('pagibig_employee'),
            'pagibig_employer' => $casualEmployees->sum('pagibig_employer'),
            'pagibig_total' => $casualEmployees->sum('pagibig_total'),
            'bir_employee' => $casualEmployees->sum('bir_employee'),
            'bir_employer' => $casualEmployees->sum('bir_employer'),
            'bir_total' => $casualEmployees->sum('bir_total'),
        ];

        $gsisEmployees = $allEmployees->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'position' => $item['position'],
                'classification' => $item['classification'],
                'employee_type' => $item['employee_type'],
                'basic_pay' => $item['basic_pay'],
                'employee_share' => $item['gsis_employee'],
                'employer_share' => $item['gsis_employer'],
                'subtotal' => $item['gsis_total'],
            ];
        });

        $philhealthEmployees = $allEmployees->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'position' => $item['position'],
                'classification' => $item['classification'],
                'employee_type' => $item['employee_type'],
                'basic_pay' => $item['basic_pay'],
                'employee_share' => $item['philhealth_employee'],
                'employer_share' => $item['philhealth_employer'],
                'subtotal' => $item['philhealth_total'],
            ];
        });

        $pagibigEmployees = $allEmployees->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'position' => $item['position'],
                'classification' => $item['classification'],
                'employee_type' => $item['employee_type'],
                'basic_pay' => $item['basic_pay'],
                'employee_share' => $item['pagibig_employee'],
                'employer_share' => $item['pagibig_employer'],
                'subtotal' => $item['pagibig_total'],
            ];
        });

        $birEmployees = $allEmployees->map(function ($item) {
            return [
                'id' => $item['id'],
                'name' => $item['name'],
                'position' => $item['position'],
                'classification' => $item['classification'],
                'employee_type' => $item['employee_type'],
                'basic_pay' => $item['basic_pay'],
                'employee_share' => $item['bir_employee'],
                'employer_share' => $item['bir_employer'],
                'subtotal' => $item['bir_total'],
            ];
        });

        return [
            'gsis' => [
                'agency' => 'gsis',
                'agency_name' => 'GSIS',
                'full_name' => 'Government Service Insurance System',
                'tagline' => '',
                'rate_description' => "Employee: {$rates['gsis_employee_rate']}% · Employer: {$rates['gsis_employer_rate']}% of basic salary",
                'total_employee_share' => $gsisEmployees->sum('employee_share'),
                'total_employer_share' => $gsisEmployees->sum('employer_share'),
                'total' => $gsisEmployees->sum('subtotal'),
                'employees' => $gsisEmployees,
                'employee_count' => $gsisEmployees->count(),
                'regular_count' => $regularEmployees->count(),
                'casual_count' => $casualEmployees->count(),
                'regular_totals' => [
                    'employee' => $regularTotals['gsis_employee'],
                    'employer' => $regularTotals['gsis_employer'],
                    'total' => $regularTotals['gsis_total'],
                ],
                'casual_totals' => [
                    'employee' => $casualTotals['gsis_employee'],
                    'employer' => $casualTotals['gsis_employer'],
                    'total' => $casualTotals['gsis_total'],
                ],
            ],
            'philhealth' => [
                'agency' => 'philhealth',
                'agency_name' => 'PhilHealth',
                'full_name' => 'Philippine Health Insurance Corporation',
                'tagline' => 'Tiger Partner in Health',
                'rate_description' => "Employee: {$rates['philhealth_employee_rate']}% · Employer: {$rates['philhealth_employer_rate']}% of basic salary (50/50 split)",
                'total_employee_share' => $philhealthEmployees->sum('employee_share'),
                'total_employer_share' => $philhealthEmployees->sum('employer_share'),
                'total' => $philhealthEmployees->sum('subtotal'),
                'employees' => $philhealthEmployees,
                'employee_count' => $philhealthEmployees->count(),
                'regular_count' => $regularEmployees->count(),
                'casual_count' => $casualEmployees->count(),
                'regular_totals' => [
                    'employee' => $regularTotals['philhealth_employee'],
                    'employer' => $regularTotals['philhealth_employer'],
                    'total' => $regularTotals['philhealth_total'],
                ],
                'casual_totals' => [
                    'employee' => $casualTotals['philhealth_employee'],
                    'employer' => $casualTotals['philhealth_employer'],
                    'total' => $casualTotals['philhealth_total'],
                ],
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
                'employee_count' => $pagibigEmployees->count(),
                'regular_count' => $regularEmployees->count(),
                'casual_count' => $casualEmployees->count(),
                'regular_totals' => [
                    'employee' => $regularTotals['pagibig_employee'],
                    'employer' => $regularTotals['pagibig_employer'],
                    'total' => $regularTotals['pagibig_total'],
                ],
                'casual_totals' => [
                    'employee' => $casualTotals['pagibig_employee'],
                    'employer' => $casualTotals['pagibig_employer'],
                    'total' => $casualTotals['pagibig_total'],
                ],
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
                'employee_count' => $birEmployees->count(),
                'regular_count' => $regularEmployees->count(),
                'casual_count' => $casualEmployees->count(),
                'regular_totals' => [
                    'employee' => $regularTotals['bir_employee'],
                    'employer' => $regularTotals['bir_employer'],
                    'total' => $regularTotals['bir_total'],
                ],
                'casual_totals' => [
                    'employee' => $casualTotals['bir_employee'],
                    'employer' => $casualTotals['bir_employer'],
                    'total' => $casualTotals['bir_total'],
                ],
            ],
        ];
    }

    /**
     * Calculate summary totals across all agencies
     */
    private function calculateSummary($remittances, $payrollRecords): array
    {
        $totalEmployeeDeductions = 0;
        $totalEmployerPayment = 0;
        $employeesCovered = 0;

        $regularRecords = $payrollRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'regular';
        });

        $casualRecords = $payrollRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'casual';
        });

        foreach (['gsis', 'philhealth', 'pagibig', 'bir'] as $agency) {
            if (isset($remittances[$agency])) {
                $totalEmployeeDeductions += $remittances[$agency]['total_employee_share'];
                $totalEmployerPayment += $remittances[$agency]['total_employer_share'];

                if (! empty($remittances[$agency]['employees'])) {
                    $employeesCovered = max($employeesCovered, $remittances[$agency]['employee_count'] ?? 0);
                }
            }
        }

        $regularEmployeeShare = 0;
        $regularEmployerShare = 0;
        $casualEmployeeShare = 0;
        $casualEmployerShare = 0;

        foreach (['gsis', 'philhealth', 'pagibig', 'bir'] as $agency) {
            if (isset($remittances[$agency])) {
                $regularEmployeeShare += $remittances[$agency]['regular_totals']['employee'] ?? 0;
                $regularEmployerShare += $remittances[$agency]['regular_totals']['employer'] ?? 0;
                $casualEmployeeShare += $remittances[$agency]['casual_totals']['employee'] ?? 0;
                $casualEmployerShare += $remittances[$agency]['casual_totals']['employer'] ?? 0;
            }
        }

        return [
            'employee_deductions' => round($totalEmployeeDeductions, 2),
            'employer_payment' => round($totalEmployerPayment, 2),
            'total_remit' => round($totalEmployeeDeductions + $totalEmployerPayment, 2),
            'employees_covered' => $employeesCovered,
            'by_employee_type' => [
                'regular' => [
                    'count' => $regularRecords->count(),
                    'deductions' => round($regularEmployeeShare, 2),
                    'employer' => round($regularEmployerShare, 2),
                    'total' => round($regularEmployeeShare + $regularEmployerShare, 2),
                ],
                'casual' => [
                    'count' => $casualRecords->count(),
                    'deductions' => round($casualEmployeeShare, 2),
                    'employer' => round($casualEmployerShare, 2),
                    'total' => round($casualEmployeeShare + $casualEmployerShare, 2),
                ],
            ],
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
            'employee_count' => 0,
            'regular_count' => 0,
            'casual_count' => 0,
            'regular_totals' => ['employee' => 0, 'employer' => 0, 'total' => 0],
            'casual_totals' => ['employee' => 0, 'employer' => 0, 'total' => 0],
        ];
    }
}
