<?php

namespace App\Http\Controllers;

use App\Models\Allowance;
use App\Models\Employee;
use App\Models\InternalOrgDeduction;
use App\Models\Loan;
use App\Models\OtherDeduction;
use App\Models\PayrollDeductionSetting;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PayrollProcessingController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService) {}

    /**
     * Display the payroll processing page.
     * Passes payroll periods so the frontend can list/trigger runs.
     */
    public function index(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Payroll Processing Page',
        ]);

        $periods = PayrollPeriod::withCount('payrollRecords')
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(fn (PayrollPeriod $p) => [
                'payroll_period_id' => $p->payroll_period_id,
                'start_date' => $p->start_date->toDateString(),
                'end_date' => $p->end_date->toDateString(),
                'status' => $p->status,
                'cut_off' => $p->cut_off,
                'employee_type' => $p->employee_type,
                'payroll_records_count' => $p->payroll_records_count,
            ]);

        $employmentClassifications = \App\Models\EmploymentClassification::orderBy('name')->get(['id', 'name']);

        $employees = Employee::with(['basicInfo', 'salaryGradeStep', 'item.position'])
            ->where('status', true)
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->employee_id,
                'name' => $e->basicInfo
                    ? $e->basicInfo->last_name.', '.$e->basicInfo->first_name
                    : '—',
                'position' => $e->item?->position?->position_name ?? '—',
                'employment_classification' => $e->employment_classification,
                'salary_grade' => $e->salaryGradeStep?->salary_grade ?? null,
                'salary_step' => $e->salaryGradeStep?->step ?? null,
                'monthly_salary' => (float) ($e->salaryGradeStep?->monthly_salary ?? 0),
                'basic_pay' => round((float) ($e->salaryGradeStep?->monthly_salary ?? 0) / 2, 2),
            ])
            ->sortBy('name')
            ->values();

        return Inertia::render('Payroll/PayrollProcessing/Index', [
            'periods' => $periods,
            'employmentClassifications' => $employmentClassifications,
            'employees' => $employees,
        ]);
    }

    /**
     * Step 3 — Pure in-memory compute. NO database writes whatsoever.
     * Returns JSON consumed by axios on the frontend.
     */
    public function processNew(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'employee_type' => 'nullable|string|max:100',
                'hr_officer_name' => 'nullable|string|max:255',
                'attendance' => 'nullable|array',
                'attendance.*.employee_id' => 'required|integer|exists:employees,employee_id',
                'attendance.*.absent_days' => 'required|integer|min:0|max:31',
                'attendance.*.late_minutes' => 'required|integer|min:0',
            ]);

            $period = new PayrollPeriod;
            $period->start_date = \Carbon\Carbon::parse($validated['start_date']);
            $period->end_date = \Carbon\Carbon::parse($validated['end_date']);

            $attendanceMap = collect($validated['attendance'] ?? [])->keyBy('employee_id');
            $includedIds = $attendanceMap->keys();
            $settings = PayrollDeductionSetting::getSettings();
            $mandatoryAllowances = Allowance::where('mandatory', true)->get();

            $query = Employee::with(['basicInfo', 'salaryGradeStep', 'allowances', 'waterBill'])
                ->where('status', true)
                ->whereIn('employee_id', $includedIds);

            if (! empty($validated['employee_type'])) {
                $query->where('employment_classification', $validated['employee_type']);
            }

            $employees = $query->get();
            $computedRecords = [];
            $errors = [];

            foreach ($employees as $employee) {
                try {
                    $data = $this->computeForEmployee(
                        employee: $employee,
                        period: $period,
                        settings: $settings,
                        mandatoryAllowances: $mandatoryAllowances,
                        attendance: $attendanceMap->get($employee->employee_id, []),
                        hrOfficerName: $validated['hr_officer_name'] ?? null,
                    );

                    $grossPay = $data['basic_pay']
                        + $data['pera']
                        + $data['rice_allowance']
                        + $data['uniform_allowance'];

                    $totalDeductions = $data['gsis_premium']
                        + $data['philhealth']
                        + $data['pag_ibig']
                        + $data['withholding_tax']
                        + $data['absent_deduction']
                        + $data['late_deduction']

                        // Hardcoded addition of the deduction. This is not it and must base on the
                        // Internal Organizations. With regards to government services, it also not
                        // hardcoded here
                        + $data['gsis_mpl']
                        + $data['gsis_emergency']
                        + $data['pag_ibig_mpl']
                        + $data['ama_y2k_union']
                        + $data['water_bill'];

                    $computedRecords[] = array_merge($data, [
                        'employee_id' => $employee->employee_id,
                        'employee_name' => $employee->basicInfo
                            ? $employee->basicInfo->last_name.', '.$employee->basicInfo->first_name
                            : '—',
                        'gross_pay' => round($grossPay, 2),
                        'total_deductions' => round($totalDeductions, 2),
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Employee computation error: '.$e->getMessage(), [
                        'employee_id' => $employee->employee_id,
                        'trace' => $e->getTraceAsString(),
                    ]);
                    $errors[] = "Employee #{$employee->employee_id}: {$e->getMessage()}";
                }
            }

            return response()->json([
                'computedRecords' => $computedRecords,
                'processedPeriodId' => null,
                'processingErrors' => $errors,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation error in processNew:', $e->errors());

            return response()->json([
                'computedRecords' => [],
                'processedPeriodId' => null,
                'processingErrors' => ['Validation error: '.collect($e->errors())->flatten()->first()],
            ]);
        } catch (\Throwable $e) {
            Log::error('processNew fatal error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'computedRecords' => [],
                'processedPeriodId' => null,
                'processingErrors' => ['Server error: '.$e->getMessage()],
            ]);
        }
    }

    public function register(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Payroll Register Page',
        ]);

        return Inertia::render('Payroll/Register/Index');
    }

    public function paySlip(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Pay Slip Generation Page',
        ]);

        return Inertia::render('Payroll/PaySlipGeneration/Index');
    }

    public function allowances(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Allowances Management Page',
        ]);

        return Inertia::render('Payroll/AllowancesManagement/Index');
    }

    public function loanEntry(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Loan Entry Page',
        ]);

        return Inertia::render('Payroll/LoanEntry/Index');
    }

    public function otherDeductions(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Other Deduction Entry Page',
        ]);

        return Inertia::render('Payroll/OtherDeductionEntry/Index');
    }

    public function deductionSettings(): Response
    {
        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => 'Viewed Payroll Deduction Settings Page',
        ]);

        return Inertia::render('Payroll/PayrollDeductionSettings/Index');
    }

    /**
     * Create a new payroll period (must not overlap existing ones).
     */
    public function storePeriod(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $overlap = PayrollPeriod::where(function ($q) use ($validated) {
            $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                ->orWhere(function ($q2) use ($validated) {
                    $q2->where('start_date', '<=', $validated['start_date'])
                        ->where('end_date', '>=', $validated['end_date']);
                });
        })->exists();

        if ($overlap) {
            return back()->withErrors([
                'start_date' => 'This period overlaps with an existing payroll period.',
            ]);
        }

        $period = PayrollPeriod::create($validated);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Created Payroll Period #{$period->payroll_period_id} ({$period->start_date->toDateString()} – {$period->end_date->toDateString()})",
        ]);

        return back()->with('success', 'Payroll period created.');
    }

    /** Delete a period — only allowed when still Open and has no records. */
    public function destroyPeriod(PayrollPeriod $period)
    {
        if ($period->status !== 'Open') {
            return back()->withErrors(['error' => 'Only Open periods can be deleted.']);
        }

        if ($period->payrollRecords()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a period that already has payroll records.']);
        }

        $period->delete();

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Deleted Payroll Period #{$period->payroll_period_id}",
        ]);

        return back()->with('success', 'Payroll period deleted.');
    }

    /**
     * Step 1 — Early duplicate check.
     *
     * Called from the frontend as soon as the user has selected Payroll Month,
     * Cut-off, and Employee Type. Returns immediately so the UI can block
     * progression before the user wastes time on Steps 2–4.
     *
     * A "duplicate" is any non-cancelled PayrollPeriod row that matches
     * start_date + end_date + employee_type exactly.
     *
     * GET /payroll/check-duplicate?start_date=…&end_date=…&employee_type=…
     */
    public function checkDuplicate(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'employee_type' => 'required|string|max:100',
        ]);

        $employeeType = $validated['employee_type'] ?? null;
        $existing = PayrollPeriod::where('start_date', $validated['start_date'])
            ->where('end_date', $validated['end_date'])
            ->when(
                ! is_null($employeeType),
                fn ($q) => $q->where('employee_type', $employeeType),
                fn ($q) => $q->whereNull('employee_type'),
            )
            ->where('status', '!=', 'cancelled')
            ->first(['payroll_period_id', 'start_date', 'end_date', 'employee_type', 'status']);

        return response()->json([
            'duplicate' => $existing !== null,
            'period' => $existing ? [
                'payroll_period_id' => $existing->payroll_period_id,
                'start_date' => $existing->start_date->toDateString(),
                'end_date' => $existing->end_date->toDateString(),
                'employee_type' => $existing->employee_type,
                'status' => $existing->status,
            ] : null,
        ]);
    }

    /**
     * Returns attendance-derived absent days and late minutes for each active
     * employee within the payroll date range.
     *
     * Working days  = Mon–Fri, excluding public holidays in the holidays table.
     * Absent        = no attendance_record for the day, OR record has null
     *                 recognition_morning_in_id (employee did not check in).
     * Late minutes  = minutes after 08:00 AM when morning check-in > 08:00 AM.
     *
     * TODO: Working days and hours are depending on what the Employee's set schedule, not fixed 8:00AM - 5:00PM
     * Please consider this...
     * There is also afternoon...
     */
    public function attendanceSummary(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'employee_type' => 'nullable|string|max:100',
            ]);

            $start = Carbon::parse($validated['start_date'])->startOfDay();
            $end = Carbon::parse($validated['end_date'])->endOfDay();

            try {
                $holidays = DB::table('holidays')
                    ->whereBetween('holiday_date', [$start->toDateString(), $end->toDateString()])
                    ->pluck('holiday_date')
                    ->map(fn ($d) => Carbon::parse($d)->toDateString())
                    ->flip()
                    ->all();
            } catch (\Exception $e) {
                Log::warning('Holidays table query failed: '.$e->getMessage());
                $holidays = [];
            }

            $workingDates = [];
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $dateStr = $cursor->toDateString();
                if (! $cursor->isWeekend() && ! isset($holidays[$dateStr])) {
                    $workingDates[] = $dateStr;
                }
                $cursor->addDay();
            }

            if (empty($workingDates)) {
                return response()->json([]);
            }

            $empQuery = Employee::where('status', true);
            if (! empty($validated['employee_type'])) {
                $empQuery->where('employment_classification', $validated['employee_type']);
            }
            $employeeIds = $empQuery->pluck('employee_id')->all();

            if (empty($employeeIds)) {
                return response()->json([]);
            }

            try {
                $rows = DB::table('attendance_records as ar')
                    ->leftJoin(
                        'recognition_logs as rl',
                        'ar.recognition_morning_in_id',
                        '=',
                        'rl.recognition_log_id'
                    )
                    ->whereIn('ar.employee_id', $employeeIds)
                    ->whereBetween(
                        DB::raw('DATE(ar.created_at)'),
                        [$start->toDateString(), $end->toDateString()]
                    )
                    ->select(
                        'ar.employee_id',
                        'ar.recognition_morning_in_id',
                        DB::raw('DATE(ar.created_at) as record_date'),
                        'rl.created_at as morning_in_at',
                        // Compute late minutes directly in MySQL.
                        // CONVERT_TZ(x, @@session.time_zone, '+08:00') converts the raw
                        // check-in time from whatever MySQL's session timezone is (UTC,
                        // local, etc.) to Manila (+08:00), then we diff against 08:00 AM
                        // of that day in Manila time. This is timezone-proof.

                        // Unnecessary???
                        DB::raw("GREATEST(0, TIMESTAMPDIFF(MINUTE, DATE_FORMAT(CONVERT_TZ(rl.created_at, @@session.time_zone, '+08:00'), '%Y-%m-%d 08:00:00'), CONVERT_TZ(rl.created_at, @@session.time_zone, '+08:00'))) as late_mins_sql")
                    )
                    ->get()
                    ->groupBy('employee_id')
                    ->map(fn ($group) => $group->keyBy('record_date'));
            } catch (\Exception $e) {
                Log::error('Attendance records query failed: '.$e->getMessage());

                return response()->json([
                    'error' => 'Attendance system tables not found or inaccessible. Please check your database schema.',
                    'message' => 'Database error: '.$e->getMessage(),
                ], 500);
            }

            // TODO: base this from the Employee Work Schedule (Not dynamic. Please make it dynamic)
            $startHour = 8;
            $startMinute = 0;

            $result = [];
            foreach ($employeeIds as $empId) {
                $empRecords = $rows->get($empId, collect());

                if ($empRecords->isEmpty()) {
                    $result[] = [
                        'employee_id' => $empId,
                        'absent_days' => 0,
                        'late_minutes' => 0,
                    ];

                    continue;
                }

                $absentDays = 0;
                $lateMinutes = 0;

                foreach ($workingDates as $date) {
                    if (! $empRecords->has($date)) {
                        $absentDays++;

                        continue;
                    }

                    $record = $empRecords->get($date);

                    if (is_null($record->recognition_morning_in_id)) {
                        $absentDays++;

                        continue;
                    }

                    // late_mins_sql is pre-computed in MySQL using CONVERT_TZ to Manila
                    // time, so it is correct regardless of the DB/PHP timezone settings.
                    // It is NULL when the left-join found no recognition_log (morning_in_at
                    // is also null), in which case (int) null === 0 — safe to add directly.
                    $lateMinutes += max(0, (int) ($record->late_mins_sql ?? 0));
                }

                $result[] = [
                    'employee_id' => $empId,
                    'absent_days' => $absentDays,
                    'late_minutes' => max(0, $lateMinutes),
                ];
            }

            return response()->json($result);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Attendance summary validation error:', $e->errors());

            return response()->json([
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('attendanceSummary error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to fetch attendance data',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk-compute payroll for ALL active employees in a period.
     *
     * Request body:
     * {
     *   "hr_officer_name": "Juan dela Cruz",
     *   "attendance": [
     *     { "employee_id": 1, "absent_days": 0, "late_minutes": 0 },
     *     ...
     *   ]
     * }
     *
     * Government deductions (GSIS, PhilHealth, Pag-IBIG, Withholding Tax)
     * are split equally between both cut-offs for semi-monthly payroll.
     */
    public function process(Request $request, PayrollPeriod $period)
    {
        if ($period->status === 'Processed') {
            return back()->withErrors(['error' => 'This period has already been processed. Unlock it first to reprocess.']);
        }

        $validated = $request->validate([
            'hr_officer_name' => 'nullable|string|max:255',
            'attendance' => 'nullable|array',
            'attendance.*.employee_id' => 'required|integer|exists:employees,employee_id',
            'attendance.*.absent_days' => 'required|integer|min:0|max:31',
            'attendance.*.late_minutes' => 'required|integer|min:0',
        ]);
        $attendanceMap = collect($validated['attendance'] ?? [])
            ->keyBy('employee_id');
        $settings = PayrollDeductionSetting::getSettings();
        $mandatoryAllowances = Allowance::where('mandatory', true)->get();
        $employees = Employee::with([
            'basicInfo',
            'salaryGradeStep',
            'allowances',
            'waterBill',
        ])
            ->where('status', true)
            ->get();

        $processed = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($employees as $employee) {
                try {
                    $data = $this->computeForEmployee(
                        employee: $employee,
                        period: $period,
                        settings: $settings,
                        mandatoryAllowances: $mandatoryAllowances,
                        attendance: $attendanceMap->get($employee->employee_id, []),
                        hrOfficerName: $validated['hr_officer_name'] ?? null,
                    );

                    PayrollRecord::updateOrCreate(
                        [
                            'employee_id' => $employee->employee_id,
                            'payroll_period_id' => $period->payroll_period_id,
                        ],
                        $data
                    );

                    if ($period->is_second_cut_off) {
                        $this->applyLoanDeductions($employee->employee_id, $period);
                    }

                    $processed[] = $employee->employee_id;
                } catch (\Throwable $e) {
                    Log::error('Employee processing error: '.$e->getMessage(), [
                        'employee_id' => $employee->employee_id,
                        'trace' => $e->getTraceAsString(),
                    ]);
                    $errors[] = "Employee #{$employee->employee_id}: {$e->getMessage()}";
                }
            }

            $period->update(['status' => 'Processed']);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Payroll processing failed: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'error' => 'Payroll processing failed: '.$e->getMessage(),
            ]);
        }

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Processed Payroll Period #{$period->payroll_period_id} — {$period->start_date->toDateString()} to {$period->end_date->toDateString()} (".count($processed).' employees)',
        ]);

        return back()->with([
            'success' => count($processed).' employees processed successfully.',
            'processing_errors' => $errors,
        ]);
    }

    /**
     * Post all draft records in a processed period (Draft → Posted).
     */
    public function postPeriod(PayrollPeriod $period)
    {
        if ($period->status !== 'Processed') {
            return back()->withErrors(['error' => 'Only Processed periods can be posted.']);
        }

        $updated = PayrollRecord::where('payroll_period_id', $period->payroll_period_id)
            ->where('status', 'draft')
            ->update([
                'status' => 'posted',
                'posted_at' => now(),
            ]);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Posted Payroll Period #{$period->payroll_period_id} ({$updated} records)",
        ]);

        return back()->with('success', "Payroll posted — {$updated} records updated.");
    }

    /**
     * Lock all posted records in a period (Posted → Locked).
     * Also closes the payroll period.
     */
    public function lockPeriod(PayrollPeriod $period)
    {
        $hasUnposted = PayrollRecord::where('payroll_period_id', $period->payroll_period_id)
            ->where('status', 'draft')
            ->exists();

        if ($hasUnposted) {
            return back()->withErrors(['error' => 'All records must be posted before locking.']);
        }

        $updated = PayrollRecord::where('payroll_period_id', $period->payroll_period_id)
            ->where('status', 'posted')
            ->update(['status' => 'locked']);

        $period->update(['status' => 'Closed']);

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Locked Payroll Period #{$period->payroll_period_id} ({$updated} records)",
        ]);

        return back()->with('success', 'Payroll locked — period is now closed.');
    }

    /**
     * Compute all payroll figures for a single employee.
     *
     * Government deductions (GSIS, PhilHealth, Pag-IBIG, Withholding Tax)
     * are now split equally between both cut-offs for semi-monthly payroll.
     *
     * Floor-rule logic (per deduction settings priority order):
     *   1. Gov't contributions  — never cut
     *   2. Gov't loans          — cut if net would fall below minimum_take_home_pay
     *   3. Internal org loans   — cut first
     *   4. Org dues/premiums    — cut first
     *   5. Miscellaneous        — cut first
     */
    private function computeForEmployee(
        Employee $employee,
        PayrollPeriod $period,
        PayrollDeductionSetting $settings,
        $mandatoryAllowances,
        array|object $attendance,
        ?string $hrOfficerName,
    ): array {
        $attendance = (array) $attendance;
        $isSecondCutOff = $period->is_second_cut_off;

        // ── 1. Basic Pay ──────────────────────────────────────────────────────
        $monthlyBasic = (float) ($employee->salaryGradeStep?->monthly_salary ?? 0);
        $basicPay = round($monthlyBasic / 2, 2); // Semi-monthly

        // ── 2. Allowances ─────────────────────────────────────────────────────
        [$pera, $riceAllowance, $uniformAllowance, $taxableAllowancesMonthly]
            = $this->resolveAllowances($employee, $mandatoryAllowances);

        // ── 3. Gross Pay ──────────────────────────────────────────────────────
        $gross = $basicPay + $pera + $riceAllowance + $uniformAllowance;

        // ── 4. Absent / Late (applies to both cut-offs) ───────────────────────
        $absentDays = (int) ($attendance['absent_days'] ?? 0);
        $lateMinutes = (int) ($attendance['late_minutes'] ?? 0);
        $dailyRate = $settings->working_days_divisor > 0
            ? round($monthlyBasic / $settings->working_days_divisor, 6)
            : 0.0;
        $minuteRate = $dailyRate > 0
            ? round($dailyRate / (8 * 60), 8)
            : 0.0;
        $absentDeduction = round($absentDays * $dailyRate, 2);
        $lateDeduction = round($lateMinutes * $minuteRate, 2);

        // ── 5. Statutory Deductions (NOW SPLIT EQUALLY BETWEEN BOTH CUT-OFFS) ─
        // Monthly calculations (full month)
        $monthlyGsisPremium = round($monthlyBasic * ($settings->gsis_employee_rate / 100), 2);

        // PhilHealth: 5% of Basic Monthly Salary (split equally, 2.5% each)
        $monthlyPhilhealthCalc = round($monthlyBasic * ($settings->philhealth_rate / 100), 2);
        $monthlyPhilhealth = max(250.0, min(2500.0, $monthlyPhilhealthCalc));

        // Pag-IBIG: 2% of MBS, capped at pagibig_monthly setting
        if ($monthlyBasic <= 1500) {
            $monthlyPagIbig = round($monthlyBasic * 0.01, 2);
        } else {
            $monthlyPagIbig = min($settings->pagibig_monthly, round($monthlyBasic * 0.02, 2));
        }

        // Withholding Tax (monthly) - using monthly values
        $monthlyWithholdingTax = $this->computeWithholdingTax(
            monthlyBasic: $monthlyBasic,
            taxableAllowancesMonthly: $taxableAllowancesMonthly,
            gsisPremium: $monthlyGsisPremium,
            philhealth: $monthlyPhilhealth,
            pagIbig: $monthlyPagIbig,
        );

        // Split monthly deductions equally between cut-offs (for BOTH 1st and 2nd cut-off)
        $gsisPremium = round($monthlyGsisPremium / 2, 2);
        $philhealth = round($monthlyPhilhealth / 2, 2);
        $pagIbig = round($monthlyPagIbig / 2, 2);
        $withholdingTax = round($monthlyWithholdingTax / 2, 2);

        // ── 6. Loans and Other Deductions (2nd cut-off only) ──────────────────
        $gsisMpl = 0.0;
        $gsisEmergency = 0.0;
        $pagIbigMpl = 0.0;
        $amaY2kUnion = 0.0;
        $waterBill = 0.0;
        $internalOrgItems = [];
        $otherDeductionItems = [];
        $internalOrgTotal = 0.0;
        $floorCheckPassed = true;

        if ($isSecondCutOff) {
            $periodYearMonth = Carbon::parse($period->start_date)->format('Y-m');

            $loans = Loan::where('employee_id', $employee->employee_id)
                ->where('status', 'Active')
                ->where('start_period', '<=', $periodYearMonth)
                ->where('end_period', '>=', $periodYearMonth)
                ->get();

            foreach ($loans as $loan) {
                $sourceLower = strtolower($loan->source);
                $typeLower = strtolower($loan->loan_type);

                if ($sourceLower === 'gsis') {
                    if (str_contains($typeLower, 'emergency')) {
                        $gsisEmergency += (float) $loan->semi_monthly_deduction;
                    } else {
                        $gsisMpl += (float) $loan->semi_monthly_deduction;
                    }
                } elseif (in_array($sourceLower, ['pag-ibig', 'pagibig', 'hdmf'])) {
                    $pagIbigMpl += (float) $loan->semi_monthly_deduction;
                }
            }

            $otherDeductions = OtherDeduction::where('employee_id', $employee->employee_id)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->get();

            foreach ($otherDeductions as $deduction) {
                $amt = (float) $deduction->amount;
                if ($deduction->isWaterBill()) {
                    $waterBill += $amt;
                    $type = 'water_bill';
                } else {
                    // NS & ND (COA) and Miscellaneous roll into ama_y2k_union
                    $amaY2kUnion += $amt;
                    $type = 'other';
                }
                $otherDeductionItems[] = [
                    'id' => $deduction->id,
                    'category' => $deduction->category,
                    'description' => $deduction->description,
                    'amount' => $amt,
                    'type' => $type,
                ];
            }

            // ── Internal org deductions (Union, Cooperative, Association) ────
            $internalOrgDeductions = InternalOrgDeduction::with('internalOrganization')
                ->where('employee_id', $employee->employee_id)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->get();

            foreach ($internalOrgDeductions as $deduction) {
                $amt = (float) $deduction->amount;
                $internalOrgItems[] = [
                    'id' => $deduction->id,
                    'org_name' => $deduction->internalOrganization?->name ?? '—',
                    'description' => $deduction->description,
                    'amount' => $amt,
                ];
                $internalOrgTotal += $amt;
            }
            $amaY2kUnion += $internalOrgTotal;

            // ── Floor-rule flag (informational only — no auto-cutting) ────────
            $rawNetPay = $gross - $absentDeduction - $lateDeduction
                - $gsisPremium - $philhealth - $pagIbig - $withholdingTax
                - $gsisMpl - $gsisEmergency - $pagIbigMpl
                - $amaY2kUnion - $waterBill;
            $floorCheckPassed = $rawNetPay >= $settings->minimum_take_home_pay;
        }

        // ── 7. Net Pay ────────────────────────────────────────────────────────
        $totalDeductions = $gsisPremium + $philhealth + $pagIbig + $withholdingTax
            + $absentDeduction + $lateDeduction
            + $gsisMpl + $gsisEmergency + $pagIbigMpl
            + $amaY2kUnion + $waterBill;

        $netPay = round($gross - $totalDeductions, 2);

        return [
            'basic_pay' => $basicPay,
            'pera' => $pera,
            'rice_allowance' => $riceAllowance,
            'uniform_allowance' => $uniformAllowance,
            'gsis_premium' => $gsisPremium,
            'philhealth' => $philhealth,
            'pag_ibig' => $pagIbig,
            'withholding_tax' => $withholdingTax,
            'absent_days' => $absentDays,
            'absent_deduction' => $absentDeduction,
            'late_minutes' => $lateMinutes,
            'late_deduction' => $lateDeduction,
            'gsis_mpl' => round($gsisMpl, 2),
            'gsis_emergency' => round($gsisEmergency, 2),
            'pag_ibig_mpl' => round($pagIbigMpl, 2),
            'ama_y2k_union' => round($amaY2kUnion, 2),
            'water_bill' => round($waterBill, 2),
            'internal_org_deductions' => round($internalOrgTotal, 2),
            'other_deductions' => round($waterBill + ($amaY2kUnion - $internalOrgTotal), 2),
            // Itemised breakdowns — consumed by Step 4 to show per-line detail
            'internal_org_items' => $internalOrgItems ?? [],
            'other_deduction_items' => $otherDeductionItems ?? [],
            'net_pay' => $netPay,
            'floor_check_passed' => $floorCheckPassed,
            'status' => 'draft',
            'hr_officer_name' => $hrOfficerName,
        ];
    }

    /**
     * Resolve allowance amounts for an employee.
     *
     * Returns: [pera, riceAllowance, uniformAllowance, taxableAllowancesMonthly]
     *
     * Matching is done by allowance name keywords so allowance names
     * in the DB should include "PERA", "Rice", "Uniform" (case-insensitive).
     */
    private function resolveAllowances(
        Employee $employee,
        $mandatoryAllowances,
    ): array {
        $pera = 0.0;
        $riceAllowance = 0.0;
        $uniformAllowance = 0.0;
        $taxableAllowancesMonthly = 0.0;
        $classification = $employee->employment_classification;

        foreach ($mandatoryAllowances as $allowance) {
            if (! $allowance->isApplicableTo($classification)) {
                continue;
            }

            $semiAmount = round($allowance->monthly_salary / 2, 2);
            $nameLower = strtolower($allowance->name);

            if (str_contains($nameLower, 'pera')) {
                $pera = $semiAmount;
            } elseif (str_contains($nameLower, 'rice')) {
                $riceAllowance = $semiAmount;
            } elseif (str_contains($nameLower, 'uniform') || str_contains($nameLower, 'clothing')) {
                $uniformAllowance = $semiAmount;
            }

            if ($allowance->taxable) {
                $taxableAllowancesMonthly += $allowance->monthly_salary;
            }
        }

        // Employee-specific (non-mandatory) allowances assigned via EmployeeAllowance
        foreach ($employee->allowances as $empAllowance) {
            /** @var Allowance|null $def */
            $def = $empAllowance->allowance ?? null;
            if (! $def) {
                continue;
            }

            if ($def->taxable) {
                $taxableAllowancesMonthly += $def->monthly_salary;
            }
        }

        return [$pera, $riceAllowance, $uniformAllowance, $taxableAllowancesMonthly];
    }

    /**
     * BIR Withholding Tax — TRAIN Law (RA 10963, effective January 2023)
     * Reference: RR No. 8-2018 as amended by RR No. 2-2023
     *
     * Method: Semi-monthly compensation tax table
     *
     * Semi-monthly taxable compensation =
     *   (Monthly Basic + Taxable Allowances − GSIS − PhilHealth − Pag-IBIG) ÷ 2
     *
     * Semi-monthly TRAIN brackets (Annual ÷ 24):
     *   ≤ 10,416.67                : 0%
     *   10,416.68 – 16,666.67      : 15% × (excess over 10,416.67)
     *   16,666.68 – 33,333.33      : 937.50 + 20% × (excess over 16,666.67)
     *   33,333.34 – 83,333.33      : 4,270.83 + 25% × (excess over 33,333.33)
     *   83,333.34 – 333,333.33     : 16,770.83 + 30% × (excess over 83,333.33)
     *   > 333,333.33               : 91,770.83 + 35% × (excess over 333,333.33)
     */
    private function computeWithholdingTax(
        float $monthlyBasic,
        float $taxableAllowancesMonthly,
        float $gsisPremium,
        float $philhealth,
        float $pagIbig,
    ): float {
        // Monthly taxable compensation after pre-tax deductions
        $monthlyTaxable = $monthlyBasic
            + $taxableAllowancesMonthly
            - $gsisPremium
            - $philhealth
            - $pagIbig;

        if ($monthlyTaxable <= 0) {
            return 0.0;
        }

        // Semi-monthly taxable (÷ 2)
        $smt = $monthlyTaxable / 2;

        $tax = match (true) {
            $smt <= 10416.67 => 0.0,
            $smt <= 16666.67 => ($smt - 10416.67) * 0.15,
            $smt <= 33333.33 => 937.50 + ($smt - 16666.67) * 0.20,
            $smt <= 83333.33 => 4270.83 + ($smt - 33333.33) * 0.25,
            $smt <= 333333.33 => 16770.83 + ($smt - 83333.33) * 0.30,
            default => 91770.83 + ($smt - 333333.33) * 0.35,
        };

        return round($tax, 2);
    }

    /**
     * Apply floor-rule to a group of deductions.
     *
     * Each deduction in the group is applied only if the running balance
     * remains at or above the minimum take-home pay.
     * If it would fall below, that deduction is zeroed out (cut).
     *
     * Returns: [...adjusted deductions, updated running balance, all_passed, total_cut]
     *
     * TODO: BASE THIS ON THE FLOOR RULE UNDE PAYROLL DEDUCTION SETTINGS.
     */
    private function applyFloorRule(
        float $runningBalance,
        float $minimumTakeHome,
        array $deductions,
    ): array {
        $allPassed = true;
        $adjusted = [];
        $totalCut = 0.0;

        foreach ($deductions as $amount) {
            if (($runningBalance - $amount) >= $minimumTakeHome) {
                $adjusted[] = $amount;
                $runningBalance -= $amount;
            } else {
                $adjusted[] = 0.0; // Cut
                $totalCut += $amount;
                $allPassed = false;
            }
        }

        return [...$adjusted, $runningBalance, $allPassed, $totalCut];
    }

    /**
     * Reduce loan balances after a successful 2nd cut-off payroll run.
     * Marks loans as Completed when balance reaches zero.
     */
    private function applyLoanDeductions(int $employeeId, PayrollPeriod $period): void
    {
        $periodYearMonth = Carbon::parse($period->start_date)->format('Y-m');

        Loan::where('employee_id', $employeeId)
            ->where('status', 'Active')
            ->where('start_period', '<=', $periodYearMonth)
            ->where('end_period', '>=', $periodYearMonth)
            ->each(fn (Loan $loan) => $loan->applyDeduction());
    }

    /**
     * Same as applyLoanDeductions but skips loan types the HR officer waived.
     * Waived loan balances are left untouched so they roll into the next period.
     */
    private function applyLoanDeductionsFiltered(int $employeeId, PayrollPeriod $period, array $waived): void
    {
        $periodYearMonth = Carbon::parse($period->start_date)->format('Y-m');

        Loan::where('employee_id', $employeeId)
            ->where('status', 'Active')
            ->where('start_period', '<=', $periodYearMonth)
            ->where('end_period', '>=', $periodYearMonth)
            ->get()
            ->each(function (Loan $loan) use ($waived) {
                $sourceLower = strtolower($loan->source);
                $typeLower = strtolower($loan->loan_type);

                if ($sourceLower === 'gsis') {
                    if (str_contains($typeLower, 'emergency') && in_array('gsis_emergency', $waived)) {
                        return;
                    }
                    if (! str_contains($typeLower, 'emergency') && in_array('gsis_mpl', $waived)) {
                        return;
                    }
                } elseif (in_array($sourceLower, ['pag-ibig', 'pagibig', 'hdmf'])) {
                    if (in_array('pag_ibig_mpl', $waived)) {
                        return;
                    }
                }

                $loan->applyDeduction();
            });
    }

    /**
     * Extend the period_end of waived OtherDeduction / InternalOrgDeduction records
     * so they automatically appear in the next payroll period.
     *
     * Supports two modes:
     *   Group waiver  — $waived contains the column key  → carry forward ALL matching rows
     *   Item waiver   — $waivedItemIds lists specific IDs → carry forward only those rows
     */
    private function carryForwardWaivedDeductions(int $employeeId, PayrollPeriod $period, array $waived, array $waivedItemIds = []): void
    {
        $orgGroupWaived = in_array('ama_y2k_union', $waived);
        $waterGroupWaived = in_array('water_bill', $waived);

        // Nothing to carry forward
        if (! $orgGroupWaived && ! $waterGroupWaived && empty($waivedItemIds)) {
            return;
        }

        // Approximate next period end — half-month forward from current end
        $nextEnd = Carbon::parse($period->end_date)->addDays(16);

        // ── OtherDeductions (Water Bill, NS & ND, Misc) ───────────────────────
        if ($orgGroupWaived || $waterGroupWaived || ! empty($waivedItemIds)) {
            OtherDeduction::where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->get()
                ->each(function (OtherDeduction $deduction) use (
                    $orgGroupWaived, $waterGroupWaived, $waivedItemIds, $nextEnd
                ) {
                    $shouldCarry = false;

                    if ($waterGroupWaived && $deduction->isWaterBill()) {
                        $shouldCarry = true;
                    } elseif ($orgGroupWaived && ($deduction->isNsNd() || $deduction->isMiscellaneous())) {
                        $shouldCarry = true;
                    } elseif (! empty($waivedItemIds) && in_array($deduction->id, $waivedItemIds)) {
                        $shouldCarry = true;
                    }

                    if ($shouldCarry) {
                        $deduction->update(['period_end' => $nextEnd]);
                    }
                });
        }

        // ── InternalOrgDeductions ─────────────────────────────────────────────
        if ($orgGroupWaived) {
            // Group waiver — carry forward all org deductions for this employee
            InternalOrgDeduction::where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->each(fn (InternalOrgDeduction $d) => $d->update(['period_end' => $nextEnd]));
        } elseif (! empty($waivedItemIds)) {
            // Individual item waivers — carry forward only the specified rows
            InternalOrgDeduction::whereIn('id', $waivedItemIds)
                ->where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->each(fn (InternalOrgDeduction $d) => $d->update(['period_end' => $nextEnd]));
        }
    }

    /**
     * Step 5 — Finalize payroll with HR floor-check adjustments.
     * Creates the PayrollPeriod and PayrollRecord rows, applies any
     * deduction waivers the HR officer chose in Step 4, and carries
     * waived amounts forward to the next period automatically.
     *
     * POST /payroll/finalize
     */
    public function finalizePayroll(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Log the incoming request for debugging
            Log::info('Finalize payroll request received', [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'employee_type' => $request->employee_type,
                'records_count' => count($request->records ?? []),
            ]);

            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'employee_type' => 'nullable|string|max:100',
                'hr_officer_name' => 'nullable|string|max:255',
                'records' => 'required|array|min:1',
                'records.*.employee_id' => 'required|integer|exists:employees,employee_id',
                'records.*.basic_pay' => 'required|numeric',
                'records.*.pera' => 'required|numeric',
                'records.*.rice_allowance' => 'required|numeric',
                'records.*.uniform_allowance' => 'required|numeric',
                'records.*.gsis_premium' => 'required|numeric',
                'records.*.philhealth' => 'required|numeric',
                'records.*.pag_ibig' => 'required|numeric',
                'records.*.withholding_tax' => 'required|numeric',
                'records.*.absent_days' => 'required|integer',
                'records.*.absent_deduction' => 'required|numeric',
                'records.*.late_minutes' => 'required|integer',
                'records.*.late_deduction' => 'required|numeric',
                'records.*.gsis_mpl' => 'required|numeric',
                'records.*.gsis_emergency' => 'required|numeric',
                'records.*.pag_ibig_mpl' => 'required|numeric',
                'records.*.ama_y2k_union' => 'required|numeric',
                'records.*.water_bill' => 'required|numeric',
                'records.*.waived' => 'nullable|array',
                'records.*.waived.*' => 'string|in:gsis_mpl,gsis_emergency,pag_ibig_mpl,ama_y2k_union,water_bill',
                'records.*.waived_item_ids' => 'nullable|array',
                'records.*.waived_item_ids.*' => 'integer|min:1',
            ]);

            // ── Duplicate guard ────────────────────────────────────────────────
            // The correct rule: (start_date + end_date + employee_type) must be
            // unique among non-cancelled periods. Different types (Regular,
            // Casual, Job Order) are processed independently and are NOT
            // duplicates of each other.
            //
            // IMPORTANT: use when()/whereNull() for employee_type — SQL treats
            // `WHERE employee_type = NULL` as never-true, so a plain where()
            // would silently allow every duplicate when employee_type is null.
            $employeeType = $validated['employee_type'] ?? null;
            $duplicate = PayrollPeriod::where('start_date', $validated['start_date'])
                ->where('end_date', $validated['end_date'])
                ->when(
                    ! is_null($employeeType),
                    fn ($q) => $q->where('employee_type', $employeeType),
                    fn ($q) => $q->whereNull('employee_type'),
                )
                ->where('status', '!=', 'cancelled')
                ->exists();

            if ($duplicate) {
                Log::warning('Duplicate payroll period detected in finalizePayroll', [
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'employee_type' => $validated['employee_type'],
                ]);

                return response()->json([
                    'error' => 'Payroll already exists for this Employment Type within the selected Payroll Period. '
                             .'Please select a different Employment Type or review the existing payroll record.',
                ], 422);
            }

            $settings = PayrollDeductionSetting::getSettings();
            $errors = [];

            DB::beginTransaction();

            try {
                $period = PayrollPeriod::create([
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                    'status' => 'Processed',
                    'employee_type' => $validated['employee_type'] ?? null,
                ]);

                Log::info('Payroll period created successfully', [
                    'period_id' => $period->payroll_period_id,
                    'start_date' => $period->start_date,
                    'end_date' => $period->end_date,
                ]);

                $isSecondCutOff = $period->is_second_cut_off;

                foreach ($validated['records'] as $index => $rec) {
                    try {
                        $waived = $rec['waived'] ?? [];
                        $waivedItemIds = array_map('intval', $rec['waived_item_ids'] ?? []);

                        // ── Gov't loans — group-waived only ───────────────────────
                        $gsisMpl = in_array('gsis_mpl', $waived) ? 0.0 : (float) $rec['gsis_mpl'];
                        $gsisEmergency = in_array('gsis_emergency', $waived) ? 0.0 : (float) $rec['gsis_emergency'];
                        $pagIbigMpl = in_array('pag_ibig_mpl', $waived) ? 0.0 : (float) $rec['pag_ibig_mpl'];

                        // ── Org Loans & Dues — group waiver OR individual item waivers ──
                        if (in_array('ama_y2k_union', $waived)) {
                            // HR waived the entire bucket
                            $amaY2kUnion = 0.0;
                        } elseif (! empty($waivedItemIds)) {
                            // Subtract only the individually waived items
                            $waivedInternalAmt = InternalOrgDeduction::whereIn('id', $waivedItemIds)
                                ->where('employee_id', $rec['employee_id'])
                                ->sum('amount');
                            $waivedNsMiscAmt = OtherDeduction::whereIn('id', $waivedItemIds)
                                ->where('employee_id', $rec['employee_id'])
                                ->whereIn('category', [OtherDeduction::CATEGORY_NS_ND, OtherDeduction::CATEGORY_MISCELLANEOUS])
                                ->sum('amount');
                            $amaY2kUnion = max(0.0, (float) $rec['ama_y2k_union'] - (float) $waivedInternalAmt - (float) $waivedNsMiscAmt);
                        } else {
                            $amaY2kUnion = (float) $rec['ama_y2k_union'];
                        }

                        // ── Water Bill — group waiver OR individual item waivers ───
                        if (in_array('water_bill', $waived)) {
                            $waterBill = 0.0;
                        } elseif (! empty($waivedItemIds)) {
                            $waivedWaterAmt = OtherDeduction::whereIn('id', $waivedItemIds)
                                ->where('employee_id', $rec['employee_id'])
                                ->where('category', OtherDeduction::CATEGORY_WATER_BILL)
                                ->sum('amount');
                            $waterBill = max(0.0, (float) $rec['water_bill'] - (float) $waivedWaterAmt);
                        } else {
                            $waterBill = (float) $rec['water_bill'];
                        }

                        $gross = (float) $rec['basic_pay']
                               + (float) $rec['pera']
                               + (float) $rec['rice_allowance']
                               + (float) $rec['uniform_allowance'];

                        $totalDeductions = (float) $rec['gsis_premium']
                            + (float) $rec['philhealth']
                            + (float) $rec['pag_ibig']
                            + (float) $rec['withholding_tax']
                            + (float) $rec['absent_deduction']
                            + (float) $rec['late_deduction']
                            + $gsisMpl + $gsisEmergency + $pagIbigMpl
                            + $amaY2kUnion + $waterBill;

                        $netPay = round($gross - $totalDeductions, 2);
                        $floorCheckPassed = $netPay >= $settings->minimum_take_home_pay;

                        PayrollRecord::updateOrCreate(
                            [
                                'employee_id' => $rec['employee_id'],
                                'payroll_period_id' => $period->payroll_period_id,
                            ],
                            [
                                'basic_pay' => $rec['basic_pay'],
                                'pera' => $rec['pera'],
                                'rice_allowance' => $rec['rice_allowance'],
                                'uniform_allowance' => $rec['uniform_allowance'],
                                'gsis_premium' => $rec['gsis_premium'],
                                'philhealth' => $rec['philhealth'],
                                'pag_ibig' => $rec['pag_ibig'],
                                'withholding_tax' => $rec['withholding_tax'],
                                'absent_days' => $rec['absent_days'],
                                'absent_deduction' => $rec['absent_deduction'],
                                'late_minutes' => $rec['late_minutes'],
                                'late_deduction' => $rec['late_deduction'],
                                'gsis_mpl' => $gsisMpl,
                                'gsis_emergency' => $gsisEmergency,
                                'pag_ibig_mpl' => $pagIbigMpl,
                                'ama_y2k_union' => $amaY2kUnion,
                                'water_bill' => $waterBill,
                                'net_pay' => $netPay,
                                'floor_check_passed' => $floorCheckPassed,
                                'hr_officer_name' => $validated['hr_officer_name'] ?? null,
                                'status' => 'draft',
                            ]
                        );

                        if ($isSecondCutOff) {
                            $this->applyLoanDeductionsFiltered($rec['employee_id'], $period, $waived);
                        }

                        if (! empty($waived) || ! empty($waivedItemIds)) {
                            $this->carryForwardWaivedDeductions($rec['employee_id'], $period, $waived, $waivedItemIds);
                        }
                    } catch (\Throwable $e) {
                        Log::error('Error processing employee record in finalize', [
                            'employee_id' => $rec['employee_id'],
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                        ]);
                        $errors[] = "Employee #{$rec['employee_id']}: {$e->getMessage()}";
                    }
                }

                DB::commit();

                $this->activityLogService->createLog([
                    'user_id' => Auth::id(),
                    'module' => 'payroll',
                    'description' => "Finalized Payroll Period #{$period->payroll_period_id} ({$period->start_date->toDateString()} – {$period->end_date->toDateString()}) — ".count($validated['records']).' employees',
                ]);

                Log::info('Payroll finalized successfully', [
                    'period_id' => $period->payroll_period_id,
                    'records_count' => count($validated['records']),
                ]);

                return response()->json([
                    'processedPeriodId' => $period->payroll_period_id,
                    'processingErrors' => $errors,
                ]);
            } catch (\Throwable $e) {
                DB::rollBack();
                Log::error('Database transaction failed in finalize', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed in finalizePayroll', $e->errors());

            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Please check all required fields.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Finalization failed: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Finalization failed: '.$e->getMessage(),
            ], 500);
        }
    }
}
