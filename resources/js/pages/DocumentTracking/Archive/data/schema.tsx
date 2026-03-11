import { z } from "zod"

export const officeSchema = z.object({
    id: z.number(),
    name: z.string(),
    acronym: z.string(),
})

export const archiveRowSchema = z.object({
    id: z.number(),
    title: z.string(),
    origin_office: officeSchema.nullable(),
    current_office: officeSchema.nullable(),
    status: z.enum(["filed", "in_progress", "completed", "cancelled"]),
})

export type Office = z.infer<typeof officeSchema>
export type ArchiveRow = z.infer<typeof archiveRowSchema>