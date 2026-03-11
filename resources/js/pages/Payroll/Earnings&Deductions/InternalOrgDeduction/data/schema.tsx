// Payroll/Earnings&Deductions/InternalOrgDeduction/data/schema.ts

import { z } from 'zod';

export const SERVICE_CATEGORIES = [
    'Loan',
    'Savings',
    'Dues',
    'Share_Capital',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
    Loan: 'Loan',
    Savings: 'Savings',
    Dues: 'Dues',
    Share_Capital: 'Share Capital',
};

/** Which cut-off each category applies to — mirrors InternalOrganizationService constants */
export const SERVICE_CATEGORY_CUTOFF: Record<ServiceCategory, '1st & 2nd' | '2nd only'> = {
    Savings: '1st & 2nd',
    Share_Capital: '1st & 2nd',
    Loan: '2nd only',
    Dues: '2nd only',
};

export const internalOrgDeductionSchema = z.object({
    id: z.number(),
    employee_id: z.number(),
    employee_name: z.string(),
    internal_organization_id: z.string(),
    organization_name: z.string().nullable().optional(),
    internal_organization_service_id: z.number().nullable().optional(),
    service_name: z.string().nullable().optional(),
    service_category: z.enum(SERVICE_CATEGORIES).nullable().optional(),
    description: z.string().nullable().optional(),
    amount: z.number(),
    period_start: z.string(),
    period_end: z.string(),
    tab_key: z.string(),
});

export type InternalOrgDeduction = z.infer<typeof internalOrgDeductionSchema>;