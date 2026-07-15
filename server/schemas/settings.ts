import { z } from 'zod'
import { settingsSchema } from '../schemas/ingredient.js'

function normalizeList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))]
}

export const updateSettingsSchema = settingsSchema.transform((data) => ({
  ...data,
  currency: data.currency.trim(),
  currencySymbol: data.currencySymbol.trim(),
  ingredientCategories: normalizeList(data.ingredientCategories),
  recipeCategories: normalizeList(data.recipeCategories),
  units: normalizeList(data.units),
}))

export type UpdateSettingsInput = z.infer<typeof settingsSchema>
