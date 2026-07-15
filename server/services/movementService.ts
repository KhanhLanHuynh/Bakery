import { generateId } from '../utils/id.js'
import {
  createMovementSchema,
  type CreateMovementInput,
  type Movement,
} from '../schemas/movement.js'
import { getAllIngredients, saveIngredients } from '../repositories/ingredientRepository.js'
import { getAllMovements, saveMovements } from '../repositories/movementRepository.js'
import type { Ingredient } from '../schemas/ingredient.js'

export type MovementWithIngredient = Movement & {
  ingredientName: string
  ingredientUnit: string
}

function normalizeExpiryDate(expiryDate: string | null | undefined, quantity: number): string | null {
  if (!expiryDate || quantity <= 0) {
    return null
  }
  return expiryDate
}

function applyMovementToIngredient(
  ingredient: Ingredient,
  input: CreateMovementInput,
): { updated: Ingredient; recordedQuantity: number } {
  const previousQuantity = ingredient.currentQuantity
  let currentQuantity = ingredient.currentQuantity
  let expiryDate = ingredient.expiryDate

  if (input.type === 'in') {
    currentQuantity += input.quantity
    if (input.expiryDate) {
      expiryDate = input.expiryDate
    }
  } else if (input.type === 'out') {
    currentQuantity -= input.quantity
    if (currentQuantity < 0) {
      throw new Error('Insufficient stock for this movement')
    }
  } else {
    currentQuantity = input.targetQuantity ?? currentQuantity
  }

  expiryDate = normalizeExpiryDate(expiryDate, currentQuantity)

  const recordedQuantity =
    input.type === 'adjustment'
      ? Math.abs(currentQuantity - previousQuantity)
      : input.quantity

  return {
    recordedQuantity,
    updated: {
      ...ingredient,
      currentQuantity,
      expiryDate,
      updatedAt: new Date().toISOString(),
    },
  }
}

export async function listMovements(filters?: {
  ingredientId?: string
  type?: Movement['type']
  from?: string
  to?: string
}): Promise<MovementWithIngredient[]> {
  const [movements, ingredients] = await Promise.all([getAllMovements(), getAllIngredients()])
  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]))

  let result = movements.map((movement) => {
    const ingredient = ingredientMap.get(movement.ingredientId)
    return {
      ...movement,
      ingredientName: ingredient?.name ?? 'Unknown ingredient',
      ingredientUnit: ingredient?.unit ?? '',
    }
  })

  if (filters?.ingredientId) {
    result = result.filter((item) => item.ingredientId === filters.ingredientId)
  }
  if (filters?.type) {
    result = result.filter((item) => item.type === filters.type)
  }
  if (filters?.from) {
    result = result.filter((item) => item.date >= filters.from!)
  }
  if (filters?.to) {
    result = result.filter((item) => item.date <= filters.to!)
  }

  return result.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    if (dateCompare !== 0) {
      return dateCompare
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export async function createMovement(input: CreateMovementInput): Promise<MovementWithIngredient> {
  const data = createMovementSchema.parse(input)
  const ingredients = await getAllIngredients()
  const index = ingredients.findIndex((item) => item.id === data.ingredientId)

  if (index === -1) {
    throw new Error('Ingredient not found')
  }

  const { updated, recordedQuantity } = applyMovementToIngredient(ingredients[index], data)
  ingredients[index] = updated

  const movement: Movement = {
    id: generateId('mov_'),
    ingredientId: data.ingredientId,
    type: data.type,
    quantity: recordedQuantity,
    date: data.date,
    reason: data.reason,
    expiryDate: data.type === 'in' ? (data.expiryDate ?? null) : null,
    referenceId: data.referenceId ?? null,
    note: data.note ?? '',
    createdAt: new Date().toISOString(),
  }

  const movements = await getAllMovements()
  movements.push(movement)
  await Promise.all([saveIngredients(ingredients), saveMovements(movements)])

  return {
    ...movement,
    ingredientName: updated.name,
    ingredientUnit: updated.unit,
  }
}
