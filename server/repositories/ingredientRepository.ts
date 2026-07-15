import { readJsonFile, writeJsonFile } from './fileRepository.js'
import type { Ingredient } from '../schemas/ingredient.js'

const FILENAME = 'ingredients.json'

export async function getAllIngredients(): Promise<Ingredient[]> {
  return readJsonFile<Ingredient[]>(FILENAME, [])
}

export async function saveIngredients(ingredients: Ingredient[]): Promise<void> {
  await writeJsonFile(FILENAME, ingredients)
}
