<?php

// Not needed anymore

// namespace App\Http\Controllers;

// use App\Models\PayrollPeriod;
// use App\Models\PayrollRecord;
// use App\Services\ActivityLogService;
// use Illuminate\Support\Facades\Auth;
// use Inertia\Inertia;
// use Inertia\Response;

// class PayrollHistoryController extends Controller
// {
//     public function __construct(protected ActivityLogService $activityLogService) {}

//     /**
//      * List all processed/closed payroll periods for history browsing.
//      */
//     public function index(): Response
//     {
//         $this->activityLogService->createLog([
//             'user_id' => Auth::id(),
//             'module' => 'payroll',
//             'description' => 'Viewed Payroll History Page',
//         ]);

//         $periods = PayrollPeriod::withCount('payrollRecords')
//             ->withSum('payrollRecords', 'net_pay')
//             ->withSum('payrollRecords', 'basic_pay')
//             ->whereIn('status', ['Processed', 'Closed'])
//             ->orderBy('start_date', 'desc')
//             ->get()
//             ->map(fn (PayrollPeriod $p) => [
//                 'payroll_period_id' => $p->payroll_period_id,
//                 'start_date' => $p->start_date->toDateString(),
//                 'end_date' => $p->end_date->toDateString(),
//                 'cut_off' => $p->cut_off,
//                 'status' => $p->status,
//                 'payroll_records_count' => $p->payroll_records_count,
//                 'total_net_pay' => (float) ($p->payroll_records_sum_net_pay ?? 0),
//                 'total_basic_pay' => (float) ($p->payroll_records_sum_basic_pay ?? 0),
//             ]);

//         return Inertia::render('Payroll/Processing/PayrollHistory/Index', [
//             'periods' => $periods,
//         ]);
//     }

//     /**
//      * Detailed view of all payroll records for a specific period.
//      */
//     public function show(PayrollPeriod $period): Response
//     {
//         $this->activityLogService->createLog([
//             'user_id' => Auth::id(),
//             'module' => 'payroll',
//             'description' => "Viewed Payroll History for Period #{$period->payroll_period_id}",
//         ]);

//         $records = PayrollRecord::with(['employee.basicInfo'])
//             ->where('payroll_period_id', $period->payroll_period_id)
//             ->orderBy('employee_id')
//             ->get()
//             ->map(fn (PayrollRecord $r) => [
//                 'payroll_record_id' => $r->payroll_record_id,
//                 'employee_id' => $r->employee_id,
//                 'employee_name' => $r->employee?->basicInfo
//                     ? $r->employee->basicInfo->last_name.', '.$r->employee->basicInfo->first_name
//                     : '—',
//                 'position' => $r->employee?->basicInfo?->position_title ?? '—',

//                 // Earnings
//                 'basic_pay' => $r->basic_pay,
//                 'pera' => $r->pera,
//                 'rice_allowance' => $r->rice_allowance,
//                 'uniform_allowance' => $r->uniform_allowance,
//                 'gross_pay' => $r->gross_pay, // computed accessor

//                 // Statutory deductions
//                 'gsis_premium' => $r->gsis_premium,
//                 'philhealth' => $r->philhealth,
//                 'pag_ibig' => $r->pag_ibig,
//                 'withholding_tax' => $r->withholding_tax,

//                 // Attendance deductions
//                 'absent_days' => $r->absent_days,
//                 'absent_deduction' => $r->absent_deduction,
//                 'late_minutes' => $r->late_minutes,
//                 'late_deduction' => $r->late_deduction,

//                 // Other deductions
//                 'gsis_mpl' => $r->gsis_mpl,
//                 'gsis_emergency' => $r->gsis_emergency,
//                 'pag_ibig_mpl' => $r->pag_ibig_mpl,
//                 'ama_y2k_union' => $r->ama_y2k_union,
//                 'water_bill' => $r->water_bill,
//                 'total_deductions' => $r->total_deductions, // computed accessor

//                 // Summary
//                 'net_pay' => $r->net_pay,
//                 'floor_check_passed' => $r->floor_check_passed,
//                 'status' => $r->status,
//                 'posted_at' => $r->posted_at?->toDateTimeString(),
//                 'hr_officer_name' => $r->hr_officer_name,
//             ]);

//         return Inertia::render('Payroll/Processing/PayrollHistory/Show', [
//             'period' => [
//                 'payroll_period_id' => $period->payroll_period_id,
//                 'start_date' => $period->start_date->toDateString(),
//                 'end_date' => $period->end_date->toDateString(),
//                 'cut_off' => $period->cut_off,
//                 'status' => $period->status,
//             ],
//             'records' => $records,
//             'summary' => [
//                 'total_employees' => $records->count(),
//                 'total_gross' => $records->sum('gross_pay'),
//                 'total_deductions' => $records->sum('total_deductions'),
//                 'total_net_pay' => $records->sum('net_pay'),
//                 'floor_issues' => $records->where('floor_check_passed', false)->count(),
//             ],
//         ]);
//     }
// }
