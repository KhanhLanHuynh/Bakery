const CONVERSIONS: Record<string, Record<string, number>> = {
  g: { kg: 0.001 },
  kg: { g: 1000 },
  ml: { L: 0.001 },
  L: { ml: 1000 },
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (fromUnit === toUnit) {
    return quantity
  }

  const direct = CONVERSIONS[fromUnit]?.[toUnit]
  if (direct !== undefined) {
    return quantity * direct
  }

  const reverse = CONVERSIONS[toUnit]?.[fromUnit]
  if (reverse !== undefined) {
    return quantity / reverse
  }

  return null
}
