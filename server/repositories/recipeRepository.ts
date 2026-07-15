import { readJsonFile, writeJsonFile } from './fileRepository.js'
import type { Recipe } from '../schemas/recipe.js'

const FILENAME = 'recipes.json'

export async function getAllRecipes(): Promise<Recipe[]> {
  return readJsonFile<Recipe[]>(FILENAME, [])
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await writeJsonFile(FILENAME, recipes)
}
