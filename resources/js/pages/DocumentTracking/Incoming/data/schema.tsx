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

export const historyOfficeSchema = z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string(),
})

export const historyActionSchema = z.object({
    id: z.number(),
    action: z.string(),
    label: z.string(),
    remarks: z.string().nullable(),
    acted_at: z.string().nullable(),
    actor_name: z.string().nullable(),
    office: historyOfficeSchema.nullable(),
    from_office: historyOfficeSchema.nullable(),
    to_office: historyOfficeSchema.nullable(),
})

export const historyDetailsSchema = z.object({
    title: z.string(),
    notes: z.string().nullable(),
    status: z.string(),
    office_status: z.string().nullable(),
    elapsed_time: z.string().nullable(),
    origin_office: historyOfficeSchema.nullable(),
    current_office: historyOfficeSchema.nullable(),
    final_office: historyOfficeSchema.nullable(),
    flow: z.array(z.object({
        office: historyOfficeSchema,
        action: z.string().nullable(),
    })),
    actions: z.array(historyActionSchema),
})

export const incomingRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    from_office: officeSchema.nullable(),
    office_status: z.enum(["pending_receipt", "received", "done"]),
    status: z.enum(["filed", "in_progress", "completed", "cancelled"]),
    elapsed_time: z.string(),
    origin_office_id: z.number(),
    current_office_id: z.number(),
    details: historyDetailsSchema,
    // Per-document office lists computed by the controller
    forward_offices: z.array(departmentSchema).default([]),
    return_offices: z.array(departmentSchema).default([]),
})

export type Office = z.infer<typeof officeSchema>
export type Department = z.infer<typeof departmentSchema>
export type IncomingRow = z.infer<typeof incomingRowSchema>
