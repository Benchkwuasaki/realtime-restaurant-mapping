// Allowance Management data/schema.tsx

import { z } from 'zod';

export const allowanceSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    monthly_salary: z.number(),
    taxable: z.boolean(),
    applicable_to: z.string().nullable().optional(),
    mandatory: z.boolean(),
    basis: z.string().nullable().optional(),
});

export type Allowance = z.infer<typeof allowanceSchema>;
