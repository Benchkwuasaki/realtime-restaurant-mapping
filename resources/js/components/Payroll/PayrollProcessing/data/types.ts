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
 * One itemized deduction line returned by the compute endpoint and written
 * to the payroll_deduction_items ledger on finalize.
 *
 * Replaces the opaque internal_org_items / other_deduction_items arrays
 * that had inconsistent shapes across the two source tables.
 */
export interface DeductionLineItem {
    id: number;
    /** Matches PayrollDeductionPriorityOrder category constants */
    category:
        | 'government_loan'
        | 'internal_org_savings'
        | 'internal_org_loan'
        | 'internal_org_dues'
        | 'water_bill'
        | 'other_miscellaneous';
    /** Which DB table produced this item */
    source_type:
        | 'government_loan'
        | 'internal_org_deduction'
        | 'internal_org_loan'
        | 'other_deduction'
        | 'water_bill'
        | 'miscellaneous';
    /** Human-readable label, e.g. "GSIS MPL", "AMA Savings" */
    label: string;
    /** Organisation name for org items; null for statutory/misc */
    org_name: string | null;
    /** Description from the source record */
    description: string;
    amount: number;
    /**
     * Legacy type discriminator kept for backward compat with existing
     * waiver UI. 'water_bill' routes to the water_bill column bucket;
     * 'other' routes to other_deductions_total.
     */
    type: 'water_bill' | 'other';
}

/**
 * The shape of each record returned by processNew() and sent to finalizePayroll().
 * Replaces the previous ComputedRecord interface defined inline in Index.tsx.
 */
export interface ComputedRecord {
    employee_id: number;
    employee_name: string;

    // ── Earnings ──────────────────────────────────────────────────────────────
    basic_pay: number;
    pera: number;
    rice_allowance: number;
    uniform_allowance: number;
    overtime_pay: number;
    gross_pay: number;

    // ── Attendance ─────────────────────────────────────────────────────────────
    half_days: number;
    half_day_deduction: number;
    absent_days: number;
    absent_deduction: number;
    late_minutes: number;
    late_deduction: number;
    undertime_minutes: number;
    undertime_deduction: number;
    personal_slip_minutes: number;
    personal_slip_deduction: number;
    official_slip_minutes: number;   // display only — no deduction
    total_work_days: number;
    total_hours_worked: number;
    total_overtime_hours: number;

    // ── Statutory deductions ──────────────────────────────────────────────────
    gsis_premium: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;

    // ── Gov't loan deductions ─────────────────────────────────────────────────
    gsis_mpl: number;
    gsis_emergency: number;
    pag_ibig_mpl: number;

    // ── Internal org deductions ───────────────────────────────────────────────
    internal_org_savings: number;   // Savings + Share_Capital (both cut-offs)
    internal_org_second: number;    // Dues (2nd cut-off, for display)
    internal_org_loans: number;     // Loan repayments total (genuine loans)
    internal_org_deductions: number; // savings + second + loans combined

    // ── Other / miscellaneous deductions ──────────────────────────────────────
    /**
     * Renamed from ama_y2k_union.
     * Aggregate of: internal org loans + dues + NS&ND + miscellaneous.
     * Use deduction_items for per-line breakdown.
     */
    other_deductions_total: number;
    water_bill: number;
    other_deductions: number;       // non-water misc sub-total

    // ── Itemized breakdown (for drill-down UI and ledger writes) ──────────────
    internal_org_items: DeductionLineItem[];
    other_deduction_items: DeductionLineItem[];

    // ── Totals ────────────────────────────────────────────────────────────────
    total_deductions: number;
    net_pay: number;
    floor_check_passed: boolean;
    floor_cut_amount: number;
    status: string;
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
    attendanceDeduction: number;
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
    status: string;
}

/**
 * A single entry in the deductionPriorityOrder prop passed from the controller.
 * Replaces the hardcoded WAIVABLE_DEDUCTIONS constant in Index.tsx.
 */
export interface DeductionPriorityEntry {
    key: string;
    label: string;
    group: string;
    cuttability: 'Never' | 'Rarely' | 'Yes' | 'First_to_Cut';
    priority: number;
}