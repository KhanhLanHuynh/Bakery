import { Router } from 'express'
import { listBakes } from '../services/bakeService.js'

export const bakesRouter = Router()

bakesRouter.get('/', async (_req, res) => {
  try {
    const bakes = await listBakes()
    res.json(bakes)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error'
}
