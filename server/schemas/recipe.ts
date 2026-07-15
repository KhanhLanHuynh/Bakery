import { z } from 'zod'

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])

export const recipeIngredientSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  note: z.string().default(''),
})

export const yieldSchema = z.object({
  amount: z.number().positive(),
  unit: z.string().min(1),
  description: z.string().default(''),
})

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().default(''),
  category: z.string().min(1),
  yield: yieldSchema,
  pieces: z.number().int().positive().default(1),
  prepTimeMinutes: z.number().min(0),
  bakeTimeMinutes: z.number().min(0),
  imageUrl: z.string().default(''),
  difficulty: difficultySchema.default('intermediate'),
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(z.string().trim().min(1)).min(1),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createRecipeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  category: z.string().trim().min(1, 'Category is required'),
  yield: yieldSchema,
  pieces: z.number().int().positive().default(1),
  prepTimeMinutes: z.number().min(0),
  bakeTimeMinutes: z.number().min(0),
  imageUrl: z.string().optional().default(''),
  difficulty: difficultySchema.optional().default('intermediate'),
  ingredients: z.array(recipeIngredientSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(z.string().trim().min(1)).min(1, 'At least one step is required'),
  tags: z.array(z.string()).optional().default([]),
})

export const updateRecipeSchema = createRecipeSchema.partial()

export type Recipe = z.infer<typeof recipeSchema>
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>
export type Difficulty = z.infer<typeof difficultySchema>
