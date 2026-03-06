import { z } from "zod"

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
})

export const attendanceRecordWithHistorySchema = attendanceRecordSchema.extend({
    history: z.array(attendanceRecordSchema).default([]),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>
export type AttendanceRecordWithHistory = z.infer<typeof attendanceRecordWithHistorySchema>