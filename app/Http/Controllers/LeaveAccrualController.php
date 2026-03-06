<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveAccrualPosting;
use App\Models\LeaveAccrualRecord;
use App\Models\LeaveType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeaveAccrualController extends Controller
{
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

        [
            'work_days' => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'step' => 2,
            'period' => compact('month', 'year'),
            'work_days' => $workDays,
            'total_days' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
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

        [
            'work_days' => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        $previewCollection = collect($previews);
        $fullCount = $previewCollection->where('credit_status', 'full_credit')->pluck('employee_id')->unique()->count();
        $proratedCount = $previewCollection->where('credit_status', 'prorated')->pluck('employee_id')->unique()->count();
        $ineligibleCount = $previewCollection->where('credit_status', 'ineligible')->pluck('employee_id')->unique()->count();

        $user = Auth::user();
        $refNo = 'LP-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . $year;

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'step' => 3,
            'period' => compact('month', 'year'),
            'work_days' => $workDays,
            'total_days' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
            'previews' => $previews,
            'leave_types' => $leaveTypes,
            'leave_type_ids' => $leaveTypeIds,
            'available_leave_types' => $availableLeaveTypes,
            'summary' => [
                'total_eligible' => $fullCount + $proratedCount,
                'full_credit' => $fullCount,
                'prorated' => $proratedCount,
                'ineligible' => $ineligibleCount,
                'work_days' => $workDays,
                'total_days' => $totalDays,
                'total_sundays' => $totalSundays,
                'total_holidays' => $totalHolidays,
            ],
            'post_details' => [
                'posted_by' => $user->name ?? 'Administrator',
                'role' => $user->roles->first()?->name ?? 'HR Admin',
                'user_id_str' => 'USR-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
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

        [
            'work_days' => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::whereIn('leave_type_id', $leaveTypeIds)
            ->where('is_accrual', true)
            ->where('status', true)
            ->get();
        $previews = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        $refNo = 'LP-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . $year;

        DB::transaction(function () use ($month, $year, $workDays, $totalDays, $totalSundays, $totalHolidays, $previews, $refNo) {
            $posting = LeaveAccrualPosting::create([
                'posting_month' => $month,
                'posting_year' => $year,
                'total_days_in_month' => $totalDays,
                'total_sundays' => $totalSundays,
                'total_holidays' => $totalHolidays,
                'work_days' => $workDays,
                'posted_by_user_id' => Auth::id(),
                'reference_no' => $refNo,
                'status' => 'posted',
            ]);

            foreach ($previews as $preview) {
                LeaveAccrualRecord::create([
                    'leave_accrual_posting_id' => $posting->leave_accrual_posting_id,
                    'employee_id' => $preview['employee_id'],
                    'leave_type_id' => $preview['leave_type_id'],
                    'attendance_days' => $preview['attendance_days'],
                    'accrual_earned' => $preview['accrual_earned'],
                    'balance_before' => $preview['balance_before'],
                    'balance_after' => $preview['balance_after'],
                    'credit_status' => $preview['credit_status'],
                ]);

                // Accumulate into employee_leave_balances.
                // cycle_year: fiscal year convention — H1 belongs to previous year's cycle.
                $cycleYear = $year;
                EmployeeLeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $preview['employee_id'],
                        'leave_type_id' => $preview['leave_type_id'],
                        'cycle_year' => $cycleYear,
                    ],
                    [
                        'balance' => $preview['balance_after'],
                        'total_days' => $preview['balance_after'],
                    ]
                );
            }
        });

        // After posting, redirect to the step 4 review for this period
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

        // Rebuild the pivoted preview rows from actual posted records
        $postedPreviews = $posting->records->map(fn(LeaveAccrualRecord $r) => [
            'employee_id' => $r->employee_id,
            'name' => $r->employee?->basicInfo?->full_name ?? '—',
            'department' => $r->employee?->item?->position?->department?->department_name ?? '—',
            'employment_classification' => $r->employee?->employment_classification ?? '—',
            'avatar_url' => $r->employee?->avatar_url,
            'leave_type_id' => $r->leave_type_id,
            'leave_type_name' => $r->leaveType?->leave_type_name ?? '—',
            'attendance_days' => $r->attendance_days,
            'accrual_earned' => (float) $r->accrual_earned,
            'balance_before' => (float) $r->balance_before,
            'balance_after' => (float) $r->balance_after,
            'credit_status' => $r->credit_status,
        ])->values()->all();

        // Unique leave types in this posting
        $leaveTypes = $posting->records
            ->map(fn($r) => [
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

    public function balances()
    {
        $currentYear = (int) date('Y');

        $availableLeaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        $leaveTypes = LeaveType::where('is_accrual', true)
            ->where('status', true)
            ->get(['leave_type_id', 'leave_type_name']);

        $grouped = Employee::with([
            'basicInfo',
            'item.position.department',
            'leaveBalances' => fn($q) => $q->where('cycle_year', $currentYear)->with('leaveType'),
        ])
            ->where('status', true)
            ->get()
            ->filter(fn($e) => $e->leaveBalances->isNotEmpty())
            ->map(fn($e) => [
                'employee_id' => $e->employee_id,
                'name' => $e->basicInfo?->full_name ?? '—',
                'avatar_url' => $e->avatar_url,
                'department' => $e->item?->position?->department?->department_name ?? '—',
                'employment_classification' => $e->employment_classification ?? '—',
                'leave_balances' => $e->leaveBalances->map(fn($b) => [
                    'leave_type_id' => $b->leave_type_id,
                    'leave_type_name' => $b->leaveType?->leave_type_name ?? '—',
                    'total_days' => (float) $b->total_days,
                    'used_days' => (float) $b->used_days,
                    'balance' => (float) $b->balance,
                ])->values()->all(),
            ])
            ->sortBy('name')
            ->values();

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'tab' => 'balances',
            'available_leave_types' => $availableLeaveTypes,
            'balances_data' => $grouped,
            'balances_leave_types' => $leaveTypes,
            'balances_cycle_year' => $currentYear,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function computeWorkDays(int $month, int $year): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $totalDays = $end->day;
        $totalSundays = 0;

        foreach (CarbonPeriod::create($start, $end) as $day) {
            if ($day->isSunday())
                $totalSundays++;
        }

        $totalHolidays = DB::table('holidays')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->count();

        $workDays = $totalDays - $totalSundays - $totalHolidays;

        return [
            'total_days_in_month' => $totalDays,
            'total_sundays' => $totalSundays,
            'total_holidays' => $totalHolidays,
            'work_days' => $workDays,
        ];
    }

    private function getEmployeesWithAttendance(int $month, int $year): \Illuminate\Support\Collection
    {
        return Employee::with(['basicInfo', 'item.position.department'])
            ->where('status', true)
            ->get()
            ->map(function (Employee $employee) use ($month, $year) {
                $attendanceDays = DB::table('attendance_records')
                    ->where('employee_id', $employee->employee_id)
                    ->whereMonth('created_at', $month)
                    ->whereYear('created_at', $year)
                    ->where(function ($q) {
                        $q->whereNotNull('recognition_morning_in_id')
                            ->orWhereNotNull('recognition_afternoon_in_id');
                    })
                    ->count();

                return [
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->basicInfo?->full_name ?? '—',
                    'department' => $employee->item?->position?->department?->department_name ?? '—',
                    'employment_classification' => $employee->employment_classification,
                    'avatar_url' => $employee->avatar_url,
                    'attendance_days' => $attendanceDays,
                ];
            });
    }

    private function buildPreviews(
        \Illuminate\Support\Collection $employees,
        \Illuminate\Support\Collection $leaveTypes,
        int $workDays,
        int $month,
        int $year
    ): array {
        $previews = [];
        $leaveTypeIds = $leaveTypes->pluck('leave_type_id')->all();
        $employeeIds = $employees->pluck('employee_id')->all();

        // Pre-load balances for current cycle year to get accurate balance_before
        $cycleYear = $year;

        $balances = DB::table('employee_leave_balances')
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('leave_type_id', $leaveTypeIds)
            ->where('cycle_year', $cycleYear)
            ->get()
            ->keyBy(fn($row) => "{$row->employee_id}_{$row->leave_type_id}");

        foreach ($employees as $employee) {
            $attendanceDays = $employee['attendance_days'];

            if ($attendanceDays === 0) {
                $creditStatus = 'ineligible';
            } elseif ($attendanceDays >= $workDays) {
                $creditStatus = 'full_credit';
            } else {
                $creditStatus = 'prorated';
            }

            $accrualEarned = $workDays > 0
                ? round(($workDays / 1.25) * $attendanceDays, 4)
                : 0;

            foreach ($leaveTypes as $leaveType) {
                $balanceKey = "{$employee['employee_id']}_{$leaveType->leave_type_id}";
                $balanceBefore = isset($balances[$balanceKey])
                    ? (float) $balances[$balanceKey]->balance
                    : 0.0;

                $balanceAfter = $creditStatus === 'ineligible'
                    ? $balanceBefore
                    : round($balanceBefore + $accrualEarned, 4);

                $previews[] = [
                    'employee_id' => $employee['employee_id'],
                    'name' => $employee['name'],
                    'department' => $employee['department'],
                    'employment_classification' => $employee['employment_classification'],
                    'avatar_url' => $employee['avatar_url'],
                    'leave_type_id' => $leaveType->leave_type_id,
                    'leave_type_name' => $leaveType->leave_type_name,
                    'attendance_days' => $attendanceDays,
                    'accrual_earned' => $accrualEarned,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'credit_status' => $creditStatus,
                ];
            }
        }

        return $previews;
    }

    private function getHistory(?int $year = null, ?int $month = null): \Illuminate\Support\Collection
    {
        $query = LeaveAccrualPosting::with('records.employee.basicInfo', 'records.leaveType')
            ->where('status', 'posted');

        if ($year)
            $query->where('posting_year', $year);
        if ($month)
            $query->where('posting_month', $month);

        return $query
            ->orderByDesc('posting_year')
            ->orderByDesc('posting_month')
            ->get()
            ->flatMap(function (LeaveAccrualPosting $posting) {
                return $posting->records
                    ->groupBy('employee_id')
                    ->map(function ($records) use ($posting) {
                        $first = $records->first();

                        return [
                            'posting_id' => $posting->leave_accrual_posting_id,
                            'posting_month' => $posting->posting_month,
                            'posting_year' => $posting->posting_year,
                            'employee_id' => $first->employee_id,
                            'name' => $first->employee?->basicInfo?->full_name ?? '—',
                            'department' => $first->employee?->item?->position?->department?->department_name ?? '—',
                            'employment_classification' => $first->employee?->employment_classification ?? '—',
                            'avatar_url' => $first->employee?->avatar_url,
                            'leave_type_name' => $records->map(fn($r) => $r->leaveType?->leave_type_name)->filter()->join(', '),
                            'accrual_earned' => (float) $records->sum('accrual_earned'),
                            'balance_before' => (float) $first->balance_before,
                            'balance_after' => (float) $records->last()->balance_after,
                            'credit_status' => $first->credit_status,
                            'reference_no' => $posting->reference_no,
                            'posting_date' => $posting->updated_at->format('F d, Y'),
                            'status' => $posting->status,
                        ];
                    })
                    ->values();
            });
    }
}