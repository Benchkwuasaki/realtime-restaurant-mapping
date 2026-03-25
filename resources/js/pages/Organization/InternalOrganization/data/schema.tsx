import { z } from "zod"

export const internalOrganizationSchema = z.object({
    internal_organization_id: z.number(),
    code: z.string(),
    name: z.string(),
    type: z.string().nullable().optional(),
    head_employee_id: z.number().nullable().optional(),
    head_name: z.string().nullable().optional(),
    payroll_deduction_linked: z.boolean(),
    status: z.boolean(), // true = Active, false = Inactive
})

export type InternalOrganization = z.infer<typeof internalOrganizationSchema>