<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualPosting;
use App\Models\LeaveAccrualRecord;
use App\Models\LeaveType;
use App\Services\LeaveBalanceService;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaveAccrualController extends Controller
{
    public function __construct(protected LeaveBalanceService $leaveBalanceService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 – Landing / Select Period + Leave Type selection
    // GET /leave/accrual
    // ─────────────────────────────────────────────────────────────────────────

    public function index()
    {
        $leaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'available_leave_types' => $leaveTypes,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 – Preview computed credits
    // GET /leave/accrual/preview?month=3&year=2026&leave_type_ids[]=1&leave_type_ids[]=2
    // ─────────────────────────────────────────────────────────────────────────

    public function preview(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'leave_type_ids' => ['required', 'array', 'min:1'],
            'leave_type_ids.*' => ['integer', 'exists:leave_types,leave_type_id'],
        ]);

        $month = (int) $request->month;
        $year = (int) $request->year;
        $leaveTypeIds = array_map('intval', $request->leave_type_ids);

        // Guard: already posted?
        $alreadyPosted = LeaveAccrualPosting::where('posting_month', $month)
            ->where('posting_year', $year)
            ->where('status', 'posted')
            ->exists();

        if ($alreadyPosted) {
            $monthName = Carbon::create($year, $month)->format('F');

            return back()->withErrors([
                'period' => "Leave accrual for {$monthName} {$year} has already been posted.",
            ]);
        }

        $workDayData = $this->computeWorkDays($month, $year);

        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDayData['work_days'], $month, $year);

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'step' => 2,
            'period' => compact('month', 'year'),
            'work_days' => $workDayData['work_days'],
            'total_days' => $workDayData['total_days_in_month'],
            'total_sundays' => $workDayData['total_sundays'],
            'total_holidays' => $workDayData['total_holidays'],
            'previews' => $previews,
            'leave_types' => $leaveTypes,
            'leave_type_ids' => $leaveTypeIds,
            'available_leave_types' => $availableLeaveTypes,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 – Confirm summary before posting
    // POST /leave/accrual/confirm
    // ─────────────────────────────────────────────────────────────────────────

    public function confirm(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'leave_type_ids' => ['required', 'array', 'min:1'],
            'leave_type_ids.*' => ['integer', 'exists:leave_types,leave_type_id'],
        ]);

        $month = (int) $request->month;
        $year = (int) $request->year;
        $leaveTypeIds = array_map('intval', $request->leave_type_ids);

        $workDayData = $this->computeWorkDays($month, $year);

        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDayData['work_days'], $month, $year);

        $previewCollection = collect($previews);
        $fullCount = $previewCollection->where('credit_status', 'full_credit')->pluck('employee_id')->unique()->count();
        $proratedCount = $previewCollection->where('credit_status', 'prorated')->pluck('employee_id')->unique()->count();
        $ineligibleCount = $previewCollection->where('credit_status', 'ineligible')->pluck('employee_id')->unique()->count();

        $user = Auth::user();
        $refNo = 'LP-'.str_pad($month, 2, '0', STR_PAD_LEFT).'-'.$year;

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'step' => 3,
            'period' => compact('month', 'year'),
            'work_days' => $workDayData['work_days'],
            'total_days' => $workDayData['total_days_in_month'],
            'total_sundays' => $workDayData['total_sundays'],
            'total_holidays' => $workDayData['total_holidays'],
            'previews' => $previews,
            'leave_types' => $leaveTypes,
            'leave_type_ids' => $leaveTypeIds,
            'available_leave_types' => $availableLeaveTypes,
            'summary' => [
                'total_eligible' => $fullCount + $proratedCount,
                'full_credit' => $fullCount,
                'prorated' => $proratedCount,
                'ineligible' => $ineligibleCount,
                'work_days' => $workDayData['work_days'],
                'total_days' => $workDayData['total_days_in_month'],
                'total_sundays' => $workDayData['total_sundays'],
                'total_holidays' => $workDayData['total_holidays'],
            ],
            'post_details' => [
                'posted_by' => $user->name ?? 'Administrator',
                'role' => $user->roles->first()?->name ?? 'HR Admin',
                'user_id_str' => 'USR-'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'posting_date' => now()->format('F d, Y'),
                'reference_no' => $refNo,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Post – Persist to DB then show posted review (Step 4)
    // POST /leave/accrual/post
    // ─────────────────────────────────────────────────────────────────────────

    public function post(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'leave_type_ids' => ['required', 'array', 'min:1'],
            'leave_type_ids.*' => ['integer', 'exists:leave_types,leave_type_id'],
        ]);

        $month = (int) $request->month;
        $year = (int) $request->year;
        $leaveTypeIds = array_map('intval', $request->leave_type_ids);

        // Final guard
        $alreadyPosted = LeaveAccrualPosting::where('posting_month', $month)
            ->where('posting_year', $year)
            ->where('status', 'posted')
            ->exists();

        if ($alreadyPosted) {
            $monthName = Carbon::create($year, $month)->format('F');

            return back()->withErrors([
                'period' => "Leave accrual for {$monthName} {$year} has already been posted.",
            ]);
        }

        $workDayData = $this->computeWorkDays($month, $year);
        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDayData['work_days'], $month, $year);

        $refNo = 'LP-'.str_pad($month, 2, '0', STR_PAD_LEFT).'-'.$year;

        // Collect distinct employee IDs before the transaction so we can run
        // threshold grants after balances have been committed to the DB.
        $affectedEmployeeIds = collect($previews)->pluck('employee_id')->unique()->values()->all();

        DB::transaction(function () use ($month, $year, $workDayData, $previews, $refNo) {
            $posting = LeaveAccrualPosting::create([
                'posting_month' => $month,
                'posting_year' => $year,
                'total_days_in_month' => $workDayData['total_days_in_month'],
                'total_sundays' => $workDayData['total_sundays'],
                'total_holidays' => $workDayData['total_holidays'],
                'work_days' => $workDayData['work_days'],
                'posted_by_user_id' => Auth::id(),
                'reference_no' => $refNo,
                'status' => 'posted',
            ]);

            foreach ($previews as $preview) {
                LeaveAccrualRecord::create([
                    'leave_accrual_posting_id' => $posting->leave_accrual_posting_id,
                    'employee_id' => $preview['employee_id'],
                    'leave_type_id' => $preview['leave_type_id'],
                    'minutes_worked' => $preview['minutes_worked'],
                    'accrual_earned' => $preview['accrual_earned'],
                    'balance_before' => $preview['balance_before'],
                    'balance_after' => $preview['balance_after'],
                    'credit_status' => $preview['credit_status'],
                ]);

                EmployeeLeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $preview['employee_id'],
                        'leave_type_id' => $preview['leave_type_id'],
                        'cycle_year' => $year,
                    ],
                    [
                        // total_days = cumulative entitlement earned so far
                        //              (previous total_days + this month's accrual)
                        // balance    = total_days - used_days (spendable credit)
                        // used_days  is intentionally NOT touched here — leave
                        //            applications own that field.
                        'total_days' => $preview['total_days_after'],
                        'balance' => $preview['balance_after'],
                    ]
                );
            }
        });

        // ── VL threshold check (outside transaction) ──────────────────────────
        // Now that updated VL balances are committed, check whether any affected
        // employee has crossed the ≥ 10 VL threshold and grant Forced Leave
        // (5 days) and/or Special Leave (3 days) if not already present.
        // applyThresholdGrants() is idempotent — safe to call repeatedly.
        foreach ($affectedEmployeeIds as $employeeId) {
            $this->leaveBalanceService->applyThresholdGrants($employeeId, $year);
        }

        return redirect()->route('leave.accrual.posted', [
            'month' => $month,
            'year' => $year,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4 – Posted review for a specific month/year
    // GET /leave/accrual/posted?month=3&year=2026
    // ─────────────────────────────────────────────────────────────────────────

    public function posted(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) $request->month;
        $year = (int) $request->year;

        $posting = LeaveAccrualPosting::with('records.employee.basicInfo', 'records.leaveType')
            ->where('posting_month', $month)
            ->where('posting_year', $year)
            ->where('status', 'posted')
            ->firstOrFail();

        $postedPreviews = $posting->records->map(fn (LeaveAccrualRecord $r) => [
            'employee_id' => $r->employee_id,
            'name' => $r->employee?->basicInfo?->full_name ?? '—',
            'department' => $r->employee?->item?->position?->department?->department_name ?? '—',
            'employment_classification' => $r->employee?->employment_classification ?? '—',
            'avatar_url' => $r->employee?->avatar_url,
            'leave_type_id' => $r->leave_type_id,
            'leave_type_name' => $r->leaveType?->leave_type_name ?? '—',
            // minutes_worked stores TMW for the posting period
            'minutes_worked' => $r->minutes_worked,
            'accrual_earned' => (float) $r->accrual_earned,
            'balance_before' => (float) $r->balance_before,
            'balance_after' => (float) $r->balance_after,
            'credit_status' => $r->credit_status,
        ])->values()->all();

        $leaveTypes = $posting->records
            ->map(fn ($r) => [
                'leave_type_id' => $r->leave_type_id,
                'leave_type_name' => $r->leaveType?->leave_type_name ?? '—',
            ])
            ->unique('leave_type_id')
            ->values();

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'step' => 4,
            'period' => compact('month', 'year'),
            'previews' => $postedPreviews,
            'leave_types' => $leaveTypes,
            'posting_meta' => [
                'reference_no' => $posting->reference_no,
                'posted_date' => $posting->updated_at->format('F d, Y'),
                'work_days' => $posting->work_days,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // History – All-time posted records (tab view)
    // GET /leave/accrual/history?year=2026&month=3
    // ─────────────────────────────────────────────────────────────────────────

    public function history(Request $request)
    {
        $year = $request->integer('year', 0) ?: null;
        $month = $request->integer('month', 0) ?: null;

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'tab' => 'history',
            'history' => $this->getHistory($year, $month),
            'history_filter' => compact('year', 'month'),
            'available_leave_types' => $availableLeaveTypes,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Balances – Leave Balances tab (redirects to dedicated controller)
    // GET /leave/accrual/balances  →  kept for backwards-compat tab routing
    // ─────────────────────────────────────────────────────────────────────────

    public function balances(Request $request)
    {
        $currentYear = (int) date('Y');
        $cycleYear = $request->integer('year', $currentYear) ?: $currentYear;

        $cycleYears = $this->leaveBalanceService->getCycleYears();

        // All active leave types — column headers show every type including
        // threshold-gated ones (Forced Leave, Special Leave)
        $leaveTypes = LeaveType::where('status', true)
            ->whereIn('availment_type', ['intermittent', 'both'])
            ->get(['leave_type_id', 'leave_type_name']);

        // Accrual-only types — for the posting wizard leave type selector
        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        $balancesData = $this->leaveBalanceService->getBalancesTable($cycleYear);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'tab' => 'balances',
            'available_leave_types' => $availableLeaveTypes,
            'balances_data' => $balancesData,
            'balances_leave_types' => $leaveTypes,
            'balances_cycle_year' => $cycleYear,
            'balances_cycle_years' => $cycleYears,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute work days for a given month/year.
     *
     * TWD = DOM - TSM - THM
     * Saturdays ARE counted as work days per configuration.
     */
    private function computeWorkDays(int $month, int $year): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $totalDays = $end->day;
        $sundayDates = [];

        foreach (CarbonPeriod::create($start, $end) as $day) {
            if ($day->isSunday()) {
                $sundayDates[] = $day->toDateString();
            }
        }

        $totalSundays = count($sundayDates);

        // Only deduct non-working holidays (Regular, Special Non-Working, Local).
        // 'Special Working' holidays are actual work days — do NOT subtract them.
        // Also skip holidays that fall on Sundays (already excluded via $totalSundays).
        $totalHolidays = DB::table('holidays')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->whereNotIn('date', $sundayDates)          // avoid double-subtracting
            ->where('type', '!=', 'Special Working')    // Special Working = work day
            ->count();

        // TWD = DOM - TSM - THM  (Saturdays included as work days)
        $workDays = $totalDays - $totalSundays - $totalHolidays;

        return [
            'total_days_in_month' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
            'work_days' => $workDays,
        ];
    }

    /**
     * Fetch all active employees who are eligible for leave accrual and compute
     * their Total Minutes Worked (TMW) for the given month.
     *
     * CSC Rule XVI eligibility:
     *   Only Permanent, Temporary, Casual, and Coterminous appointees earn
     *   VL/SL credits. Job Order (JO) and Contract of Service (COS) workers
     *   are NOT entitled to leave accrual and are excluded here.
     */
    private const ACCRUAL_ELIGIBLE_CLASSIFICATIONS = [
        'Permanent',
        'Temporary',
        'Casual',
        'Coterminous',
    ];

    private function getEmployeesWithAttendance(int $month, int $year): Collection
    {
        return Employee::with(['basicInfo', 'item.position.department'])
            ->where('status', true)
            ->whereIn('employment_classification', self::ACCRUAL_ELIGIBLE_CLASSIFICATIONS)
            ->get()
            ->map(function (Employee $employee) use ($month, $year) {

                // Pull attendance rows that have all four recognition IDs set,
                // then join recognition_logs four times to get actual timestamps.
                $rows = DB::table('attendance_records as ar')
                    ->join('recognition_logs as rl_am_in', 'rl_am_in.recognition_log_id', '=', 'ar.recognition_morning_in_id')
                    ->join('recognition_logs as rl_am_out', 'rl_am_out.recognition_log_id', '=', 'ar.recognition_morning_out_id')
                    ->join('recognition_logs as rl_pm_in', 'rl_pm_in.recognition_log_id', '=', 'ar.recognition_afternoon_in_id')
                    ->join('recognition_logs as rl_pm_out', 'rl_pm_out.recognition_log_id', '=', 'ar.recognition_afternoon_out_id')
                    ->where('ar.employee_id', $employee->employee_id)
                    ->whereMonth('ar.created_at', $month)
                    ->whereYear('ar.created_at', $year)
                    ->whereNotNull('ar.recognition_morning_in_id')
                    ->whereNotNull('ar.recognition_morning_out_id')
                    ->whereNotNull('ar.recognition_afternoon_in_id')
                    ->whereNotNull('ar.recognition_afternoon_out_id')
                    ->select(
                        'rl_am_in.created_at  as am_in',
                        'rl_am_out.created_at as am_out',
                        'rl_pm_in.created_at  as pm_in',
                        'rl_pm_out.created_at as pm_out'
                    )
                    ->get();

                // THWD per day in minutes; sum = TMW
                $totalMinutesWorked = $rows->sum(function ($row) {
                    $amIn = Carbon::parse($row->am_in);
                    $amOut = Carbon::parse($row->am_out);
                    $pmIn = Carbon::parse($row->pm_in);
                    $pmOut = Carbon::parse($row->pm_out);

                    $amMinutes = max(0, $amIn->diffInMinutes($amOut, false));
                    $pmMinutes = max(0, $pmIn->diffInMinutes($pmOut, false));

                    return $amMinutes + $pmMinutes;
                });

                return [
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->basicInfo?->full_name ?? '—',
                    'department' => $employee->item?->position?->department?->department_name ?? '—',
                    'employment_classification' => $employee->employment_classification,
                    'avatar_url' => $employee->avatar_url,
                    'minutes_worked' => (int) $totalMinutesWorked,
                ];
            });
    }

    /**
     * Build preview rows for each employee × leave type combination.
     *
     * CSC formula:
     *   leave_accrual_rate = 1.25 / ((TWD * 8) * 60)   [leave days per minute]
     *   leave_credit       = leave_accrual_rate * TMW
     *
     * Credit status:
     *   ineligible   – employee has 0 minutes worked
     *   full_credit  – employee minutes >= TWD * 8 * 60 (full work hours)
     *   prorated     – employee has some minutes but less than full
     */
    private function buildPreviews(
        Collection $employees,
        Collection $leaveTypes,
        int $workDays,
        int $month,
        int $year
    ): array {
        $previews = [];
        $leaveTypeIds = $leaveTypes->pluck('leave_type_id')->all();
        $employeeIds = $employees->pluck('employee_id')->all();
        $cycleYear = $year;

        // Total expected work minutes for the month (TWD * 8 hours * 60 minutes)
        $totalWorkMinutes = $workDays * 8 * 60;

        // Leave accrual rate: 1.25 days / total work minutes in the month
        // Avoid division by zero on edge cases
        $leaveAccrualRate = $totalWorkMinutes > 0
            ? 1.25 / $totalWorkMinutes
            : 0;

        // Pre-load existing balances
        $balances = DB::table('employee_leave_balances')
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('leave_type_id', $leaveTypeIds)
            ->where('cycle_year', $cycleYear)
            ->get()
            ->keyBy(fn ($row) => "{$row->employee_id}_{$row->leave_type_id}");

        foreach ($employees as $employee) {
            $tmw = $employee['minutes_worked']; // Total Minutes Worked

            if ($tmw <= 0) {
                $creditStatus = 'ineligible';
            } elseif ($tmw >= $totalWorkMinutes) {
                $creditStatus = 'full_credit';
            } else {
                $creditStatus = 'prorated';
            }

            // leave_credit = leave_accrual_rate * TMW
            $accrualEarned = $creditStatus === 'ineligible'
                ? 0.0
                : round($leaveAccrualRate * $tmw, 4);

            foreach ($leaveTypes as $leaveType) {
                $balanceKey = "{$employee['employee_id']}_{$leaveType->leave_type_id}";
                $existingRow = $balances[$balanceKey] ?? null;

                // balance_before  = current spendable balance (total_days - used_days)
                // total_days_before = current cumulative entitlement (used + unspent)
                $balanceBefore = $existingRow ? (float) $existingRow->balance : 0.0;
                $totalDaysBefore = $existingRow ? (float) $existingRow->total_days : 0.0;

                if ($creditStatus === 'ineligible') {
                    $balanceAfter = $balanceBefore;
                    $totalDaysAfter = $totalDaysBefore;
                } else {
                    $balanceAfter = round($balanceBefore + $accrualEarned, 4);
                    $totalDaysAfter = round($totalDaysBefore + $accrualEarned, 4);
                }

                $previews[] = [
                    'employee_id' => $employee['employee_id'],
                    'name' => $employee['name'],
                    'department' => $employee['department'],
                    'employment_classification' => $employee['employment_classification'],
                    'avatar_url' => $employee['avatar_url'],
                    'leave_type_id' => $leaveType->leave_type_id,
                    'leave_type_name' => $leaveType->leave_type_name,
                    'minutes_worked' => $tmw,
                    'accrual_earned' => $accrualEarned,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'total_days_after' => $totalDaysAfter,  // used by post() only
                    'credit_status' => $creditStatus,
                ];
            }
        }

        return $previews;
    }

    private function getHistory(?int $year = null, ?int $month = null): Collection
    {
        $query = LeaveAccrualPosting::with(
            'records.employee.basicInfo',
            'records.employee.item.position.department',
            'records.leaveType'
        )
            ->where('status', 'posted');

        if ($year) {
            $query->where('posting_year', $year);
        }
        if ($month) {
            $query->where('posting_month', $month);
        }

        return $query
            ->orderByDesc('posting_year')
            ->orderByDesc('posting_month')
            ->get()
            ->flatMap(function (LeaveAccrualPosting $posting) {
                return $posting->records
                    ->groupBy('employee_id')
                    ->map(function ($records) use ($posting) {
                        $first = $records->first();

                        // Per-leave-type breakdown for the detail dialog —
                        // each entry carries its own accrual_earned,
                        // balance_before, and balance_after.
                        $leaveCredits = $records->map(fn (LeaveAccrualRecord $r) => [
                            'leave_type_id' => $r->leave_type_id,
                            'leave_type_name' => $r->leaveType?->leave_type_name ?? '—',
                            'accrual_earned' => (float) $r->accrual_earned,
                            'balance_before' => (float) $r->balance_before,
                            'balance_after' => (float) $r->balance_after,
                        ])->values()->all();

                        return [
                            'posting_id' => $posting->leave_accrual_posting_id,
                            'posting_month' => $posting->posting_month,
                            'posting_year' => $posting->posting_year,
                            'employee_id' => $first->employee_id,
                            'name' => $first->employee?->basicInfo?->full_name ?? '—',
                            'department' => $first->employee?->item?->position?->department?->department_name ?? '—',
                            'employment_classification' => $first->employee?->employment_classification ?? '—',
                            'avatar_url' => $first->employee?->avatar_url,
                            // Kept for table column display and search
                            'leave_type_name' => $records->map(fn ($r) => $r->leaveType?->leave_type_name)->filter()->join(', '),
                            'minutes_worked' => $first->minutes_worked,
                            'credit_status' => $first->credit_status,
                            'reference_no' => $posting->reference_no,
                            'posting_date' => $posting->updated_at->format('F d, Y'),
                            'status' => $posting->status,
                            // Per-leave-type breakdown for the detail dialog
                            'leave_credits' => $leaveCredits,
                        ];
                    })
                    ->values();
            });
    }
}
