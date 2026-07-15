import { getExpiryStatus } from '../utils/expiry.js'
import { generateId } from '../utils/id.js'
import {
  createIngredientSchema,
  type CreateIngredientInput,
  type Ingredient,
  type UpdateIngredientInput,
  updateIngredientSchema,
} from '../schemas/ingredient.js'
import { getAllIngredients, saveIngredients } from '../repositories/ingredientRepository.js'
import { getSettings } from '../repositories/settingsRepository.js'
import { readJsonFile } from '../repositories/fileRepository.js'

export type IngredientWithStatus = Ingredient & {
  expiryStatus: ReturnType<typeof getExpiryStatus>
  isLowStock: boolean
}

function normalizeExpiryDate(expiryDate: string | null | undefined, quantity: number): string | null {
  if (!expiryDate || quantity <= 0) {
    return null
  }
  return expiryDate
}

async function enrichIngredient(ingredient: Ingredient): Promise<IngredientWithStatus> {
  const settings = await getSettings()
  return {
    ...ingredient,
    expiryStatus: getExpiryStatus(
      ingredient.expiryDate,
      ingredient.currentQuantity,
      settings.expiryWarningDays,
    ),
    isLowStock: ingredient.currentQuantity <= ingredient.reorderLevel,
  }
}

function validateUniqueName(ingredients: Ingredient[], name: string, excludeId?: string): void {
  const normalized = name.trim().toLowerCase()
  const duplicate = ingredients.find(
    (item) => item.id !== excludeId && item.name.trim().toLowerCase() === normalized,
  )
  if (duplicate) {
    throw new Error('An ingredient with this name already exists')
  }
}

async function isIngredientUsedInRecipes(ingredientId: string): Promise<boolean> {
  const recipes = await readJsonFile<Array<{ ingredients: Array<{ ingredientId: string }> }>>(
    'recipes.json',
    [],
  )
  return recipes.some((recipe) =>
    recipe.ingredients.some((item) => item.ingredientId === ingredientId),
  )
}

export async function listIngredients(filters?: {
  category?: string
  lowStock?: boolean
  expired?: boolean
  expiringSoon?: boolean
}): Promise<IngredientWithStatus[]> {
  const ingredients = await getAllIngredients()
  let result = await Promise.all(ingredients.map(enrichIngredient))

  if (filters?.category) {
    result = result.filter((item) => item.category === filters.category)
  }
  if (filters?.lowStock) {
    result = result.filter((item) => item.isLowStock)
  }
  if (filters?.expired) {
    result = result.filter((item) => item.expiryStatus === 'expired')
  }
  if (filters?.expiringSoon) {
    result = result.filter((item) => item.expiryStatus === 'expiring_soon')
  }

  return result.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getIngredientById(id: string): Promise<IngredientWithStatus | null> {
  const ingredients = await getAllIngredients()
  const ingredient = ingredients.find((item) => item.id === id)
  if (!ingredient) {
    return null
  }
  return enrichIngredient(ingredient)
}

export async function createIngredient(input: CreateIngredientInput): Promise<IngredientWithStatus> {
  const data = createIngredientSchema.parse(input)
  const ingredients = await getAllIngredients()
  validateUniqueName(ingredients, data.name)

  const now = new Date().toISOString()
  const ingredient: Ingredient = {
    id: generateId('ing_'),
    name: data.name.trim(),
    category: data.category.trim().toLowerCase(),
    unit: data.unit.trim(),
    unitCost: data.unitCost,
    currentQuantity: data.currentQuantity,
    reorderLevel: data.reorderLevel,
    expiryDate: normalizeExpiryDate(data.expiryDate ?? null, data.currentQuantity),
    notes: data.notes ?? '',
    createdAt: now,
    updatedAt: now,
  }

  ingredients.push(ingredient)
  await saveIngredients(ingredients)
  return enrichIngredient(ingredient)
}

export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput,
): Promise<IngredientWithStatus> {
  const data = updateIngredientSchema.parse(input)
  const ingredients = await getAllIngredients()
  const index = ingredients.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error('Ingredient not found')
  }

  if (data.name) {
    validateUniqueName(ingredients, data.name, id)
  }

  const current = ingredients[index]
  const updated: Ingredient = {
    ...current,
    ...data,
    name: data.name?.trim() ?? current.name,
    category: data.category?.trim().toLowerCase() ?? current.category,
    unit: data.unit?.trim() ?? current.unit,
    notes: data.notes ?? current.notes,
    updatedAt: new Date().toISOString(),
  }

  updated.expiryDate = normalizeExpiryDate(
    data.expiryDate !== undefined ? data.expiryDate : updated.expiryDate,
    updated.currentQuantity,
  )

  ingredients[index] = updated
  await saveIngredients(ingredients)
  return enrichIngredient(updated)
}

export async function deleteIngredient(id: string): Promise<void> {
  const ingredients = await getAllIngredients()
  const index = ingredients.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error('Ingredient not found')
  }

  if (await isIngredientUsedInRecipes(id)) {
    throw new Error('Cannot delete ingredient that is used in a recipe')
  }

  ingredients.splice(index, 1)
  await saveIngredients(ingredients)
}
