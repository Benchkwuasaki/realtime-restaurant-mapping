// Pay Slip Generation data/schema.tsx

import { z } from 'zod';

export const employeeOptionSchema = z.object({
    employee_id: z.number(),
    full_name: z.string(),
    employment_classification: z.string(),
});

export const payrollPeriodSchema = z.object({
    payroll_period_id: z.number(),
    label: z.string(),
    start_date: z.string(),
    end_date: z.string(),
});

export const payslipDataSchema = z.object({
    employee_name: z.string(),
    position: z.string(),
    salary_grade: z.number(),
    step: z.number(),
    employment_classification: z.string(),
    period_label: z.string(),

    // ── Earnings ──────────────────────────────────────────────────────────────
    basic_pay: z.number(),
    pera: z.number(),
    rice_allowance: z.number(),
    uniform_allowance: z.number(),

    // ── Mandatory deductions ──────────────────────────────────────────────────
    gsis_premium: z.number(),
    philhealth: z.number(),
    pag_ibig: z.number(),
    withholding_tax: z.number(),

    // ── Attendance deductions ─────────────────────────────────────────────────
    absent_days: z.number(),
    absent_deduction: z.number(),
    half_days: z.number(),
    half_day_deduction: z.number(),
    late_minutes: z.number(),
    late_deduction: z.number(),
    undertime_minutes: z.number(),
    undertime_deduction: z.number(),
    personal_slip_minutes: z.number(),
    personal_slip_deduction: z.number(),

    // ── Gov't loan deductions ─────────────────────────────────────────────────
    gsis_mpl: z.number(),
    gsis_emergency: z.number(),
    pag_ibig_mpl: z.number(),

    // ── Internal org deductions ───────────────────────────────────────────────
    internal_org_savings: z.number(),
    internal_org_second: z.number(),
    internal_org_loans: z.number(),

    // ── Other / misc deductions (renamed from ama_y2k_union) ─────────────────
    other_deductions_total: z.number(),
    water_bill: z.number(),

    // ── Totals ────────────────────────────────────────────────────────────────
    net_pay: z.number(),

    floor_check_passed: z.boolean(),
    posted_date: z.string(),
    hr_officer: z.string(),
});

export type EmployeeOption = z.infer<typeof employeeOptionSchema>;
export type PayrollPeriod = z.infer<typeof payrollPeriodSchema>;
export type PayslipData = z.infer<typeof payslipDataSchema>;
