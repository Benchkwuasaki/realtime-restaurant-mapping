// Payroll/Configuration/StepIncrement/data/schema.ts

import { z } from 'zod';

export const stepIncrementEmployeeSchema = z.object({
    employee_id: z.number(),
    name: z.string(),
    employment_classification: z.string().nullable(),
    salary_grade: z.number().nullable(),
    step: z.number().nullable(),
    monthly_salary: z.number().nullable(),
    salary_grade_step_id: z.number(),
});

export type StepIncrementEmployee = z.infer<typeof stepIncrementEmployeeSchema>;
