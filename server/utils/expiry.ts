export type ExpiryStatus = 'none' | 'ok' | 'expiring_soon' | 'expired'

export function getExpiryStatus(
  expiryDate: string | null | undefined,
  quantity: number,
  warningDays: number,
  today: Date = new Date(),
): ExpiryStatus {
  if (!expiryDate || quantity <= 0) {
    return 'none'
  }

  const expiry = new Date(`${expiryDate}T00:00:00`)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const warningStart = new Date(startOfToday)
  warningStart.setDate(warningStart.getDate() + warningDays)

  if (expiry < startOfToday) {
    return 'expired'
  }

  if (expiry <= warningStart) {
    return 'expiring_soon'
  }

  return 'ok'
}
