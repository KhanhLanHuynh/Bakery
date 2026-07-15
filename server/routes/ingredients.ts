import { Router } from 'express'
import { ZodError } from 'zod'
import {
  createIngredient,
  deleteIngredient,
  getIngredientById,
  listIngredients,
  updateIngredient,
} from '../services/ingredientService.js'

export const ingredientsRouter = Router()

ingredientsRouter.get('/', async (req, res) => {
  try {
    const ingredients = await listIngredients({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      lowStock: req.query.lowStock === 'true',
      expired: req.query.expired === 'true',
      expiringSoon: req.query.expiringSoon === 'true',
    })
    res.json(ingredients)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

ingredientsRouter.get('/:id', async (req, res) => {
  try {
    const ingredient = await getIngredientById(req.params.id)
    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' })
      return
    }
    res.json(ingredient)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

ingredientsRouter.post('/', async (req, res) => {
  try {
    const ingredient = await createIngredient(req.body)
    res.status(201).json(ingredient)
  } catch (error) {
    sendValidationError(res, error)
  }
})

ingredientsRouter.put('/:id', async (req, res) => {
  try {
    const ingredient = await updateIngredient(req.params.id, req.body)
    res.json(ingredient)
  } catch (error) {
    if (error instanceof Error && error.message === 'Ingredient not found') {
      res.status(404).json({ error: error.message })
      return
    }
    sendValidationError(res, error)
  }
})

ingredientsRouter.delete('/:id', async (req, res) => {
  try {
    await deleteIngredient(req.params.id)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Ingredient not found') {
        res.status(404).json({ error: error.message })
        return
      }
      if (error.message.includes('used in a recipe')) {
        res.status(409).json({ error: error.message })
        return
      }
    }
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function sendValidationError(res: import('express').Response, error: unknown): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.flatten(),
    })
    return
  }

  if (error instanceof Error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.status(500).json({ error: 'Unexpected error' })
}
