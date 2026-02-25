import { z } from "zod"

export const taskSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  unit: z.string(),
  division: z.string(),
  department: z.string(),
  contactNumber: z.string(),
  email: z.string(),
  status: z.boolean(), // true = Active, false = Inactive
})

export type Task = z.infer<typeof taskSchema>