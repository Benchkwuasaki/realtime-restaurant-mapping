import { z } from "zod"

// Shape of a single requirement attached to a leave type
export const leaveTypeRequirementSchema = z.object({
    leave_type_requirement_id: z.number(),
    requirement_name: z.string(),
})

// Minimal leave type shape attached to each entitlement when eager loaded via with('leaveType') in Laravel.
// Lets us display the leave type name in the entitlements table without carrying the full leave type object.
export const leaveTypeMinimalSchema = z.object({
    leave_type_id: z.number(),
    leave_type_name: z.string(),
})

// Shape of a single leave entitlement record
export const leaveEntitlementSchema = z.object({
    leave_entitlement_id: z.number(),
    leave_type_id: z.number(),
    leave_type: leaveTypeMinimalSchema.optional(), // populated by Laravel's eager loading — may be absent if not loaded
    leave_entitlement_description: z.string().nullable(),
    years_of_service: z.number(),
    days_entitled: z.number(),
})

// Shape of a single leave type record
export const leaveTypeSchema = z.object({
    leave_type_id: z.number(),
    leave_type_name: z.string(),
    leave_type_description: z.string().nullable(),
    eligible_sex: z.enum(["All", "Male", "Female"]),
    is_paid: z.boolean(),
    is_convertible: z.boolean(),
    is_accrual: z.boolean(),
    status: z.boolean(),
    requirements: z.array(leaveTypeRequirementSchema), // list of documents/requirements needed for this leave type
})

export type LeaveTypeRequirement = z.infer<typeof leaveTypeRequirementSchema>
export type LeaveTypeMinimal = z.infer<typeof leaveTypeMinimalSchema>
export type LeaveEntitlement = z.infer<typeof leaveEntitlementSchema>
export type LeaveType = z.infer<typeof leaveTypeSchema>