import { ZipArchive } from 'archiver'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Response } from 'express'
import { dataDir } from '../repositories/fileRepository.js'

const BACKUP_FILES = [
  'ingredients.json',
  'recipes.json',
  'movements.json',
  'bakes.json',
  'settings.json',
]

export async function streamDataBackup(res: Response): Promise<void> {
  const date = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="bakery-backup-${date}.zip"`)

  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on('error', (error: Error) => {
    throw error
  })
  archive.pipe(res)

  const availableFiles = await readdir(dataDir)
  for (const filename of BACKUP_FILES) {
    if (availableFiles.includes(filename)) {
      archive.file(path.join(dataDir, filename), { name: filename })
    }
  }

  await archive.finalize()
}
