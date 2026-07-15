import { randomBytes } from 'node:crypto'

export function generateId(prefix: string): string {
  return `${prefix}${randomBytes(4).toString('hex')}`
}
