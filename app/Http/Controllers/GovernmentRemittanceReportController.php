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
        $employeeTypeFilter = $request->get('employee_type', 'all'); // 'all', 'regular', 'casual'

        // Get all payroll periods and group them by date range
        $allPeriods = PayrollPeriod::orderBy('start_date', 'desc')->get();
        
        // Create unique periods based on date range
        $uniquePeriods = collect();
        $seenDateRanges = [];
        
        foreach ($allPeriods as $period) {
            $dateKey = $period->start_date->format('Y-m-d') . '|' . $period->end_date->format('Y-m-d');
            
            if (!in_array($dateKey, $seenDateRanges)) {
                $seenDateRanges[] = $dateKey;
                $uniquePeriods->push($period);
            }
        }

        // Format periods for dropdown - FILTER OUT JOB ORDER ONLY PERIODS
        $periods = $uniquePeriods->filter(function ($period) {
            // Check if period has any Regular or Casual employees (not just Job Order)
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
            $remittances = $this->calculateRemittances($payrollRecords, $settings, $employeeTypeFilter);

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
                'gsis_employee_rate' => (float) ($settings->gsis_employee_rate ?? 9),
                'gsis_employer_rate' => (float) ($settings->gsis_employer_rate ?? 12),
                'philhealth_rate' => (float) ($settings->philhealth_rate ?? 2.5),
                'philhealth_employer_rate' => (float) ($settings->philhealth_employer_rate ?? 2.5),
                'pagibig_monthly' => (float) ($settings->pagibig_monthly ?? 100),
                'pagibig_per_payroll' => (float) (($settings->pagibig_monthly ?? 100) / 2),
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
        if (!$selectedPeriod) {
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
    private function calculateRemittances($payrollRecords, $settings, $employeeTypeFilter = 'all'): array
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
        $mapRecordsToEmployees = function ($records, $type) use ($settings, $pagibigPerPayroll) {
            return $records->map(function ($record) use ($settings, $pagibigPerPayroll, $type) {
                $monthlyBasic = $record->basic_pay * 2;

                // Get employee name
                $employeeName = $record->employee?->basicInfo
                    ? $record->employee->basicInfo->last_name.', '.$record->employee->basicInfo->first_name
                    : '—';

                // Get position
                $position = $record->employee?->item?->position?->position_name ?? '—';

                // Get classification
                $classification = $record->employee?->employment_classification ?? '—';

                // For PhilHealth: 5% total (2.5% each) with floor ₱500 and ceiling ₱5,000 monthly
                $totalContribution = round($monthlyBasic * (($settings->philhealth_rate + $settings->philhealth_employer_rate) / 100), 2);
                $totalContribution = max(500.0, min(5000.0, $totalContribution));
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
                    'gsis_employee' => round($monthlyBasic * ($settings->gsis_employee_rate / 100), 2),
                    'gsis_employer' => round($monthlyBasic * ($settings->gsis_employer_rate / 100), 2),
                    'gsis_total' => round(
                        ($monthlyBasic * ($settings->gsis_employee_rate / 100)) +
                        ($monthlyBasic * ($settings->gsis_employer_rate / 100)),
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

        // Calculate totals by type
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

        // Calculate overall totals
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
                'rate_description' => "Employee: {$settings->gsis_employee_rate}% · Employer: {$settings->gsis_employer_rate}% of basic salary",
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
                'rate_description' => "Employee: {$settings->philhealth_rate}% · Employer: {$settings->philhealth_employer_rate}% of basic salary (50/50 split)",
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

        // Calculate by employee type
        $regularRecords = $payrollRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'regular';
        });
        
        $casualRecords = $payrollRecords->filter(function ($record) {
            return strtolower($record->employee?->employment_classification ?? '') === 'casual';
        });

        // Calculate regular totals
        $regularDeductions = 0;
        $regularEmployer = 0;
        foreach ($regularRecords as $record) {
            $regularDeductions += ($record->gsis_premium + $record->philhealth + $record->pag_ibig + 
                                 $record->withholding_tax + $record->gsis_mpl + $record->gsis_emergency + 
                                 $record->pag_ibig_mpl + $record->ama_y2k_union + $record->water_bill) * 2;
            $regularEmployer += ($record->gsis_premium + $record->philhealth + $record->pag_ibig) * 2;
        }

        // Calculate casual totals
        $casualDeductions = 0;
        $casualEmployer = 0;
        foreach ($casualRecords as $record) {
            $casualDeductions += ($record->gsis_premium + $record->philhealth + $record->pag_ibig + 
                               $record->withholding_tax + $record->gsis_mpl + $record->gsis_emergency + 
                               $record->pag_ibig_mpl + $record->ama_y2k_union + $record->water_bill) * 2;
            $casualEmployer += ($record->gsis_premium + $record->philhealth + $record->pag_ibig) * 2;
        }

        foreach (['gsis', 'philhealth', 'pagibig', 'bir'] as $agency) {
            if (isset($remittances[$agency])) {
                $totalEmployeeDeductions += $remittances[$agency]['total_employee_share'];
                $totalEmployerPayment += $remittances[$agency]['total_employer_share'];

                if (! empty($remittances[$agency]['employees'])) {
                    $employeesCovered = max($employeesCovered, $remittances[$agency]['employee_count'] ?? 0);
                }
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
                    'deductions' => round($regularDeductions, 2),
                    'employer' => round($regularEmployer, 2),
                    'total' => round($regularDeductions + $regularEmployer, 2),
                ],
                'casual' => [
                    'count' => $casualRecords->count(),
                    'deductions' => round($casualDeductions, 2),
                    'employer' => round($casualEmployer, 2),
                    'total' => round($casualDeductions + $casualEmployer, 2),
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