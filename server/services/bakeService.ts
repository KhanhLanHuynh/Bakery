import { generateId } from '../utils/id.js'
import { convertQuantity } from '../utils/units.js'
import { makeRecipeSchema, type Bake, type MakeRecipeInput } from '../schemas/bake.js'
import type { Movement } from '../schemas/movement.js'
import type { Ingredient } from '../schemas/ingredient.js'
import { getAllIngredients, saveIngredients } from '../repositories/ingredientRepository.js'
import { getAllMovements, saveMovements } from '../repositories/movementRepository.js'
import { getAllBakes, saveBakes } from '../repositories/bakeRepository.js'
import { getAllRecipes } from '../repositories/recipeRepository.js'
import { getRecipeFeasibility } from './recipeService.js'

function normalizeExpiryDate(expiryDate: string | null, quantity: number): string | null {
  if (!expiryDate || quantity <= 0) {
    return null
  }
  return expiryDate
}

function deductIngredient(
  ingredient: Ingredient,
  quantity: number,
): Ingredient {
  const currentQuantity = ingredient.currentQuantity - quantity
  if (currentQuantity < 0) {
    throw new Error(`Insufficient stock for ${ingredient.name}`)
  }

  return {
    ...ingredient,
    currentQuantity,
    expiryDate: normalizeExpiryDate(ingredient.expiryDate, currentQuantity),
    updatedAt: new Date().toISOString(),
  }
}

export async function listBakes(): Promise<Bake[]> {
  const bakes = await getAllBakes()
  return bakes.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) {
      return dateCompare
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export async function makeRecipe(
  recipeId: string,
  input: MakeRecipeInput,
): Promise<{ bake: Bake; movements: Movement[] }> {
  const data = makeRecipeSchema.parse(input)
  const recipes = await getAllRecipes()
  const recipe = recipes.find((item) => item.id === recipeId)

  if (!recipe) {
    throw new Error('Recipe not found')
  }

  const feasibility = await getRecipeFeasibility(recipeId, data.batchCount)
  if (!feasibility) {
    throw new Error('Recipe not found')
  }

  if (!feasibility.makeable) {
    const messages = feasibility.issues.map((issue) =>
      issue.type === 'expired'
        ? `${issue.ingredientName} is expired`
        : `${issue.ingredientName}: need ${issue.required}${issue.unit}, have ${issue.available}${issue.unit}`,
    )
    throw new Error(`Cannot make recipe: ${messages.join('; ')}`)
  }

  const ingredients = await getAllIngredients()
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))
  const deductions: { ingredientId: string; quantity: number }[] = []

  for (const item of recipe.ingredients) {
    const ingredient = ingredientMap.get(item.ingredientId)
    if (!ingredient) {
      throw new Error(`Ingredient not found: ${item.ingredientId}`)
    }

    const converted = convertQuantity(item.quantity * data.batchCount, item.unit, ingredient.unit)
    if (converted === null) {
      throw new Error(`Cannot convert ${item.unit} to ${ingredient.unit} for ${ingredient.name}`)
    }

    deductions.push({ ingredientId: item.ingredientId, quantity: converted })
  }

  const now = new Date().toISOString()
  const bakeDate = data.date ?? now.slice(0, 10)
  const bake: Bake = {
    id: generateId('bake_'),
    recipeId: recipe.id,
    recipeName: recipe.name,
    batchCount: data.batchCount,
    date: bakeDate,
    note: data.note ?? '',
    createdAt: now,
  }

  const movements: Movement[] = []
  const movementNote =
    data.note?.trim() ||
    `${recipe.name} × ${data.batchCount} batch${data.batchCount === 1 ? '' : 'es'}`

  for (const deduction of deductions) {
    const index = ingredients.findIndex((item) => item.id === deduction.ingredientId)
    if (index === -1) {
      throw new Error(`Ingredient not found: ${deduction.ingredientId}`)
    }

    ingredients[index] = deductIngredient(ingredients[index], deduction.quantity)

    movements.push({
      id: generateId('mov_'),
      ingredientId: deduction.ingredientId,
      type: 'out',
      quantity: deduction.quantity,
      date: bakeDate,
      reason: 'bake',
      expiryDate: null,
      referenceId: bake.id,
      note: movementNote,
      createdAt: now,
    })
  }

  const bakes = await getAllBakes()
  const existingMovements = await getAllMovements()
  bakes.push(bake)
  existingMovements.push(...movements)

  await Promise.all([
    saveIngredients(ingredients),
    saveMovements(existingMovements),
    saveBakes(bakes),
  ])

  return { bake, movements }
}
