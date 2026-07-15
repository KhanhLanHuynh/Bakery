import { z } from 'zod'

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  unitCost: z.number().min(0),
  currentQuantity: z.number().min(0),
  reorderLevel: z.number().min(0),
  expiryDate: z.string().nullable(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createIngredientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  unit: z.string().trim().min(1, 'Unit is required'),
  unitCost: z.number().min(0, 'Unit cost must be 0 or greater'),
  currentQuantity: z.number().min(0, 'Quantity must be 0 or greater'),
  reorderLevel: z.number().min(0, 'Reorder level must be 0 or greater'),
  expiryDate: z.string().nullable().optional(),
  notes: z.string().optional().default(''),
})

export const updateIngredientSchema = createIngredientSchema.partial()

export type Ingredient = z.infer<typeof ingredientSchema>
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>

export const settingsSchema = z.object({
  currency: z.string().trim().min(1),
  currencySymbol: z.string().trim().min(1),
  lowStockHighlight: z.boolean(),
  expiryWarningDays: z.number().min(0),
  ingredientCategories: z.array(z.string().trim().min(1)).min(1),
  recipeCategories: z.array(z.string().trim().min(1)).min(1),
  units: z.array(z.string().trim().min(1)).min(1),
})

export type Settings = z.infer<typeof settingsSchema>

export const defaultSettings: Settings = {
  currency: 'VND',
  currencySymbol: '₫',
  lowStockHighlight: true,
  expiryWarningDays: 7,
  ingredientCategories: ['produce', 'dairy', 'flour', 'pantry', 'egg', 'flavoring', 'other'],
  recipeCategories: ['cake', 'frosting', 'filling', 'other'],
  units: ['g', 'kg', 'ml', 'L', 'piece', 'tbsp', 'tsp'],
}
