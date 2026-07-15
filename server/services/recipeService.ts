import { getExpiryStatus } from '../utils/expiry.js'
import { generateId } from '../utils/id.js'
import { convertQuantity } from '../utils/units.js'
import {
  createRecipeSchema,
  type CreateRecipeInput,
  type Recipe,
  type UpdateRecipeInput,
  updateRecipeSchema,
} from '../schemas/recipe.js'
import { getAllIngredients } from '../repositories/ingredientRepository.js'
import { getAllRecipes, saveRecipes } from '../repositories/recipeRepository.js'
import { getSettings } from '../repositories/settingsRepository.js'
import type { Ingredient } from '../schemas/ingredient.js'

export type CostBreakdownLine = {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  lineCost: number | null
  warning: string | null
}

export type FeasibilityIssue = {
  ingredientId: string
  ingredientName: string
  required: number
  available: number
  unit: string
  type: 'shortfall' | 'expired'
}

export type FeasibilityWarning = {
  ingredientId: string
  ingredientName: string
  type: 'expiring_soon'
}

export type FeasibilityResult = {
  makeable: boolean
  issues: FeasibilityIssue[]
  warnings: FeasibilityWarning[]
}

export type RecipeDetail = Recipe & {
  totalCost: number
  costPerYield: number
  costPerPiece: number
  costBreakdown: CostBreakdownLine[]
  makeable: boolean
  feasibilityIssues: FeasibilityIssue[]
  feasibilityWarnings: FeasibilityWarning[]
}

function getPieces(recipe: Recipe): number {
  const pieces = recipe.pieces ?? 1
  return pieces > 0 ? pieces : 1
}

function validateIngredientReferences(
  ingredients: Recipe['ingredients'],
  ingredientMap: Map<string, Ingredient>,
): void {
  for (const item of ingredients) {
    if (!ingredientMap.has(item.ingredientId)) {
      throw new Error(`Ingredient not found: ${item.ingredientId}`)
    }
  }
}

function buildCostBreakdown(
  recipe: Recipe,
  ingredientMap: Map<string, Ingredient>,
): { breakdown: CostBreakdownLine[]; totalCost: number } {
  const breakdown: CostBreakdownLine[] = []
  let totalCost = 0

  for (const item of recipe.ingredients) {
    const ingredient = ingredientMap.get(item.ingredientId)
    if (!ingredient) {
      breakdown.push({
        ingredientId: item.ingredientId,
        ingredientName: 'Missing ingredient',
        quantity: item.quantity,
        unit: item.unit,
        lineCost: null,
        warning: 'Ingredient no longer exists',
      })
      continue
    }

    const converted = convertQuantity(item.quantity, item.unit, ingredient.unit)
    if (converted === null) {
      breakdown.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        lineCost: null,
        warning: `Cannot convert ${item.unit} to ${ingredient.unit}`,
      })
      continue
    }

    const lineCost = converted * ingredient.unitCost
    if (ingredient.unitCost === 0) {
      breakdown.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        lineCost,
        warning: 'Unit cost is zero',
      })
    } else {
      breakdown.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        lineCost,
        warning: null,
      })
    }

    totalCost += lineCost
  }

  return { breakdown, totalCost }
}

async function buildFeasibility(
  recipe: Recipe,
  ingredientMap: Map<string, Ingredient>,
  batchCount = 1,
): Promise<FeasibilityResult> {
  const settings = await getSettings()
  const issues: FeasibilityIssue[] = []
  const warnings: FeasibilityWarning[] = []

  for (const item of recipe.ingredients) {
    const ingredient = ingredientMap.get(item.ingredientId)
    if (!ingredient) {
      issues.push({
        ingredientId: item.ingredientId,
        ingredientName: 'Missing ingredient',
        required: item.quantity * batchCount,
        available: 0,
        unit: item.unit,
        type: 'shortfall',
      })
      continue
    }

    const converted = convertQuantity(item.quantity * batchCount, item.unit, ingredient.unit)
    const required = converted ?? item.quantity * batchCount

    if (converted === null || ingredient.currentQuantity < required) {
      issues.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        required,
        available: ingredient.currentQuantity,
        unit: ingredient.unit,
        type: 'shortfall',
      })
    }

    const expiryStatus = getExpiryStatus(
      ingredient.expiryDate,
      ingredient.currentQuantity,
      settings.expiryWarningDays,
    )
    if (expiryStatus === 'expired') {
      issues.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        required,
        available: ingredient.currentQuantity,
        unit: ingredient.unit,
        type: 'expired',
      })
    } else if (expiryStatus === 'expiring_soon') {
      warnings.push({
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        type: 'expiring_soon',
      })
    }
  }

  return {
    makeable: issues.length === 0,
    issues,
    warnings,
  }
}

