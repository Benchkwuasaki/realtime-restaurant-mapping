import { z } from "zod"

export const officeSchema = z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string(),
})

export const outgoingRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    origin_office: officeSchema.nullable(),
    current_office: officeSchema.nullable(),
    status: z.enum(["filed", "in_progress", "completed", "cancelled"]),
    office_status: z.enum(["pending_receipt", "received", "done"]),
    days_stayed: z.string(),
    origin_office_id: z.number(),
})

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
    department_acronym: z.string(),
})

export type Office = z.infer<typeof officeSchema>
export type OutgoingRow = z.infer<typeof outgoingRowSchema>
export type Department = z.infer<typeof departmentSchema>