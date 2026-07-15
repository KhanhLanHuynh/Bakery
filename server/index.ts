import cors from 'cors'
import express from 'express'
import { ingredientsRouter } from './routes/ingredients.js'
import { movementsRouter } from './routes/movements.js'
import { recipesRouter } from './routes/recipes.js'
import { bakesRouter } from './routes/bakes.js'
import { settingsRouter } from './routes/settings.js'
import { initializeData } from './seed/initializeData.js'
import { streamDataBackup } from './services/backupService.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/settings', settingsRouter)
app.get('/api/backup', async (_req, res) => {
  try {
    await streamDataBackup(res)
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' })
    }
  }
})

app.use('/api/ingredients', ingredientsRouter)
app.use('/api/movements', movementsRouter)
app.use('/api/recipes', recipesRouter)
app.use('/api/bakes', bakesRouter)

async function start(): Promise<void> {
  await initializeData()
  app.listen(PORT, () => {
    console.log(`Bakery API running at http://localhost:${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to initialize data:', error)
  process.exit(1)
})
