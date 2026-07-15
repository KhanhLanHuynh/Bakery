import { z } from 'zod'

export const bakeSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  recipeName: z.string(),
  batchCount: z.number().positive(),
  date: z.string(),
  note: z.string(),
  createdAt: z.string(),
})

export const makeRecipeSchema = z.object({
  batchCount: z.number().int().positive('Batch count must be at least 1'),
  date: z.string().min(1).optional(),
  note: z.string().optional().default(''),
})

export type Bake = z.infer<typeof bakeSchema>
export type MakeRecipeInput = z.infer<typeof makeRecipeSchema>
