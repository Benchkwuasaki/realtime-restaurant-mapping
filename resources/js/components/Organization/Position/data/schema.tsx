import { z } from "zod"

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
})

export const divisionSchema = z.object({
    division_id: z.number(),
    division_name: z.string(),
    department_id: z.number(),
})

export const unitSchema = z.object({
    unit_id: z.number(),
    unit_name: z.string(),
    division_id: z.number(),
})

export const itemSchema = z.object({
    item_id: z.number(),
    item_name: z.string(),
})

export const positionSchema = z.object({
    position_id: z.number(),
    position_name: z.string(),
    department_id: z.number(),
    division_id: z.number(),
    unit_id: z.number().nullable().optional(),
    department: departmentSchema,
    division: divisionSchema.nullable().optional(),
    unit: unitSchema.nullable().optional(),
    total_slots: z.number(),
    occupied_slots: z.number(),
})

export type Department = z.infer<typeof departmentSchema>
export type Division   = z.infer<typeof divisionSchema>
export type Unit       = z.infer<typeof unitSchema>
export type Position   = z.infer<typeof positionSchema>