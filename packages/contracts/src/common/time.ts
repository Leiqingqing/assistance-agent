import z from "zod"

export const TimestampsSchema = z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  