async function enrichRecipe(recipe: Recipe): Promise<RecipeDetail> {
  const ingredients = await getAllIngredients()
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))
  const { breakdown, totalCost } = buildCostBreakdown(recipe, ingredientMap)
  const { makeable, issues, warnings } = await buildFeasibility(recipe, ingredientMap)

  const pieces = getPieces(recipe)

  return {
    ...recipe,
    pieces,
    totalCost,
    costPerYield: recipe.yield.amount > 0 ? totalCost / recipe.yield.amount : totalCost,
    costPerPiece: totalCost / pieces,
    costBreakdown: breakdown,
    makeable,
    feasibilityIssues: issues,
    feasibilityWarnings: warnings,
  }
}

export async function getRecipeFeasibility(
  id: string,
  batchCount: number,
): Promise<FeasibilityResult | null> {
  const recipes = await getAllRecipes()
  const recipe = recipes.find((item) => item.id === id)
  if (!recipe) {
    return null
  }

  const ingredients = await getAllIngredients()
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))
  return buildFeasibility(recipe, ingredientMap, batchCount)
}

export async function listRecipes(): Promise<Recipe[]> {
  const recipes = await getAllRecipes()
  return recipes.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getRecipeById(id: string): Promise<RecipeDetail | null> {
  const recipes = await getAllRecipes()
  const recipe = recipes.find((item) => item.id === id)
  if (!recipe) {
    return null
  }
  return enrichRecipe(recipe)
}

export async function createRecipe(input: CreateRecipeInput): Promise<RecipeDetail> {
  const data = createRecipeSchema.parse(input)
  const ingredients = await getAllIngredients()
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))
  validateIngredientReferences(data.ingredients, ingredientMap)

  const recipes = await getAllRecipes()
  const normalizedName = data.name.trim().toLowerCase()
  if (recipes.some((item) => item.name.trim().toLowerCase() === normalizedName)) {
    throw new Error('A recipe with this name already exists')
  }

  const now = new Date().toISOString()
  const recipe: Recipe = {
    id: generateId('rec_'),
    name: data.name.trim(),
    description: data.description ?? '',
    category: data.category.trim().toLowerCase(),
    yield: data.yield,
    pieces: data.pieces ?? 1,
    prepTimeMinutes: data.prepTimeMinutes,
    bakeTimeMinutes: data.bakeTimeMinutes,
    imageUrl: data.imageUrl ?? '',
    difficulty: data.difficulty ?? 'intermediate',
    ingredients: data.ingredients,
    steps: data.steps,
    tags: data.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }

  recipes.push(recipe)
  await saveRecipes(recipes)
  return enrichRecipe(recipe)
}

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<RecipeDetail> {
  const data = updateRecipeSchema.parse(input)
  const recipes = await getAllRecipes()
  const index = recipes.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error('Recipe not found')
  }

  if (data.name) {
    const normalizedName = data.name.trim().toLowerCase()
    if (
      recipes.some(
        (item) => item.id !== id && item.name.trim().toLowerCase() === normalizedName,
      )
    ) {
      throw new Error('A recipe with this name already exists')
    }
  }

  if (data.ingredients) {
    const ingredients = await getAllIngredients()
    const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))
    validateIngredientReferences(data.ingredients, ingredientMap)
  }

  const current = recipes[index]
  const updated: Recipe = {
    ...current,
    ...data,
    name: data.name?.trim() ?? current.name,
    category: data.category?.trim().toLowerCase() ?? current.category,
    description: data.description ?? current.description,
    imageUrl: data.imageUrl ?? current.imageUrl,
    difficulty: data.difficulty ?? current.difficulty,
    tags: data.tags ?? current.tags,
    updatedAt: new Date().toISOString(),
  }

  recipes[index] = updated
  await saveRecipes(recipes)
  return enrichRecipe(updated)
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await getAllRecipes()
  const index = recipes.findIndex((item) => item.id === id)

  if (index === -1) {
    throw new Error('Recipe not found')
  }

  recipes.splice(index, 1)
  await saveRecipes(recipes)
}

export async function duplicateRecipe(id: string): Promise<RecipeDetail> {
  const recipes = await getAllRecipes()
  const recipe = recipes.find((item) => item.id === id)

  if (!recipe) {
    throw new Error('Recipe not found')
  }

  const now = new Date().toISOString()
  let copyName = `${recipe.name} (Copy)`
  let suffix = 2
  while (recipes.some((item) => item.name === copyName)) {
    copyName = `${recipe.name} (Copy ${suffix})`
    suffix += 1
  }

  const duplicate: Recipe = {
    ...recipe,
    id: generateId('rec_'),
    name: copyName,
    createdAt: now,
    updatedAt: now,
  }

  recipes.push(duplicate)
  await saveRecipes(recipes)
  return enrichRecipe(duplicate)
}
