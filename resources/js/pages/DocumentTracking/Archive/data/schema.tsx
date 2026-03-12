import { z } from "zod"

export const officeSchema = z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string(),
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

export const archiveRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    origin_office: officeSchema.nullable(),
    current_office: officeSchema.nullable(),
    status: z.enum(["filed", "in_progress", "completed", "cancelled"]),
    details: historyDetailsSchema,
})

export type Office = z.infer<typeof officeSchema>
export type ArchiveRow = z.infer<typeof archiveRowSchema>
