import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { dataDir, readJsonFile, writeJsonFile } from '../repositories/fileRepository.js'
import { defaultSettings } from '../schemas/ingredient.js'
import type { Ingredient } from '../schemas/ingredient.js'
import type { Recipe } from '../schemas/recipe.js'

async function readSampleJson<T>(filename: string): Promise<T | null> {
  try {
    const content = await readFile(path.join(dataDir, 'sample', filename), 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

function withFreshTimestamps<T extends { createdAt?: string; updatedAt?: string }>(
  items: T[],
): T[] {
  const now = new Date().toISOString()
  return items.map((item) => ({
    ...item,
    createdAt: now,
    updatedAt: now,
  }))
}

export async function initializeData(): Promise<void> {
  await readJsonFile('settings.json', defaultSettings)
  await readJsonFile('recipes.json', [])
  await readJsonFile('movements.json', [])
  await readJsonFile('bakes.json', [])

  const ingredients = await readJsonFile<Ingredient[]>('ingredients.json', [])
  if (ingredients.length === 0) {
    const sampleIngredients = await readSampleJson<Ingredient[]>('ingredients.json')
    if (sampleIngredients && sampleIngredients.length > 0) {
      await writeJsonFile('ingredients.json', withFreshTimestamps(sampleIngredients))
    }
  }

  const recipes = await readJsonFile<Recipe[]>('recipes.json', [])
  if (recipes.length === 0) {
    const sampleRecipes = await readSampleJson<Recipe[]>('recipes.json')
    if (sampleRecipes && sampleRecipes.length > 0) {
      await writeJsonFile('recipes.json', withFreshTimestamps(sampleRecipes))
    }
  }
}
