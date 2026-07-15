import { readJsonFile, writeJsonFile } from './fileRepository.js'
import type { Bake } from '../schemas/bake.js'

const FILENAME = 'bakes.json'

export async function getAllBakes(): Promise<Bake[]> {
  return readJsonFile<Bake[]>(FILENAME, [])
}

export async function saveBakes(bakes: Bake[]): Promise<void> {
  await writeJsonFile(FILENAME, bakes)
}
