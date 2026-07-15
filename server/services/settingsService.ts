import { updateSettingsSchema, type UpdateSettingsInput } from '../schemas/settings.js'
import { getSettings, saveSettings } from '../repositories/settingsRepository.js'
import type { Settings } from '../schemas/ingredient.js'

export async function updateSettings(input: UpdateSettingsInput): Promise<Settings> {
  const data = updateSettingsSchema.parse(input)
  await saveSettings(data)
  return data
}

export async function getAppSettings(): Promise<Settings> {
  return getSettings()
}
