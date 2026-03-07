import { z } from "zod"

export const employeeBasicInfoSchema = z.object({
    employee_basic_info_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    middle_name: z.string().nullable().optional(),
    name_extension: z.string().nullable().optional(),
})

export const employeeSchema = z.object({
    employee_id: z.number(),
    employee_basic_info_id: z.number(),
    basic_info: employeeBasicInfoSchema,
})

export const whereaboutSlipSchema = z.object({
    whereabout_slip_id: z.number(),
    employee_id: z.number(),
    reviewed_and_noted_by_id: z.number(),
    approved_by_id: z.number(),
    attested_by_id: z.number(),
    date_filed: z.string(),
    purpose_type: z.enum(["official", "personal"]),
    purpose_description: z.string(),
    time_out: z.string(),
    time_returned: z.string().nullable().optional(),
    time_noted: z.string().nullable().optional(),
    status: z.enum(["pending", "done"]),
    return_status: z.enum(["not_returned", "returned"]),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),

    employee: employeeSchema.optional(),
    reviewed_and_noted_by: employeeSchema.optional(),
    approved_by: employeeSchema.optional(),
    attested_by: employeeSchema.optional(),
})

export type EmployeeBasicInfo = z.infer<typeof employeeBasicInfoSchema>
export type Employee = z.infer<typeof employeeSchema>
export type WhereaboutSlip = z.infer<typeof whereaboutSlipSchema>