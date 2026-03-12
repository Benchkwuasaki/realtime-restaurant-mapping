import { z } from "zod"

export const leaveApplicationSchema = z.object({
    leave_application_id: z.number(),
    employee_name: z.string(),
    department_name: z.string(),
    leave_type_name: z.string(),
    start_date: z.string(), // YYYY-MM-DD
    end_date: z.string(), // YYYY-MM-DD
    days_requested: z.number(),
    status: z.enum(["pending", "for_approval", "approved", "for_disapproval", "rejected", "cancelled"]),
})

export type LeaveApplication = z.infer<typeof leaveApplicationSchema>