import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
export const dataDir = path.resolve(serverDir, '..', '..', 'data')

export async function ensureDataDir(): Promise<void> {
  await mkdir(dataDir, { recursive: true })
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir()
  const filePath = path.join(dataDir, filename)

  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeJsonFile(filename, fallback)
      return fallback
    }
    throw error
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(dataDir, filename)
  const tempPath = `${filePath}.${process.pid}.tmp`
  const content = `${JSON.stringify(data, null, 2)}\n`

  await writeFile(tempPath, content, 'utf-8')
  await rename(tempPath, filePath)
}
