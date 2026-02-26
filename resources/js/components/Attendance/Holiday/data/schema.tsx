import { z } from "zod"

export const holidaySchema = z.object({
  holiday_id: z.number(),
  name: z.string(),
  date: z.string(),
  display_date: z.string(),
  type: z.string(),
  description: z.string().optional(),
  is_recurring: z.boolean(),
})

export type Holiday = z.infer<typeof holidaySchema>