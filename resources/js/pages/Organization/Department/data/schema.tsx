import { z } from "zod"

export const departmentDivisionSchema = z.object({
    division_id:   z.number(),
    division_name: z.string(),
})

export const departmentSchema = z.object({
    department_id:          z.number(),
    department_name:        z.string(),
    department_acronym:     z.string(),
    department_description: z.string().optional().nullable(),
    divisions:              z.array(departmentDivisionSchema),
})

export type DepartmentDivision = z.infer<typeof departmentDivisionSchema>
export type Department         = z.infer<typeof departmentSchema>