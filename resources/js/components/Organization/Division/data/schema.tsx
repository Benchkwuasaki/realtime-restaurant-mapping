import { z } from "zod"

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
})

export const divisionSchema = z.object({
    division_id: z.number(),
    division_name: z.string(),
    division_acronym: z.string(),
    division_description: z.string().nullable().optional(),
    department_id: z.number(),
    department: departmentSchema,
})

export type Department = z.infer<typeof departmentSchema>
export type Division = z.infer<typeof divisionSchema>