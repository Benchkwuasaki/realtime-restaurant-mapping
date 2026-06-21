// Salary Grade data/schema.tsx

import { z } from 'zod';

export const salaryStepSchema = z.object({
    step: z.number().int().min(1).max(8),
    monthly_salary: z.number().nullable(),
});

export const salaryGradeRowSchema = z.object({
    salary_grade: z.number().int().min(1).max(33),
    steps: z.array(salaryStepSchema),
});

export const flatSalaryRowSchema = z.object({
    salary_grade: z.number().int().min(1).max(33),
    step_1: z.number().nullable(),
    step_2: z.number().nullable(),
    step_3: z.number().nullable(),
    step_4: z.number().nullable(),
    step_5: z.number().nullable(),
    step_6: z.number().nullable(),
    step_7: z.number().nullable(),
    step_8: z.number().nullable(),
});

export type SalaryStep = z.infer<typeof salaryStepSchema>;
export type SalaryGradeRow = z.infer<typeof salaryGradeRowSchema>;
export type FlatSalaryRow = z.infer<typeof flatSalaryRowSchema>;

export const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function flattenSalaryTable(table: SalaryGradeRow[]): FlatSalaryRow[] {
    return table.map((row) => ({
        salary_grade: row.salary_grade,
        step_1: row.steps.find((s) => s.step === 1)?.monthly_salary ?? null,
        step_2: row.steps.find((s) => s.step === 2)?.monthly_salary ?? null,
        step_3: row.steps.find((s) => s.step === 3)?.monthly_salary ?? null,
        step_4: row.steps.find((s) => s.step === 4)?.monthly_salary ?? null,
        step_5: row.steps.find((s) => s.step === 5)?.monthly_salary ?? null,
        step_6: row.steps.find((s) => s.step === 6)?.monthly_salary ?? null,
        step_7: row.steps.find((s) => s.step === 7)?.monthly_salary ?? null,
        step_8: row.steps.find((s) => s.step === 8)?.monthly_salary ?? null,
    }));
}

export const fmtPeso = (v: number | null): string =>
    v == null ? '—' : v.toLocaleString('en-PH', { minimumFractionDigits: 0 });

export const parseSalary = (raw: string): number | null => {
    const cleaned = raw.replace(/[₱,\s]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
};
