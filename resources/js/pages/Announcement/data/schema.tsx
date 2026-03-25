import { z } from "zod"

export const announcementDepartmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
    department_acronym: z.string(),
})

export const announcementAuthorSchema = z.object({
    id: z.number(),
    name: z.string().nullable().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
})

export const announcementSchema = z.object({
    id: z.number(),
    title: z.string(),
    body: z.string(),
    is_pinned: z.boolean(),
    is_global: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
    author: announcementAuthorSchema.nullable().optional(),
    departments: z.array(announcementDepartmentSchema),
})

export const departmentSchema = z.object({
    department_id: z.number(),
    department_name: z.string(),
    department_acronym: z.string().nullable().optional(),
})

export type AnnouncementDepartment = z.infer<typeof announcementDepartmentSchema>
export type AnnouncementAuthor = z.infer<typeof announcementAuthorSchema>
export type Announcement = z.infer<typeof announcementSchema>
export type Department = z.infer<typeof departmentSchema>