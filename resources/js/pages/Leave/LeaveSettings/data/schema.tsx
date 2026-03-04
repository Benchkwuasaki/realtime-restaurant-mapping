import { z } from "zod"

export const leaveTypeRequirementSchema = z.object({
    leave_type_requirement_id: z.number(),
    requirement_name: z.string(),
})

export const leaveEntitlementSchema = z.object({
    leave_entitlement_id: z.number(),
    leave_type_id: z.number(),
    leave_entitlement_description: z.string().nullable(),
    years_of_service: z.number(),
    days_entitled: z.number(),
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
    entitlements: z.array(leaveEntitlementSchema),
})

export type LeaveTypeRequirement = z.infer<typeof leaveTypeRequirementSchema>
export type LeaveEntitlement = z.infer<typeof leaveEntitlementSchema>
export type LeaveType = z.infer<typeof leaveTypeSchema>