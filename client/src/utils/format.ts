export function formatCategory(category: string): string {
  return category.toUpperCase()
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString('en-US')}${unit}`
}

export function formatCurrency(amount: number, symbol = '₫'): string {
  return `${amount.toLocaleString('en-US')} ${symbol}`
}

export function formatExpiryDate(date: string | null): string {
  if (!date) {
    return '—'
  }
  return date
}

export function formatMovementType(type: MovementTypeLabel): string {
  const labels: Record<MovementTypeLabel, string> = {
    in: 'Stock In',
    out: 'Stock Out',
    adjustment: 'Adjustment',
  }
  return labels[type]
}

export function formatMovementReason(reason: MovementReasonLabel): string {
  const labels: Record<MovementReasonLabel, string> = {
    purchase: 'Purchase',
    bake: 'Bake',
    waste: 'Waste',
    correction: 'Correction',
    other: 'Other',
  }
  return labels[reason]
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function formatTotalTime(prepMinutes: number, bakeMinutes: number): string {
  const total = prepMinutes + bakeMinutes
  if (total >= 60) {
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${total}m`
}

type MovementTypeLabel = 'in' | 'out' | 'adjustment'
type MovementReasonLabel = 'purchase' | 'bake' | 'waste' | 'correction' | 'other'
