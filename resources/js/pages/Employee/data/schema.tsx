import { z } from "zod"

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  unit: z.string(),
  division: z.string(),
  department: z.string(),
  contactNumber: z.string(),
  email: z.string(),
  employmentClassification: z.string(), 
  status: z.boolean(), 
})

export type Employee = z.infer<typeof employeeSchema>