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

    basic_pay: z.number(),
    pera: z.number(),
    rice_allowance: z.number(),
    uniform_allowance: z.number(),

    gsis_premium: z.number(),
    philhealth: z.number(),
    pag_ibig: z.number(),
    withholding_tax: z.number(),

    absent_days: z.number(),
    absent_deduction: z.number(),
    late_minutes: z.number(),
    late_deduction: z.number(),

    gsis_mpl: z.number(),
    gsis_emergency: z.number(),
    pag_ibig_mpl: z.number(),
    ama_y2k_union: z.number(),
    water_bill: z.number(),

    net_pay: z.number(),

    floor_check_passed: z.boolean(),
    posted_date: z.string(),
    hr_officer: z.string(),
});

export type EmployeeOption = z.infer<typeof employeeOptionSchema>;
export type PayrollPeriod = z.infer<typeof payrollPeriodSchema>;
export type PayslipData = z.infer<typeof payslipDataSchema>;
