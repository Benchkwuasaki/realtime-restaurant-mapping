import { z } from "zod"

export const divisionSchema = z.object({
    division_id: z.number(),
    division_name: z.string(),
})

export const unitSchema = z.object({
    unit_id: z.number(),
    unit_name: z.string(),
    unit_acronym: z.string(),
    unit_description: z.string().nullable().optional(),
    division_id: z.number(),
    division: divisionSchema,
})

export type Division = z.infer<typeof divisionSchema>
export type Unit = z.infer<typeof unitSchema>