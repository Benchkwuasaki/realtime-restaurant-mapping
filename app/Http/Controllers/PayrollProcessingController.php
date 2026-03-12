<?php

namespace App\Http\Controllers;

use App\Models\Allowance;
use App\Models\Employee;
use App\Models\GovernmentAccType;
use App\Models\InternalOrgDeduction;
use App\Models\Loan;
use App\Models\OtherDeduction;
use App\Models\InternalOrganizationService;
use App\Models\PayrollDeductionPriorityOrder;
use App\Models\PayrollDeductionSetting;
use App\Models\PayrollPeriod;
use App\Models\PayrollRecord;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PayrollProcessingController extends Controller
{
    public function __construct(protected ActivityLogService $activityLogService)
    {
    }

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
            ->map(fn(PayrollPeriod $p) => [
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
            ->map(fn(Employee $e) => [
                'id' => $e->employee_id,
                'name' => $e->basicInfo
                    ? $e->basicInfo->last_name . ', ' . $e->basicInfo->first_name
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

        $settings = PayrollDeductionSetting::getSettings();

        return Inertia::render('Payroll/PayrollProcessing/Index', [
            'periods' => $periods,
            'employmentClassifications' => $employmentClassifications,
            'employees' => $employees,
            'floorRules' => [
                'minimum_take_home_pay' => (float) $settings->minimum_take_home_pay,
                'salary_threshold' => (float) $settings->salary_threshold,
            ],
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
            $accTypes = GovernmentAccType::all()->keyBy('code');
            $mandatoryAllowances = Allowance::where('mandatory', true)->get();

            $query = Employee::with(['basicInfo', 'salaryGradeStep', 'allowances', 'waterBill'])
                ->where('status', true)
                ->whereIn('employee_id', $includedIds);

            if (!empty($validated['employee_type'])) {
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
                        accTypes: $accTypes,
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
                        + $data['gsis_mpl']
                        + $data['gsis_emergency']
                        + $data['pag_ibig_mpl']
                        + $data['ama_y2k_union']
                        + $data['water_bill'];

                    $computedRecords[] = array_merge($data, [
                        'employee_id' => $employee->employee_id,
                        'employee_name' => $employee->basicInfo
                            ? $employee->basicInfo->last_name . ', ' . $employee->basicInfo->first_name
                            : '—',
                        'gross_pay' => round($grossPay, 2),
                        'total_deductions' => round($totalDeductions, 2),
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Employee computation error: ' . $e->getMessage(), [
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
                'processingErrors' => ['Validation error: ' . collect($e->errors())->flatten()->first()],
            ]);
        } catch (\Throwable $e) {
            Log::error('processNew fatal error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'computedRecords' => [],
                'processedPeriodId' => null,
                'processingErrors' => ['Server error: ' . $e->getMessage()],
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
                !is_null($employeeType),
                fn($q) => $q->where('employee_type', $employeeType),
                fn($q) => $q->whereNull('employee_type'),
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
     * Late minutes  = minutes after the employee's own work_schedule_start when
     *                 morning check-in is later than that scheduled start time.
     *                 Falls back to 08:00 if work_schedule_start is not set.
     *
     * All check-in timestamps are converted to Asia/Manila (+08:00) in SQL
     * before being handed to PHP, keeping the calculation timezone-proof
     * regardless of the MySQL session or PHP app timezone.
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

            // ── Build holiday set for the period ──────────────────────────────
            try {
                $holidays = DB::table('holidays')
                    ->whereBetween('holiday_date', [$start->toDateString(), $end->toDateString()])
                    ->pluck('holiday_date')
                    ->map(fn($d) => Carbon::parse($d)->toDateString())
                    ->flip()
                    ->all();
            } catch (\Exception $e) {
                Log::warning('Holidays table query failed: ' . $e->getMessage());
                $holidays = [];
            }

            // ── Enumerate working days (Mon–Fri, non-holiday) ─────────────────
            $workingDates = [];
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $dateStr = $cursor->toDateString();
                if (!$cursor->isWeekend() && !isset($holidays[$dateStr])) {
                    $workingDates[] = $dateStr;
                }
                $cursor->addDay();
            }

            if (empty($workingDates)) {
                return response()->json([]);
            }

            // ── Load employees with their individual work schedules ───────────
            // FIX: select work_schedule_start and work_schedule_end so that
            // late-minute computation uses each employee's own schedule instead
            // of a global hardcoded 08:00 value.
            $empQuery = Employee::where('status', true)
                ->select([
                    'employee_id',
                    'employment_classification',
                    'work_schedule_start',
                    'work_schedule_end',
                ]);

            if (! empty($validated['employee_type'])) {
                $empQuery->where('employment_classification', $validated['employee_type']);
            }

            // Key by employee_id for O(1) lookups inside the loop below.
            $employeeScheduleMap = $empQuery->get()->keyBy('employee_id');
            $employeeIds = $employeeScheduleMap->keys()->all();

            if (empty($employeeIds)) {
                return response()->json([]);
            }

            // ── Fetch attendance records ───────────────────────────────────────
            // FIX: The old query computed late_mins_sql in MySQL using a
            // hardcoded '08:00:00' anchor. That SQL expression is removed.
            // Instead we bring the raw check-in timestamp (converted to Manila
            // time) into PHP, where we can diff it against each employee's own
            // work_schedule_start.
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
                    ->select([
                        'ar.employee_id',
                        'ar.recognition_morning_in_id',
                        DB::raw('DATE(ar.created_at) as record_date'),
                        // Convert to Manila time in SQL so the value is
                        // timezone-proof regardless of MySQL session timezone.
                        // PHP will compute the per-employee diff below.
                        DB::raw("CONVERT_TZ(rl.created_at, @@session.time_zone, '+08:00') as morning_in_manila"),
                    ])
                    ->get()
                    ->groupBy('employee_id')
                    ->map(fn($group) => $group->keyBy('record_date'));
            } catch (\Exception $e) {
                Log::error('Attendance records query failed: ' . $e->getMessage());

                return response()->json([
                    'error' => 'Attendance system tables not found or inaccessible.',
                    'message' => 'Database error: ' . $e->getMessage(),
                ], 500);
            }

            $startHour = 8;
            $startMinute = 0;

            // ── Per-employee absent / late computation ────────────────────────
            $result = [];

            foreach ($employeeIds as $empId) {
                $emp = $employeeScheduleMap->get($empId);
                $empRecords = $rows->get($empId, collect());

                // FIX: Resolve this employee's scheduled start time.
                // work_schedule_start is stored as a time string, e.g. "08:00:00".
                // Fall back to the standard Philippine government workday start
                // of 08:00 when the field is not populated.
                $scheduleStartTime = $emp->work_schedule_start ?? '08:00:00';

                $absentDays = 0;
                $lateMinutes = 0;

                foreach ($workingDates as $date) {
                    // No attendance record at all for this working day → absent.
                    if (! $empRecords->has($date)) {
                        $absentDays++;
                        continue;
                    }

                    $record = $empRecords->get($date);

                    // Record exists but morning check-in is missing → absent.
                    if (is_null($record->recognition_morning_in_id)) {
                        $absentDays++;
                        continue;
                    }

                    // FIX: Compute late minutes in PHP against the employee's
                    // own scheduled start, not a hardcoded 08:00 SQL anchor.
                    //
                    // $morning_in_manila is already in Asia/Manila (+08:00)
                    // because CONVERT_TZ was applied in the SQL query above.
                    //
                    // diffInMinutes($other, absolute=false) returns a signed
                    // integer: positive when $other is after $this (i.e. the
                    // employee checked in later than their scheduled start).
                    if (! is_null($record->morning_in_manila)) {
                        $scheduledStart = Carbon::parse(
                            $date.' '.$scheduleStartTime,
                            'Asia/Manila'
                        );
                        $actualCheckIn = Carbon::parse(
                            $record->morning_in_manila,
                            'Asia/Manila'
                        );

                        $minutesLate = (int) $scheduledStart->diffInMinutes($actualCheckIn, false);
                        $lateMinutes += max(0, $minutesLate);
                    }
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
            Log::error('attendanceSummary error: ' . $e->getMessage(), [
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
        $accTypes = GovernmentAccType::all()->keyBy('code');
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
                        accTypes: $accTypes,
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
                    Log::error('Employee processing error: ' . $e->getMessage(), [
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
            Log::error('Payroll processing failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'error' => 'Payroll processing failed: ' . $e->getMessage(),
            ]);
        }

        $this->activityLogService->createLog([
            'user_id' => Auth::id(),
            'module' => 'payroll',
            'description' => "Processed Payroll Period #{$period->payroll_period_id} — {$period->start_date->toDateString()} to {$period->end_date->toDateString()} (" . count($processed) . ' employees)',
        ]);

        return back()->with([
            'success' => count($processed) . ' employees processed successfully.',
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
     */
    private function computeForEmployee(
        Employee $employee,
        PayrollPeriod $period,
        PayrollDeductionSetting $settings,
        Collection $accTypes,
        $mandatoryAllowances,
        array|object $attendance,
        ?string $hrOfficerName,
    ): array {
        $attendance = (array) $attendance;
        $isSecondCutOff = $period->is_second_cut_off;

        // ── 1. Basic Pay ──────────────────────────────────────────────────────
        $monthlyBasic = (float) ($employee->salaryGradeStep?->monthly_salary ?? 0);
        $basicPay = round($monthlyBasic / 2, 2);

        // ── 2. Allowances ─────────────────────────────────────────────────────
        [$pera, $riceAllowance, $uniformAllowance, $taxableAllowancesMonthly]
            = $this->resolveAllowances($employee, $mandatoryAllowances);

        // ── 3. Gross Pay ──────────────────────────────────────────────────────
        $gross = $basicPay + $pera + $riceAllowance + $uniformAllowance;

        // ── 4. Absent / Late ─────────────────────────────────────────────────
        $absentDays = (int) ($attendance['absent_days'] ?? 0);
        $lateMinutes = (int) ($attendance['late_minutes'] ?? 0);

        $dailyRate = $settings->working_days_divisor > 0
            ? round($monthlyBasic / $settings->working_days_divisor, 6)
            : 0.0;

        // FIX: Derive work minutes per day from the employee's own stored
        // schedule (work_schedule_end − work_schedule_start) instead of
        // assuming a fixed 8-hour (480-minute) day for everyone.
        //
        // This matters for the late-deduction formula:
        //   Late Deduction = Late Minutes × (Monthly Basic ÷ Working-Days Divisor ÷ Work-Minutes-Per-Day)
        //
        // Falls back to the standard Philippine government 8-hour workday
        // (480 minutes) when either schedule field is missing or the computed
        // duration is zero or negative (guard against bad data).
        $workMinutesPerDay = 8 * 60; // default: 480 minutes

        $schedStart = $employee->work_schedule_start; // e.g. "08:00:00"
        $schedEnd = $employee->work_schedule_end;   // e.g. "17:00:00"

        if ($schedStart && $schedEnd) {
            $parsedMinutes = (int) Carbon::parse('1970-01-01 '.$schedEnd)
                ->diffInMinutes(Carbon::parse('1970-01-01 '.$schedStart));

            if ($parsedMinutes > 0) {
                $workMinutesPerDay = $parsedMinutes;
            }
        }

        $minuteRate = $dailyRate > 0
            ? round($dailyRate / $workMinutesPerDay, 8)
            : 0.0;

        $absentDeduction = round($absentDays * $dailyRate, 2);
        $lateDeduction = round($lateMinutes * $minuteRate, 2);

        // ── 5. Statutory Deductions ───────────────────────────────────────────
        /** @var GovernmentAccType|null $gsisType */
        $gsisType = $accTypes->get('GSIS');
        $philhealthType = $accTypes->get('PHILHEALTH');
        $pagibigType = $accTypes->get('PAGIBIG');

        $gsisRate = $gsisType?->employeeDeductionValue() ?? 9.0;
        $philhealthRate = $philhealthType?->employeeDeductionValue() ?? 2.5;
        $pagIbigCap = $pagibigType?->employeeDeductionValue() ?? 100.0;

        $monthlyGsisPremium = round($monthlyBasic * ($gsisRate / 100), 2);

        $monthlyPhilhealthCalc = round($monthlyBasic * ($philhealthRate / 100), 2);
        $monthlyPhilhealth = max(250.0, min(2500.0, $monthlyPhilhealthCalc));

        $monthlyPagIbig = $monthlyBasic <= 1500
            ? round($monthlyBasic * 0.01, 2)
            : min($pagIbigCap, round($monthlyBasic * 0.02, 2));

        $monthlyWithholdingTax = $this->computeWithholdingTax(
            monthlyBasic: $monthlyBasic,
            taxableAllowancesMonthly: $taxableAllowancesMonthly,
            gsisPremium: $monthlyGsisPremium,
            philhealth: $monthlyPhilhealth,
            pagIbig: $monthlyPagIbig,
        );

        $gsisPremium = round($monthlyGsisPremium / 2, 2);
        $philhealth = round($monthlyPhilhealth / 2, 2);
        $pagIbig = round($monthlyPagIbig / 2, 2);
        $withholdingTax = round($monthlyWithholdingTax / 2, 2);

        // ── Internal Org Deductions ───────────────────────────────────────────
        // Fetched for all cut-offs — service_category determines when each applies

        $internalOrgItems = [];
        $internalOrgSavings = 0.0; // Savings + Share_Capital → both cut-offs
        $internalOrgSecond = 0.0; // Loan + Dues             → 2nd cut-off only
        $internalOrgTotal = 0.0;

        $internalOrgDeductions = InternalOrgDeduction::with([
            'internalOrganization',
            'service',
        ])
            ->where('employee_id', $employee->employee_id)
            ->where('period_start', '<=', $period->end_date)
            ->where('period_end', '>=', $period->start_date)
            ->get();

        foreach ($internalOrgDeductions as $deduction) {
            $fullAmt = (float) $deduction->amount;
            $category = $deduction->service?->service_category;

            $isBothCutOff = in_array($category, InternalOrganizationService::BOTH_CUTOFF_CATEGORIES);

            // All categories now apply to both cut-offs.
            // Both-cut-off categories (Savings, Share_Capital): deduct half per cut-off.
            // Second-cut-off-only categories (Dues) and legacy rows: deduct half per cut-off too,
            // since the stored amount is the full monthly amount.
            $amt = round($fullAmt / 2, 2);

            if ($isBothCutOff) {
                $internalOrgSavings += $amt;
            } else {
                $internalOrgSecond += $amt;
            }

            $internalOrgItems[] = [
                'id' => $deduction->id,
                'org_name' => $deduction->internalOrganization?->name ?? '—',
                'service' => $deduction->service?->internal_organization_service_name ?? '—',
                'category' => $category ?? 'unknown',
                'description' => $deduction->description,
                'amount' => $amt,
            ];
        }

        $internalOrgTotal = $internalOrgSavings + $internalOrgSecond;

        // ── 6. Loans and Other Deductions (both cut-offs) ────────────────────
        $gsisMpl = 0.0;
        $gsisEmergency = 0.0;
        $pagIbigMpl = 0.0;
        $amaY2kUnion = 0.0;
        $waterBill = 0.0;
        $internalOrgLoanTotal = 0.0;
        $otherDeductionItems = [];
        $floorCheckPassed = true;

        $periodYearMonth = Carbon::parse($period->start_date)->format('Y-m');

        $loans = Loan::where('employee_id', $employee->employee_id)
            ->where('status', 'Active')
            ->where('start_period', '<=', $periodYearMonth)
            ->where('end_period', '>=', $periodYearMonth)
            ->get();

        foreach ($loans as $loan) {
            $sourceLower = strtolower($loan->source);
            $typeLower = strtolower($loan->loan_type);

            // Use semi_monthly_deduction directly — it is already the per-cut-off amount.
            if ($sourceLower === 'gsis') {
                if (str_contains($typeLower, 'emergency')) {
                    $gsisEmergency += (float) $loan->semi_monthly_deduction;
                } else {
                    $gsisMpl += (float) $loan->semi_monthly_deduction;
                }
            } elseif (in_array($sourceLower, ['pag-ibig', 'pagibig', 'hdmf'])) {
                $pagIbigMpl += (float) $loan->semi_monthly_deduction;
            } elseif ($loan->isInternalOrg()) {
                $amt = (float) $loan->semi_monthly_deduction;
                $amaY2kUnion += $amt;
                $internalOrgLoanTotal += $amt;
                $otherDeductionItems[] = [
                    'id'          => $loan->id,
                    'category'    => 'internal_org_loan',
                    'description' => $loan->loan_type . ' — ' . $loan->source,
                    'amount'      => $amt,
                    'type'        => 'other',
                ];
            }
        }

        $otherDeductions = OtherDeduction::where('employee_id', $employee->employee_id)
            ->where('period_start', '<=', $period->end_date)
            ->where('period_end', '>=', $period->start_date)
            ->get();

        foreach ($otherDeductions as $deduction) {
            // OtherDeduction stores the full monthly amount — halve it per cut-off.
            $amt = round((float) $deduction->amount / 2, 2);
            if ($deduction->isWaterBill()) {
                $waterBill += $amt;
                $type = 'water_bill';
            } else {
                $amaY2kUnion += $amt;
                $type = 'other';
            }
            $otherDeductionItems[] = [
                'id'          => $deduction->id,
                'category'    => $deduction->category,
                'description' => $deduction->description,
                'amount'      => $amt,
                'type'        => $type,
            ];
        }

        $amaY2kUnion += $internalOrgSecond; // ← org dues (halved above)

        // ── 7. Priority-order floor rule ──────────────────────────────────────
        //
        // Load the HR-configured priority order from the DB.
        // Deductions are applied in ascending priority; when a deduction would
        // push net pay below the minimum take-home, it is zeroed ("cut") based
        // on its cuttability setting:
        //
        //   Never        → always applied, never zeroed
        //   Rarely       → only zeroed when the balance is already below floor
        //                  before this deduction is even attempted
        //   Yes          → zeroed whenever it would breach the floor
        //   First_to_Cut → zeroed first; tried last in priority order
        //
        // Absent and late deductions are always applied before the floor rule
        // (they are attendance penalties, not optional deductions).
        // Statutory contributions (government_contribution) are Never cuttable.

        $priorityRows = PayrollDeductionPriorityOrder::ordered();
        $floor        = (float) $settings->minimum_take_home_pay;

        // ── Fallback: if priority table is not seeded, skip floor bucketing ──
        // All pre-computed deduction amounts are used as-is; floor check is
        // purely informational (same as the legacy behaviour).
        if ($priorityRows->isEmpty()) {
            $rawNetPay = $gross - $absentDeduction - $lateDeduction
                - $gsisPremium - $philhealth - $pagIbig - $withholdingTax
                - $gsisMpl - $gsisEmergency - $pagIbigMpl
                - $internalOrgSavings
                - $amaY2kUnion - $waterBill;
            $floorCheckPassed = $rawNetPay >= $floor;

            $totalDeductions = $gsisPremium + $philhealth + $pagIbig + $withholdingTax
                + $absentDeduction + $lateDeduction
                + $internalOrgSavings
                + $gsisMpl + $gsisEmergency + $pagIbigMpl
                + $amaY2kUnion + $waterBill;

            $netPay = round($gross - $totalDeductions, 2);
            $floorCutAmount = 0.0;

            return [
                'basic_pay'               => $basicPay,
                'pera'                    => $pera,
                'rice_allowance'          => $riceAllowance,
                'uniform_allowance'       => $uniformAllowance,
                'gsis_premium'            => $gsisPremium,
                'philhealth'              => $philhealth,
                'pag_ibig'                => $pagIbig,
                'withholding_tax'         => $withholdingTax,
                'absent_days'             => $absentDays,
                'absent_deduction'        => $absentDeduction,
                'late_minutes'            => $lateMinutes,
                'late_deduction'          => $lateDeduction,
                'gsis_mpl'                => round($gsisMpl, 2),
                'gsis_emergency'          => round($gsisEmergency, 2),
                'pag_ibig_mpl'            => round($pagIbigMpl, 2),
                'ama_y2k_union'           => round($amaY2kUnion, 2),
                'water_bill'              => round($waterBill, 2),
                'internal_org_deductions' => round($internalOrgSavings + $internalOrgSecond + $internalOrgLoanTotal, 2),
                'internal_org_savings'    => round($internalOrgSavings, 2),
                'internal_org_second'     => round($internalOrgSecond, 2),
                'internal_org_loans'      => round($internalOrgLoanTotal, 2),
                'other_deductions'        => round(
                    collect($otherDeductionItems)
                        ->where('type', 'other')
                        ->where('category', '!=', 'internal_org_loan')
                        ->sum('amount'),
                    2
                ),
                'internal_org_items'      => $internalOrgItems,
                'other_deduction_items'   => $otherDeductionItems,
                'net_pay'                 => $netPay,
                'floor_check_passed'      => $floorCheckPassed,
                'floor_cut_amount'        => $floorCutAmount,
                'status'                  => 'draft',
                'hr_officer_name'         => $hrOfficerName,
            ];
        }

        // Running balance starts from gross minus the fixed attendance penalties
        // and statutory contributions (Never cuttable — always deducted first).
        $runningBalance = $gross
            - $absentDeduction
            - $lateDeduction
            - $gsisPremium
            - $philhealth
            - $pagIbig
            - $withholdingTax;

        // Buckets — keyed by deduction_category, each holds [amount, cuttability]
        // Government contributions are already deducted above (Never), so they
        // are excluded from the loop.
        $buckets = [];
        foreach ($priorityRows as $row) {
            $cat = $row->deduction_category;

            if ($cat === PayrollDeductionPriorityOrder::CATEGORY_GOVERNMENT_CONTRIBUTION) {
                // Already applied above — skip.
                continue;
            }

            $amount = match ($cat) {
                PayrollDeductionPriorityOrder::CATEGORY_GOVERNMENT_LOAN
                    => $gsisMpl + $gsisEmergency + $pagIbigMpl,

                PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_SAVINGS
                    => $internalOrgSavings,

                // Internal org loans live in ama_y2k_union; org dues are the
                // $internalOrgSecond portion.  We separate them here so each
                // category can have its own cuttability and priority.
                PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_LOAN
                    => $internalOrgLoanTotal,

                PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_DUES
                    => $internalOrgSecond,

                PayrollDeductionPriorityOrder::CATEGORY_WATER_BILL
                    => $waterBill,

                PayrollDeductionPriorityOrder::CATEGORY_OTHER_MISCELLANEOUS
                    => collect($otherDeductionItems)
                        ->where('type', 'other')
                        ->where('category', '!=', 'internal_org_loan')
                        ->sum('amount'),

                default => 0.0,
            };

            if ($amount <= 0) {
                continue;
            }

            $buckets[] = [
                'category'    => $cat,
                'amount'      => $amount,
                'cuttability' => $row->cuttability,
                'effective'   => $amount, // may be zeroed below
            ];
        }

        // Separate into normal-priority and first-to-cut groups.
        // First_to_Cut buckets are attempted last even if their DB priority
        // would place them earlier — this is the defining behaviour.
        $normalBuckets  = array_filter($buckets, fn($b) => $b['cuttability'] !== PayrollDeductionPriorityOrder::CUT_FIRST_TO_CUT);
        $firstCutBuckets = array_filter($buckets, fn($b) => $b['cuttability'] === PayrollDeductionPriorityOrder::CUT_FIRST_TO_CUT);

        $floorCheckPassed = true;

        $applyBucket = function (array &$bucket) use (&$runningBalance, $floor, &$floorCheckPassed): void {
            $cut = $bucket['cuttability'];
            $amt = $bucket['amount'];

            if ($cut === PayrollDeductionPriorityOrder::CUT_NEVER) {
                // Always apply — never zeroed.
                $runningBalance -= $amt;
                $bucket['effective'] = $amt;
                return;
            }

            if ($cut === PayrollDeductionPriorityOrder::CUT_RARELY) {
                // Only zero if the balance is already below floor without it.
                if ($runningBalance < $floor) {
                    $bucket['effective'] = 0.0;
                    $floorCheckPassed = false;
                } else {
                    $runningBalance -= $amt;
                    $bucket['effective'] = ($runningBalance >= $floor) ? $amt : (function () use (&$runningBalance, $amt, $floor): float {
                        // Partial cut: apply only what keeps us at floor.
                        $canApply = max(0.0, $runningBalance - $floor);
                        $runningBalance -= $canApply;
                        $floorCheckPassed = false;
                        return $canApply;
                    })();
                }
                return;
            }

            // Yes or First_to_Cut — zero if it would breach the floor.
            if (($runningBalance - $amt) >= $floor) {
                $runningBalance -= $amt;
                $bucket['effective'] = $amt;
            } else {
                // Apply only what the remaining headroom allows.
                $canApply = max(0.0, $runningBalance - $floor);
                $bucket['effective'] = $canApply;
                $runningBalance -= $canApply;
                $floorCheckPassed = false;
            }
        };

        foreach ($normalBuckets as &$bucket) {
            $applyBucket($bucket);
        }
        unset($bucket);

        foreach ($firstCutBuckets as &$bucket) {
            $applyBucket($bucket);
        }
        unset($bucket);

        // Merge effective amounts back into the named variables so the return
        // array and downstream code stay unchanged.
        $allBuckets = array_merge(array_values($normalBuckets), array_values($firstCutBuckets));

        $effectiveByCategory = [];
        foreach ($allBuckets as $b) {
            $effectiveByCategory[$b['category']] = ($effectiveByCategory[$b['category']] ?? 0.0) + $b['effective'];
        }

        $govLoanEffective    = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_GOVERNMENT_LOAN]      ?? ($gsisMpl + $gsisEmergency + $pagIbigMpl);
        $orgSavingsEffective = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_SAVINGS] ?? $internalOrgSavings;
        $orgLoanEffective    = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_LOAN]    ?? $internalOrgLoanTotal;
        $orgDuesEffective    = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_INTERNAL_ORG_DUES]    ?? $internalOrgSecond;
        $waterBillEffective  = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_WATER_BILL]           ?? $waterBill;
        $otherMiscEffective  = $effectiveByCategory[PayrollDeductionPriorityOrder::CATEGORY_OTHER_MISCELLANEOUS]  ?? 0.0;

        // Redistribute gov loan effective amount back to individual loan buckets
        // proportionally (preserves per-loan column values in the return array).
        $rawGovLoan = $gsisMpl + $gsisEmergency + $pagIbigMpl;
        $govLoanRatio = $rawGovLoan > 0 ? $govLoanEffective / $rawGovLoan : 1.0;
        $gsisMpl      = round($gsisMpl * $govLoanRatio, 2);
        $gsisEmergency = round($gsisEmergency * $govLoanRatio, 2);
        $pagIbigMpl   = round($pagIbigMpl * $govLoanRatio, 2);

        $internalOrgSavings = round($orgSavingsEffective, 2);

        // amaY2kUnion is rebuilt entirely from effective values — do NOT add
        // $internalOrgSecond again here, it was already included in the raw
        // $amaY2kUnion but the effective value comes from the bucket result.
        $amaY2kUnion = round($orgLoanEffective + $orgDuesEffective + $otherMiscEffective, 2);
        $waterBill   = round($waterBillEffective, 2);

        // ── 8. Net Pay ────────────────────────────────────────────────────────
        $totalDeductions = $gsisPremium + $philhealth + $pagIbig + $withholdingTax
            + $absentDeduction + $lateDeduction
            + $internalOrgSavings
            + $gsisMpl + $gsisEmergency + $pagIbigMpl
            + $amaY2kUnion
            + $waterBill;

        $netPay = round($gross - $totalDeductions, 2);

        // Total amount cut by the floor rule = sum of (raw - effective) for each bucket
        $floorCutAmount = 0.0;
        foreach ($allBuckets as $b) {
            $floorCutAmount += max(0.0, $b['amount'] - $b['effective']);
        }
        $floorCutAmount = round($floorCutAmount, 2);

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
            'internal_org_deductions' => round($orgSavingsEffective + $orgDuesEffective + $orgLoanEffective, 2),
            'internal_org_savings'    => round($orgSavingsEffective, 2),
            'internal_org_second'     => round($orgDuesEffective, 2),
            'internal_org_loans'      => round($orgLoanEffective, 2),
            'other_deductions' => round($otherMiscEffective, 2),
            'internal_org_items' => $internalOrgItems,
            'other_deduction_items' => $otherDeductionItems,
            'net_pay' => $netPay,
            'floor_check_passed' => $floorCheckPassed,
            'floor_cut_amount' => $floorCutAmount,
            'status' => 'draft',
            'hr_officer_name' => $hrOfficerName,
        ];
    }

    /**
     * Resolve allowance amounts for an employee.
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
            if (!$allowance->isApplicableTo($classification)) {
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

        foreach ($employee->allowances as $empAllowance) {
            /** @var Allowance|null $def */
            $def = $empAllowance->allowance ?? null;
            if (!$def) {
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
     */
    private function computeWithholdingTax(
        float $monthlyBasic,
        float $taxableAllowancesMonthly,
        float $gsisPremium,
        float $philhealth,
        float $pagIbig,
    ): float {
        $monthlyTaxable = $monthlyBasic
            + $taxableAllowancesMonthly
            - $gsisPremium
            - $philhealth
            - $pagIbig;

        if ($monthlyTaxable <= 0) {
            return 0.0;
        }

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
     * NOTE: The main computeForEmployee path now uses the priority-order-aware
     * floor rule inline. This helper is retained for any callers that still
     * need a simple sequential floor check (e.g. legacy processNew fallback).
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
                $adjusted[] = 0.0;
                $totalCut += $amount;
                $allPassed = false;
            }
        }

        return [...$adjusted, $runningBalance, $allPassed, $totalCut];
    }

    /**
     * Reduce loan balances after a successful 2nd cut-off payroll run.
     */
    private function applyLoanDeductions(int $employeeId, PayrollPeriod $period): void
    {
        $periodYearMonth = Carbon::parse($period->start_date)->format('Y-m');

        Loan::where('employee_id', $employeeId)
            ->where('status', 'Active')
            ->where('start_period', '<=', $periodYearMonth)
            ->where('end_period', '>=', $periodYearMonth)
            ->each(fn(Loan $loan) => $loan->applyDeduction());
    }

    /**
     * Same as applyLoanDeductions but skips loan types the HR officer waived.
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
                    if (!str_contains($typeLower, 'emergency') && in_array('gsis_mpl', $waived)) {
                        return;
                    }
                } elseif (in_array($sourceLower, ['pag-ibig', 'pagibig', 'hdmf'])) {
                    if (in_array('pag_ibig_mpl', $waived)) {
                        return;
                    }
                } elseif ($loan->isInternalOrg()) {
                    // Internal org loans are grouped under ama_y2k_union for waiver purposes
                    if (in_array('ama_y2k_union', $waived)) {
                        return;
                    }
                }

                $loan->applyDeduction();
            });
    }

    /**
     * Extend the period_end of waived deduction records so they roll into the next period.
     */
    private function carryForwardWaivedDeductions(int $employeeId, PayrollPeriod $period, array $waived, array $waivedItemIds = []): void
    {
        $orgGroupWaived = in_array('ama_y2k_union', $waived);
        $waterGroupWaived = in_array('water_bill', $waived);

        if (!$orgGroupWaived && !$waterGroupWaived && empty($waivedItemIds)) {
            return;
        }

        $nextEnd = Carbon::parse($period->end_date)->addDays(16);

        if ($orgGroupWaived || $waterGroupWaived || !empty($waivedItemIds)) {
            OtherDeduction::where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->get()
                ->each(function (OtherDeduction $deduction) use ($orgGroupWaived, $waterGroupWaived, $waivedItemIds, $nextEnd) {
                    $shouldCarry = false;

                    if ($waterGroupWaived && $deduction->isWaterBill()) {
                        $shouldCarry = true;
                    } elseif ($orgGroupWaived && ($deduction->isNsNd() || $deduction->isMiscellaneous())) {
                        $shouldCarry = true;
                    } elseif (!empty($waivedItemIds) && in_array($deduction->id, $waivedItemIds)) {
                        $shouldCarry = true;
                    }

                    if ($shouldCarry) {
                        $deduction->update(['period_end' => $nextEnd]);
                    }
                });
        }

        if ($orgGroupWaived) {
            InternalOrgDeduction::where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->each(fn(InternalOrgDeduction $d) => $d->update(['period_end' => $nextEnd]));
        } elseif (!empty($waivedItemIds)) {
            InternalOrgDeduction::whereIn('id', $waivedItemIds)
                ->where('employee_id', $employeeId)
                ->where('period_start', '<=', $period->end_date)
                ->where('period_end', '>=', $period->start_date)
                ->each(fn(InternalOrgDeduction $d) => $d->update(['period_end' => $nextEnd]));
        }
    }

    /**
     * Step 5 — Finalize payroll with HR floor-check adjustments.
     */
    public function finalizePayroll(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
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

            $employeeType = $validated['employee_type'] ?? null;
            $duplicate = PayrollPeriod::where('start_date', $validated['start_date'])
                ->where('end_date', $validated['end_date'])
                ->when(
                    !is_null($employeeType),
                    fn($q) => $q->where('employee_type', $employeeType),
                    fn($q) => $q->whereNull('employee_type'),
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
                        . 'Please select a different Employment Type or review the existing payroll record.',
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
                ]);

                $isSecondCutOff = $period->is_second_cut_off;

                foreach ($validated['records'] as $rec) {
                    try {
                        $waived = $rec['waived'] ?? [];
                        $waivedItemIds = array_map('intval', $rec['waived_item_ids'] ?? []);

                        $gsisMpl = in_array('gsis_mpl', $waived) ? 0.0 : (float) $rec['gsis_mpl'];
                        $gsisEmergency = in_array('gsis_emergency', $waived) ? 0.0 : (float) $rec['gsis_emergency'];
                        $pagIbigMpl = in_array('pag_ibig_mpl', $waived) ? 0.0 : (float) $rec['pag_ibig_mpl'];

                        if (in_array('ama_y2k_union', $waived)) {
                            $amaY2kUnion = 0.0;
                        } elseif (!empty($waivedItemIds)) {
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

                        if (in_array('water_bill', $waived)) {
                            $waterBill = 0.0;
                        } elseif (!empty($waivedItemIds)) {
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
                                'water_bill'            => $waterBill,
                                'net_pay'               => $netPay,
                                'floor_check_passed' => $floorCheckPassed,
                                'hr_officer_name' => $validated['hr_officer_name'] ?? null,
                                'status' => 'draft',
                            ]
                        );

                        if ($isSecondCutOff) {
                            $this->applyLoanDeductionsFiltered($rec['employee_id'], $period, $waived);
                        }

                        if (!empty($waived) || !empty($waivedItemIds)) {
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
                    'description' => "Finalized Payroll Period #{$period->payroll_period_id} ({$period->start_date->toDateString()} – {$period->end_date->toDateString()}) — " . count($validated['records']) . ' employees',
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
            Log::error('Finalization failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Finalization failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}