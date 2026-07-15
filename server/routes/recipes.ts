import { Router } from 'express'
import { ZodError } from 'zod'
import {
  createRecipe,
  deleteRecipe,
  duplicateRecipe,
  getRecipeById,
  getRecipeFeasibility,
  listRecipes,
  updateRecipe,
} from '../services/recipeService.js'
import { makeRecipe } from '../services/bakeService.js'

export const recipesRouter = Router()

recipesRouter.get('/', async (_req, res) => {
  try {
    const recipes = await listRecipes()
    res.json(recipes)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

recipesRouter.get('/:id/feasibility', async (req, res) => {
  try {
    const batchCount = parseBatchCount(req.query.batches)
    const feasibility = await getRecipeFeasibility(req.params.id, batchCount)
    if (!feasibility) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }
    res.json(feasibility)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

recipesRouter.post('/:id/make', async (req, res) => {
  try {
    const result = await makeRecipe(req.params.id, req.body)
    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      res.status(404).json({ error: error.message })
      return
    }
    if (error instanceof Error && error.message.startsWith('Cannot make recipe')) {
      res.status(400).json({ error: error.message })
      return
    }
    sendValidationError(res, error)
  }
})

recipesRouter.get('/:id', async (req, res) => {
  try {
    const recipe = await getRecipeById(req.params.id)
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }
    res.json(recipe)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

recipesRouter.post('/', async (req, res) => {
  try {
    const recipe = await createRecipe(req.body)
    res.status(201).json(recipe)
  } catch (error) {
    sendValidationError(res, error)
  }
})

recipesRouter.put('/:id', async (req, res) => {
  try {
    const recipe = await updateRecipe(req.params.id, req.body)
    res.json(recipe)
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      res.status(404).json({ error: error.message })
      return
    }
    sendValidationError(res, error)
  }
})

recipesRouter.delete('/:id', async (req, res) => {
  try {
    await deleteRecipe(req.params.id)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      res.status(404).json({ error: error.message })
      return
    }
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

recipesRouter.post('/:id/duplicate', async (req, res) => {
  try {
    const recipe = await duplicateRecipe(req.params.id)
    res.status(201).json(recipe)
  } catch (error) {
    if (error instanceof Error && error.message === 'Recipe not found') {
      res.status(404).json({ error: error.message })
      return
    }
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error'
}

function parseBatchCount(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : 1
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }
  return parsed
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
