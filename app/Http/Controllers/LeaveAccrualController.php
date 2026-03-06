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
    // Step 1 – Landing / Select Period
    // GET /leave/accrual
    // ─────────────────────────────────────────────────────────────────────────

    public function index()
    {
        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'history' => $this->getHistory(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 – Preview computed credits for a given month/year
    // GET /leave/accrual/preview?month=3&year=2026
    // ─────────────────────────────────────────────────────────────────────────

    public function preview(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) $request->month;
        $year  = (int) $request->year;

        // Guard: already posted?
        $alreadyPosted = LeaveAccrualPosting::where('posting_month', $month)
            ->where('posting_year', $year)
            ->where('status', 'posted')
            ->exists();

        if ($alreadyPosted) {
            return back()->withErrors(['period' => "Leave accrual for {$month}/{$year} has already been posted."]);
        }

        [
            'work_days'           => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays'       => $totalSundays,
            'total_holidays'      => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees   = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes  = LeaveType::where('is_accrual', true)->where('status', true)->get();
        $previews    = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'history'         => $this->getHistory(),
            'step'            => 2,
            'period'          => compact('month', 'year'),
            'work_days'       => $workDays,
            'total_days'      => $totalDays,
            'total_sundays'   => $totalSundays,
            'total_holidays'  => $totalHolidays,
            'previews'        => $previews,
            'leave_types'     => $leaveTypes,
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
            'year'  => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) $request->month;
        $year  = (int) $request->year;

        [
            'work_days'           => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays'       => $totalSundays,
            'total_holidays'      => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees  = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::where('is_accrual', true)->where('status', true)->get();
        $previews   = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        $fullCount      = collect($previews)->where('credit_status', 'full_credit')->pluck('employee_id')->unique()->count();
        $proratedCount  = collect($previews)->where('credit_status', 'prorated')->pluck('employee_id')->unique()->count();
        $ineligibleCount= collect($previews)->where('credit_status', 'ineligible')->pluck('employee_id')->unique()->count();

        $user = Auth::user();
        $refNo = 'LP-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . $year;

        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'history'          => $this->getHistory(),
            'step'             => 4,
            'period'           => compact('month', 'year'),
            'work_days'        => $workDays,
            'total_days'       => $totalDays,
            'total_sundays'    => $totalSundays,
            'total_holidays'   => $totalHolidays,
            'previews'         => $previews,
            'leave_types'      => $leaveTypes,
            'summary'          => [
                'total_eligible'   => $fullCount + $proratedCount,
                'full_credit'      => $fullCount,
                'prorated'         => $proratedCount,
                'ineligible'       => $ineligibleCount,
            ],
            'post_details'     => [
                'posted_by'   => $user->name ?? 'Administrator',
                'role'        => $user->roles->first()?->name ?? 'HR Admin',
                'user_id_str' => 'USR-' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'posting_date'=> now()->format('F d, Y'),
                'reference_no'=> $refNo,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4 – Post (persist to DB)
    // POST /leave/accrual/post
    // ─────────────────────────────────────────────────────────────────────────

    public function post(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) $request->month;
        $year  = (int) $request->year;

        // Final guard against duplicate posting
        $alreadyPosted = LeaveAccrualPosting::where('posting_month', $month)
            ->where('posting_year', $year)
            ->where('status', 'posted')
            ->exists();

        if ($alreadyPosted) {
            return back()->withErrors(['period' => "Leave accrual for {$month}/{$year} has already been posted."]);
        }

        [
            'work_days'           => $workDays,
            'total_days_in_month' => $totalDays,
            'total_sundays'       => $totalSundays,
            'total_holidays'      => $totalHolidays,
        ] = $this->computeWorkDays($month, $year);

        $employees  = $this->getEmployeesWithAttendance($month, $year);
        $leaveTypes = LeaveType::where('is_accrual', true)->where('status', true)->get();
        $previews   = $this->buildPreviews($employees, $leaveTypes, $workDays, $month, $year);

        $refNo = 'LP-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-' . $year;

        DB::transaction(function () use (
            $month, $year, $workDays, $totalDays, $totalSundays, $totalHolidays,
            $previews, $refNo
        ) {
            $posting = LeaveAccrualPosting::create([
                'posting_month'       => $month,
                'posting_year'        => $year,
                'total_days_in_month' => $totalDays,
                'total_sundays'       => $totalSundays,
                'total_holidays'      => $totalHolidays,
                'work_days'           => $workDays,
                'posted_by_user_id'   => Auth::id(),
                'reference_no'        => $refNo,
                'status'              => 'posted',
            ]);

            foreach ($previews as $preview) {
                LeaveAccrualRecord::create([
                    'leave_accrual_posting_id' => $posting->leave_accrual_posting_id,
                    'employee_id'              => $preview['employee_id'],
                    'leave_type_id'            => $preview['leave_type_id'],
                    'attendance_days'           => $preview['attendance_days'],
                    'accrual_earned'            => $preview['accrual_earned'],
                    'balance_before'            => $preview['balance_before'],
                    'balance_after'             => $preview['balance_after'],
                    'credit_status'             => $preview['credit_status'],
                ]);

                // Update or create the employee's running leave balance
                EmployeeLeaveBalance::updateOrCreate(
                    [
                        'employee_id'   => $preview['employee_id'],
                        'leave_type_id' => $preview['leave_type_id'],
                    ],
                    [
                        'balance' => $preview['balance_after'],
                    ]
                );
            }
        });

        return redirect()->route('leave.accrual.index')
            ->with('success', "Leave accrual for {$month}/{$year} posted successfully.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Transaction History (standalone view triggered by "View Transaction History")
    // GET /leave/accrual/history
    // ─────────────────────────────────────────────────────────────────────────

    public function history()
    {
        return Inertia::render('Leave/MonthlyEarnedLeave/Index', [
            'history' => $this->getHistory(),
            'step'    => 5,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compute work_days for a given month/year.
     *
     * work_days = total_days_in_month
     *           - total_sundays_in_month
     *           - total_holidays_in_month
     */
    private function computeWorkDays(int $month, int $year): array
    {
        $start = Carbon::create($year, $month, 1)->startOfDay();
        $end   = $start->copy()->endOfMonth();

        $totalDays    = $end->day;
        $totalSundays = 0;

        $period = CarbonPeriod::create($start, $end);
        foreach ($period as $day) {
            if ($day->isSunday()) {
                $totalSundays++;
            }
        }

        // Fetch holidays from your existing holidays table for this month/year
        $totalHolidays = DB::table('holidays')
            ->whereMonth('holiday_date', $month)
            ->whereYear('holiday_date', $year)
            ->count();

        $workDays = $totalDays - $totalSundays - $totalHolidays;

        return compact('totalDays', 'totalSundays', 'totalHolidays', 'workDays');
    }

    /**
     * Load all active employees with their attendance day count for the period.
     *
     * employee_total_attendance_days =
     *   total_hours_rendered / (shift_end - shift_start - break_duration)
     *
     * Since we don't track break times per-record, we count any attendance_record
     * row where at least one recognition slot is non-null as 1 attendance day.
     * (A full day = morning_in OR afternoon_in present.)
     */
    private function getEmployeesWithAttendance(int $month, int $year): \Illuminate\Support\Collection
    {
        return Employee::with([
            'basicInfo',
            'item.position.department',
        ])
        ->where('status', true)
        ->get()
        ->map(function (Employee $employee) use ($month, $year) {
            // Count distinct days the employee has any presence in this month
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
                'employee_id'             => $employee->employee_id,
                'name'                    => $employee->basicInfo?->full_name ?? '—',
                'department'              => $employee->item?->position?->department?->department_name ?? '—',
                'employment_classification' => $employee->employment_classification,
                'avatar_url'              => $employee->avatar_url,
                'attendance_days'         => $attendanceDays,
            ];
        });
    }

    /**
     * Build preview rows for every employee × every accrual-eligible leave type.
     *
     * leave_accrual = (work_days / 1.25) * employee_total_attendance_days
     *
     * credit_status:
     *   full_credit  – attended every work day
     *   prorated     – attended at least 1 day but not all
     *   ineligible   – 0 attendance days
     */
    private function buildPreviews(
        \Illuminate\Support\Collection $employees,
        \Illuminate\Support\Collection $leaveTypes,
        int $workDays,
        int $month,
        int $year
    ): array {
        $previews = [];

        // Pre-load existing balances to avoid N+1
        $leaveTypeIds  = $leaveTypes->pluck('leave_type_id')->all();
        $employeeIds   = $employees->pluck('employee_id')->all();

        $balances = DB::table('employee_leave_balances')
            ->whereIn('employee_id', $employeeIds)
            ->whereIn('leave_type_id', $leaveTypeIds)
            ->get()
            ->keyBy(fn($row) => "{$row->employee_id}_{$row->leave_type_id}");

        foreach ($employees as $employee) {
            $attendanceDays = $employee['attendance_days'];

            // Determine credit status
            if ($attendanceDays === 0) {
                $creditStatus = 'ineligible';
            } elseif ($attendanceDays >= $workDays) {
                $creditStatus = 'full_credit';
            } else {
                $creditStatus = 'prorated';
            }

            // Formula: leave_accrual = (work_days / 1.25) * attendance_days
            // When work_days = 0, accrual is 0 to avoid division oddity
            $accrualEarned = $workDays > 0
                ? round(($workDays / 1.25) * $attendanceDays, 4)
                : 0;

            foreach ($leaveTypes as $leaveType) {
                $balanceKey    = "{$employee['employee_id']}_{$leaveType->leave_type_id}";
                $balanceBefore = isset($balances[$balanceKey])
                    ? (float) $balances[$balanceKey]->balance
                    : 0.0;

                $balanceAfter = $creditStatus === 'ineligible'
                    ? $balanceBefore
                    : round($balanceBefore + $accrualEarned, 4);

                $previews[] = [
                    'employee_id'              => $employee['employee_id'],
                    'name'                     => $employee['name'],
                    'department'               => $employee['department'],
                    'employment_classification'=> $employee['employment_classification'],
                    'avatar_url'               => $employee['avatar_url'],
                    'leave_type_id'            => $leaveType->leave_type_id,
                    'leave_type_name'          => $leaveType->leave_type_name,
                    'attendance_days'          => $attendanceDays,
                    'accrual_earned'           => $accrualEarned,
                    'balance_before'           => $balanceBefore,
                    'balance_after'            => $balanceAfter,
                    'credit_status'            => $creditStatus,
                ];
            }
        }

        return $previews;
    }

    /**
     * Load posted history for the transaction history view.
     */
    private function getHistory(): \Illuminate\Support\Collection
    {
        return LeaveAccrualPosting::with('records.employee.basicInfo', 'records.leaveType')
            ->where('status', 'posted')
            ->orderByDesc('posting_year')
            ->orderByDesc('posting_month')
            ->get()
            ->flatMap(function (LeaveAccrualPosting $posting) {
                return $posting->records->map(fn(LeaveAccrualRecord $record) => [
                    'posting_id'               => $posting->leave_accrual_posting_id,
                    'employee_id'              => $record->employee_id,
                    'name'                     => $record->employee?->basicInfo?->full_name ?? '—',
                    'department'               => $record->employee?->item?->position?->department?->department_name ?? '—',
                    'employment_classification'=> $record->employee?->employment_classification ?? '—',
                    'avatar_url'               => $record->employee?->avatar_url,
                    'leave_type_name'          => $record->leaveType?->leave_type_name ?? '—',
                    'balance_after'            => $record->balance_after,
                    'reference_no'             => $posting->reference_no,
                    'posting_date'             => $posting->updated_at->format('F d, Y'),
                    'status'                   => $posting->status,
                ]);
            });
    }
}