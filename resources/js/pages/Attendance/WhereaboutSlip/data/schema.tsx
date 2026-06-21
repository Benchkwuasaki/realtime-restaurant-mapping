import { z } from 'zod';

export const employeeBasicInfoSchema = z.object({
    employee_basic_info_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    middle_name: z.string().nullable().optional(),
    name_extension: z.string().nullable().optional(),
});

export const employeeSchema = z.object({
    employee_id: z.number(),
    employee_basic_info_id: z.number(),
    basic_info: employeeBasicInfoSchema,
});

export const whereaboutSlipSchema = z.object({
    whereabout_slip_id: z.number(),
    employee_id: z.number(),
    reviewed_and_noted_by_id: z.number(),
    approved_by_id: z.number(),
    attested_by_id: z.number(),
    date_filed: z.string(),
    purpose_type: z.enum(['official', 'personal']),
    purpose_description: z.string(),
    time_out: z.string(),
    time_returned: z.string().nullable().optional(),
    date_returned: z.string().nullable().optional(), // may differ from date_filed
    time_noted: z.string().nullable().optional(),
    date_noted: z.string().nullable().optional(), // date supervisor noted the return
    minutes_gone: z.number().nullable().optional(), // null until returned
    // Single status field:
    //   still_out    – slip filed, employee is out within work hours
    //   not_returned – work_schedule_end passed, still out
    //   returned     – employee has logged their return
    status: z.enum(['still_out', 'not_returned', 'returned']),
    prov_code: z.string().nullable().optional(),
    city_code: z.string().nullable().optional(),
    brgy_code: z.string().nullable().optional(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),

    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),

    employee: employeeSchema.optional(),
    reviewed_and_noted_by: employeeSchema.optional(),
    approved_by: employeeSchema.optional(),
    attested_by: employeeSchema.optional(),
});

export type EmployeeBasicInfo = z.infer<typeof employeeBasicInfoSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type WhereaboutSlip = z.infer<typeof whereaboutSlipSchema>;
