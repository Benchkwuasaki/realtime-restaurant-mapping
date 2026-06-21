// resources/js/pages/Organization/JobOrderPosition/data/schema.ts

import { z } from "zod"

export const joDepartmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
})

export const joDivisionSchema = z.object({
    division_id: z.number(),
    division_name: z.string(),
    department_id: z.number(),
})

export const joUnitSchema = z.object({
    unit_id: z.number(),
    unit_name: z.string(),
    division_id: z.number(),
})

export const joPositionEmployeeSchema = z.object({
    id:         z.number(),
    first_name: z.string(),
    last_name:  z.string(),
    email:      z.string(),
    is_active:  z.boolean(),
    item_name:  z.string(),
})

export const jobOrderPositionSchema = z.object({
    position_id:    z.number(),
    position_name:  z.string(),
    position_type:  z.literal("Job Order"),   // ← exact DB enum value
    department_id:  z.number(),
    division_id:    z.number().nullable().optional(),
    unit_id:        z.number().nullable().optional(),
    department:     joDepartmentSchema,
    division:       joDivisionSchema.nullable().optional(),
    unit:           joUnitSchema.nullable().optional(),
    total_slots:    z.number(),
    occupied_slots: z.number(),
    employees:      z.array(joPositionEmployeeSchema),
})

export type JoDepartment       = z.infer<typeof joDepartmentSchema>
export type JoDivision         = z.infer<typeof joDivisionSchema>
export type JoUnit             = z.infer<typeof joUnitSchema>
export type JoPositionEmployee = z.infer<typeof joPositionEmployeeSchema>
export type JobOrderPosition   = z.infer<typeof jobOrderPositionSchema>