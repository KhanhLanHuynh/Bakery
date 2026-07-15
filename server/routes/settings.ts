import { Router } from 'express'
import { ZodError } from 'zod'
import { getAppSettings, updateSettings } from '../services/settingsService.js'

export const settingsRouter = Router()

settingsRouter.get('/', async (_req, res) => {
  try {
    const settings = await getAppSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) })
  }
})

settingsRouter.put('/', async (req, res) => {
  try {
    const settings = await updateSettings(req.body)
    res.json(settings)
  } catch (error) {
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
