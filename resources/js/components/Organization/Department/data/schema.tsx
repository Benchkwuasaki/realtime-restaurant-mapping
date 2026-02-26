import { z } from "zod"

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
    department_acronym: z.string(),
    department_description: z.string().optional().nullable(),
})

export type Department = z.infer<typeof departmentSchema>