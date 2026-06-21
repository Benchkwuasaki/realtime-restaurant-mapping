// Other Deduction Entry data/schema.tsx

import { z } from 'zod';

// TODO: Extract from database. Check this later
// HMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM

export const DEDUCTION_CATEGORIES = [
    'All Deductions',
    'AMA - Assoc. of Mutual Aide',
    'Y2K Fund',
    'MKWD Union',
    'WAA/WEA/MEA',
    'Water Bill',
    'NS & ND (COA)',
    'Miscellaneous',
] as const;

export type DeductionCategory = (typeof DEDUCTION_CATEGORIES)[number];

export const otherDeductionSchema = z.object({
    id: z.number(),
    employee_id: z.number(),
    employee_name: z.string(),
    category: z.enum(DEDUCTION_CATEGORIES),
    description: z.string().nullable().optional(),
    amount: z.number(),
    period_start: z.string(),
    period_end: z.string(),
});

export type OtherDeduction = z.infer<typeof otherDeductionSchema>;
