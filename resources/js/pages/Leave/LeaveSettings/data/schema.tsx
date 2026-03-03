import { z } from "zod"

export const leaveTypeRequirementSchema = z.object({
    leave_type_requirement_id: z.number(),
    requirement_name: z.string(),
})

export const leaveTypeSchema = z.object({
    leave_type_id: z.number(),
    leave_type_name: z.string(),
    leave_type_description: z.string().nullable(),
    eligible_sex: z.enum(["All", "Male", "Female"]),
    is_paid: z.boolean(),
    is_convertible: z.boolean(),
    status: z.boolean(),
    requirements: z.array(leaveTypeRequirementSchema),
})

export type LeaveTypeRequirement = z.infer<typeof leaveTypeRequirementSchema>
export type LeaveType = z.infer<typeof leaveTypeSchema>