import { z } from "zod"

/* Leave Filing Detail Schema */

export const leaveFilingDetailSchema = z.object({
    leave_application_detail_id: z.number(),
    leave_application_id: z.number(),

    // 6.B Vacation / Special Privilege Leave
    leave_location_type: z.enum(['ph', 'abroad']).nullable(),
    leave_location: z.string().nullable(),

    // 6.B Sick Leave / Rehabilitation Leave
    sick_type: z.enum(['hospital', 'outpatient']).nullable(),
    sick_details: z.string().nullable(),

    // 6.B Special Leave Benefits for Women
    women_illness: z.string().nullable(),

    // 6.B Study Leave
    study_purpose: z.string().nullable(),

    // 6.B Other purpose
    other_purpose: z.string().nullable(),
    
   // 6.B Monetization of Leave Credits — days to monetize (tracked per leave type)
    monetization_vl_days: z.number().nullable(),
    monetization_sl_days: z.number().nullable(),

    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
})

export type LeaveFilingDetail = z.infer<typeof leaveFilingDetailSchema>


/* Leave Filing Schema */

export const leaveFilingSchema = z.object({
    leave_application_id: z.number(),

    employee_id: z.number(),
    leave_type_id: z.number().nullable(),

    recommendation_officer: z.number().nullable(),
    approval_officer: z.number().nullable(),

    office_department: z.string().nullable(),
    position: z.string().nullable(),
    salary: z.string().nullable(),

    leave_type_availed: z.string().nullable(),

    date_of_filing: z.string(),
    start_date: z.string(),
    end_date: z.string(),

    // 6.D Commutation
    is_requested: z.boolean(),
    is_with_pay: z.boolean(),

    // 7.C Approved For
    approved_with_pay: z.number().nullable(),
    approved_without_pay: z.number().nullable(),
    approved_others: z.string().nullable(),

    // 7.B Recommendation / 7.D Disapproval
    status: z.enum([
        "Pending",
        "For Approval",
        "For Disapproval",
        "Approved",
        "Disapproved",
    ]),
    for_disapproval_reason: z.string().nullable(),
    disapproved_reason: z.string().nullable(),

    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    deleted_at: z.string().nullable(),

    // Relations
    employee: z.object({
        employee_id: z.number(),
        employee_name: z.string(),
    }).nullable().optional(),

    leave_type: z.object({
        leave_type_id: z.number(),
        leave_type_name: z.string(),
    }).nullable().optional(),

    detail: leaveFilingDetailSchema.nullable().optional(),
})

export type LeaveFiling = z.infer<typeof leaveFilingSchema>

export const leaveFilingWithDetailsSchema = leaveFilingSchema.extend({
    detail: leaveFilingDetailSchema.nullable().optional(),
})

export type LeaveFilingWithDetails = z.infer<typeof leaveFilingWithDetailsSchema>