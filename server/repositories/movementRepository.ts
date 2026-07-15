import { readJsonFile, writeJsonFile } from './fileRepository.js'
import type { Movement } from '../schemas/movement.js'

const FILENAME = 'movements.json'

export async function getAllMovements(): Promise<Movement[]> {
  return readJsonFile<Movement[]>(FILENAME, [])
}

export async function saveMovements(movements: Movement[]): Promise<void> {
  await writeJsonFile(FILENAME, movements)
}
