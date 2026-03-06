// resources/js/pages/Leave/Accrual/data/schema.ts

import { z } from "zod"

export const leaveTypeSchema = z.object({
    leave_type_id:   z.number(),
    leave_type_name: z.string(),
})

export const creditStatusSchema = z.enum(["full_credit", "prorated", "ineligible"])

export const previewRowSchema = z.object({
    employee_id:              z.number(),
    name:                     z.string(),
    department:               z.string(),
    employment_classification: z.string(),
    avatar_url:               z.string().nullable(),
    leave_type_id:            z.number(),
    leave_type_name:          z.string(),
    attendance_days:          z.number(),
    accrual_earned:           z.number(),
    balance_before:           z.number(),
    balance_after:            z.number(),
    credit_status:            creditStatusSchema,
})

export const historyRowSchema = z.object({
    posting_id:               z.number(),
    posting_month:            z.number(),
    posting_year:             z.number(),
    employee_id:              z.number(),
    name:                     z.string(),
    department:               z.string(),
    employment_classification: z.string(),
    avatar_url:               z.string().nullable(),
    leave_type_name:          z.string(),
    accrual_earned:           z.number(),
    balance_before:           z.number(),
    balance_after:            z.number(),
    credit_status:            creditStatusSchema,
    reference_no:             z.string(),
    posting_date:             z.string(),
    status:                   z.string(),
})

// Augmented row used inside the table (stable composite key)
export const historyTableRowSchema = historyRowSchema.extend({
    _key: z.string(),
})

export const postDetailsSchema = z.object({
    posted_by:    z.string(),
    role:         z.string(),
    user_id_str:  z.string(),
    posting_date: z.string(),
    reference_no: z.string(),
})

export const summarySchema = z.object({
    total_eligible:  z.number(),
    full_credit:     z.number(),
    prorated:        z.number(),
    ineligible:      z.number(),
    work_days:       z.number(),
    total_days:      z.number(),
    total_sundays:   z.number(),
    total_holidays:  z.number(),
})

export const postingMetaSchema = z.object({
    reference_no: z.string(),
    posted_date:  z.string(),
    work_days:    z.number(),
})

export type LeaveType       = z.infer<typeof leaveTypeSchema>
export type CreditStatus    = z.infer<typeof creditStatusSchema>
export type PreviewRow      = z.infer<typeof previewRowSchema>
export type HistoryRow      = z.infer<typeof historyRowSchema>
export type HistoryTableRow = z.infer<typeof historyTableRowSchema>
export type PostDetails     = z.infer<typeof postDetailsSchema>
export type Summary         = z.infer<typeof summarySchema>
export type PostingMeta     = z.infer<typeof postingMetaSchema>