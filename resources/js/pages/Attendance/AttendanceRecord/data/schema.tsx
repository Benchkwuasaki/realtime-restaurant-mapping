import { z } from "zod"

// ─── Whereabout Slip (embedded in attendance record) ──────────────────────────

export const whereaboutSlipSchema = z.object({
    whereabout_slip_id:  z.number(),
    date_filed:          z.string(),
    purpose_type:        z.enum(["official", "personal"]),
    purpose_description: z.string(),
    time_out:            z.string(),
    time_returned:       z.string().nullable().optional(),
    minutes_gone:        z.number().nullable().optional(),
    status:              z.enum(["pending", "done"]),
    return_status:       z.enum(["not_returned", "returned"]),
})

export type WhereaboutSlip = z.infer<typeof whereaboutSlipSchema>

// ─── Attendance Record ────────────────────────────────────────────────────────

export const attendanceRecordSchema = z.object({
    id: z.union([z.number(), z.string()]),
    employee_id: z.number(),
    date: z.string(),
    scheduled_time_in: z.string().nullable(),
    scheduled_break_out: z.string().nullable(),
    scheduled_break_in: z.string().nullable(),
    scheduled_time_out: z.string().nullable(),
    grace_minutes: z.number(),
    time_in: z.string().nullable(),
    break_out: z.string().nullable(),
    break_in: z.string().nullable(),
    time_out: z.string().nullable(),
    late_minutes: z.number().nullable(),
    work_minutes: z.number().nullable(),
    status: z.enum(["PRESENT", "HALF_DAY", "ABSENT"]),
    employee: z.object({
        employee_id: z.number(),
        work_id: z.string(),
        avatar_url: z.string().nullable().optional(),
        basic_info: z.object({
            first_name: z.string(),
            last_name: z.string(),
            middle_name: z.string().nullable().optional(),
        }).optional(),
    }).optional(),
    // Whereabout slips filed on this record's date for this employee
    whereabout_slips: z.array(whereaboutSlipSchema).default([]),
})

export const attendanceRecordWithHistorySchema = attendanceRecordSchema.extend({
    history: z.array(attendanceRecordSchema).default([]),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>
export type AttendanceRecordWithHistory = z.infer<typeof attendanceRecordWithHistorySchema>