// resources/js/pages/Payroll/Processing/types.ts

export interface PayrollEmployee {
    id: number;
    name: string;
    position: string;
    employment_classification: string;
    salary_grade: number | null;
    salary_step: number | null;
    monthly_salary: number;
    basic_pay: number;
}

/**
 * Per-employee attendance metrics held in Index.tsx state (Step 2).
 * Pre-filled by attendanceSummary() and forwarded to processNew() in Step 3.
 *
 * Sources
 * ───────
 * absent_days, half_days, late_minutes, undertime_minutes,
 * total_work_hours, total_work_days
 *   → attendance_records
 *     Confirmed columns (AttendanceRecord.php): work_minutes (INT), late_minutes (INT)
 *
 * personal_slip_minutes
 *   → whereabout_slips WHERE purpose_type = 'personal'
 *        AND return_status = 'returned' AND minutes_gone IS NOT NULL
 *   → CHARGEABLE: deducted from payroll at the per-minute rate
 *
 * official_slip_minutes
 *   → whereabout_slips WHERE purpose_type = 'official'
 *        AND return_status = 'returned' AND minutes_gone IS NOT NULL
 *   → AUTHORISED: shown for transparency only, never deducted from payroll
 *
 * total_overtime_hours
 *   → always 0 from server; editable by HR in Step 2
 */
export interface AttendanceRecord {
    // ── Absence ──────────────────────────────────────────────────────────────
    absent_days: number;            // float — 1.0 = full absent, 0.5 = half-day
    half_days: number;              // integer count of HALF_DAY status records

    // ── Time deviations ───────────────────────────────────────────────────────
    late_minutes: number;           // SUM(late_minutes) from attendance_records
    undertime_minutes: number;      // derived: 480 − work_minutes − late − slips

    // ── Slip deductions (from whereabout_slips) ───────────────────────────────
    personal_slip_minutes: number;  // purpose_type='personal' → chargeable, deducted
    official_slip_minutes: number;  // purpose_type='official' → authorised, display only

    // ── Work metrics ──────────────────────────────────────────────────────────
    total_work_hours: number;       // SUM(work_minutes) / 60 for attended days
    total_work_days: number;        // count of PRESENT + HALF_DAY records
    total_overtime_hours: number;   // always 0 from server; editable by HR
}

/**
 * The shape of each row in the Step 5 finalized table.
 * Derived from employeesWithStatus / finalizedEmployeesWithStatus inside Index.tsx.
 */
export interface FinalizedEmployee {
    id: number;
    name: string;
    basicPay: number;
    allowances: number;
    grossPay: number;
    gsis: number;
    philhealth: number;
    pagibig: number;
    tax: number;
    otherDeductions: number;
    internalOrgDeductions: number;
    otherDeductionsMisc: number;
    // ── Attendance deductions ─────────────────────────────────────────────────
    attendanceDeduction: number;    // absent + late + undertime + personal slip
    absentDays: number;
    absentDeduction: number;
    lateMinutes: number;
    lateDeduction: number;
    undertimeMinutes: number;
    undertimeDeduction: number;
    personalSlipMinutes: number;
    personalSlipDeduction: number;
    officialSlipMinutes: number;    // display only — no payroll deduction applied
    // ── Totals ────────────────────────────────────────────────────────────────
    totalDeductions: number;
    netPay: number;
    floorPassed: boolean;
    floorCutAmount: number;
    /** 'ok' | 'low' — kept as string to match the inferred return type of finalizedEmployeesWithStatus */
    status: string;
}