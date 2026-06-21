// resources/js/pages/Employee/data/schema.ts

import { z } from "zod"

export const leaveTypeSchema = z.object({
    leave_type_id:   z.number(),
    leave_type_name: z.string(),
})

export const leaveBalanceSchema = z.object({
    employee_leave_balance_id: z.number(),
    leave_type_id:             z.number(),
    cycle_year:                z.number(),
    total_days:                z.number(),
    used_days:                 z.number(),
    balance:                   z.number(),
    leave_type:                leaveTypeSchema.nullable().optional(),
})

export type LeaveType    = z.infer<typeof leaveTypeSchema>
export type LeaveBalance = z.infer<typeof leaveBalanceSchema>