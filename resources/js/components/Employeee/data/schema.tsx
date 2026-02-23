import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  unit: z.string(),
  division: z.string(),
  department: z.string(),
  contactNumber: z.string(),
  email: z.string().email(),
  status: z.enum(["Active", "Inactive"]),
})

export type Task = z.infer<typeof taskSchema>