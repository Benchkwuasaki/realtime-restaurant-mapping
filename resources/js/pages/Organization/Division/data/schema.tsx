import { z } from "zod"

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
})

export const divisionUnitSchema = z.object({
    unit_id: z.number(),
    unit_name: z.string(),
})


export const divisionSchema = z.object({
    division_id: z.number(),
    division_name: z.string(),
    division_acronym: z.string(),
    division_description: z.string().nullable().optional(),
    department_id: z.number(),
    department: departmentSchema,
    units: z.array(divisionUnitSchema),
})

export type Department = z.infer<typeof departmentSchema>
export type DivisionUnit = z.infer<typeof divisionUnitSchema>
export type Division = z.infer<typeof divisionSchema>