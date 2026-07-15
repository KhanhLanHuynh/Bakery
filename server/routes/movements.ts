import { Router } from 'express'
import { ZodError } from 'zod'
import { createMovement, listMovements } from '../services/movementService.js'
import type { Movement } from '../schemas/movement.js'

export const movementsRouter = Router()

movementsRouter.get('/', async (req, res) => {
  try {
    const type = req.query.type
    const movements = await listMovements({
      ingredientId: typeof req.query.ingredientId === 'string' ? req.query.ingredientId : undefined,
      type:
        typeof type === 'string' && ['in', 'out', 'adjustment'].includes(type)
          ? (type as Movement['type'])
          : undefined,
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    })
    res.json(movements)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

movementsRouter.post('/', async (req, res) => {
  try {
    const movement = await createMovement(req.body)
    res.status(201).json(movement)
  } catch (error) {
    if (error instanceof Error && error.message === 'Ingredient not found') {
      res.status(404).json({ error: error.message })
      return
    }
    if (error instanceof Error && error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: error.message })
      return
    }
    sendValidationError(res, error)
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
