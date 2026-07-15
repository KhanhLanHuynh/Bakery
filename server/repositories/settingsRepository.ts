import { readJsonFile, writeJsonFile } from './fileRepository.js'
import { defaultSettings, type Settings } from '../schemas/ingredient.js'

const FILENAME = 'settings.json'

export async function getSettings(): Promise<Settings> {
  return readJsonFile<Settings>(FILENAME, defaultSettings)
}

export async function saveSettings(settings: Settings): Promise<void> {
  await writeJsonFile(FILENAME, settings)
}
