import { z } from 'zod';

/* Leave Filing Detail Schema */

export const leaveFilingDetailSchema = z.object({
    leave_application_detail_id: z.number(),
    leave_application_id: z.number(),

    leave_location: z.string().nullable(),
    illness_details: z.string().nullable(),
    study_leave_purpose: z.string().nullable(),

    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type LeaveFilingDetail = z.infer<typeof leaveFilingDetailSchema>;

/* Leave Filing Schema */

export const leaveFilingSchema = z.object({
    leave_application_id: z.number(),

    employee_id: z.number(),
    leave_type_id: z.number().nullable(),

    recommendation_officer: z.number().nullable(),
    approval_officer: z.number().nullable(),

    leave_type_availed: z.string().nullable(),

    date_of_filing: z.string(),
    start_date: z.string(),
    end_date: z.string(),

    is_requested: z.boolean(),
    is_with_pay: z.boolean(),

    approved_for_specifics: z.string().nullable(),

    status: z.enum([
        'Pending',
        'For Approval',
        'For Disapproval',
        'Approved',
        'Disapproved',
    ]),

    for_disapproval_reason: z.string().nullable(),
    disapproved_reason: z.string().nullable(),

    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    deleted_at: z.string().nullable(),
});

export type LeaveFiling = z.infer<typeof leaveFilingSchema>;

export const leaveFilingWithDetailsSchema = leaveFilingSchema.extend({
    details: leaveFilingDetailSchema.optional(),
});

export type LeaveFilingWithDetails = z.infer<
    typeof leaveFilingWithDetailsSchema
>;
