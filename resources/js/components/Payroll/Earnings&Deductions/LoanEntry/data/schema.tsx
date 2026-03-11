// Loan Entry data/schema.tsx

import { z } from 'zod';

export const loanSchema = z.object({
    id: z.number(),
    employee_id: z.number(),
    employee_name: z.string(),
    employee_position: z.string().nullable().optional(),
    loan_type: z.string(),
    source: z.string(),
    total_amount: z.number(),
    monthly_amortization: z.number(),
    semi_monthly_deduction: z.number(),
    balance: z.number(),
    start_period: z.string(), // "YYYY-MM"
    end_period: z.string(), // "YYYY-MM"
    status: z.enum(['Active', 'Completed', 'Suspended']),
});

export type Loan = z.infer<typeof loanSchema>;
