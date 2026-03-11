import { z } from "zod"

export const officeSchema = z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string(),
})

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
    department_acronym: z.string(),
})

export const incomingRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    from_office: officeSchema.nullable(),
    office_status: z.enum(["pending_receipt", "received", "done"]),
    status: z.enum(["filed", "in_progress", "completed", "cancelled"]),
    days_stayed: z.string(),
    origin_office_id: z.number(),
    current_office_id: z.number(),
    // Per-document office lists computed by the controller
    forward_offices: z.array(departmentSchema).default([]),
    return_offices: z.array(departmentSchema).default([]),
})

export type Office = z.infer<typeof officeSchema>
export type Department = z.infer<typeof departmentSchema>
export type IncomingRow = z.infer<typeof incomingRowSchema>