import type { Ingredient } from '../types'
import { formatCategory, formatExpiryDate, formatQuantity } from '../utils/format'

interface IngredientTableProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onStockIn: (ingredient: Ingredient) => void
  onStockOut: (ingredient: Ingredient) => void
}

function ExpiryIcon({ status }: { status: Ingredient['expiryStatus'] }) {
  if (status === 'expired') {
    return <span className="text-red-600" title="Expired">⏰</span>
  }
  if (status === 'expiring_soon') {
    return <span className="text-amber-600" title="Expiring soon">⏰</span>
  }
  return null
}

function quantityClass(ingredient: Ingredient): string {
  if (ingredient.isLowStock) {
    return 'font-semibold text-red-600'
  }
  if (ingredient.currentQuantity <= ingredient.reorderLevel * 1.5) {
    return 'font-medium text-amber-600'
  }
  return 'text-bakery-brown-dark'
}

export function IngredientTable({
  ingredients,
  onEdit,
  onStockIn,
  onStockOut,
}: IngredientTableProps) {
  if (ingredients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-bakery-border bg-white/50 px-6 py-12 text-center text-sm text-bakery-muted">
        No ingredients yet. Click &quot;+ Ingredient&quot; to add your first item.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-bakery-border bg-white/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-bakery-border bg-bakery-card/80 text-xs uppercase tracking-wide text-bakery-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Ingredient Name</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Expiry Date</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <tr
              key={ingredient.id}
              className="border-b border-bakery-border/70 transition hover:bg-bakery-card/40 last:border-b-0"
            >
              <td className="cursor-pointer px-4 py-4" onClick={() => onEdit(ingredient)}>
                <div className="font-medium text-bakery-brown-dark">{ingredient.name}</div>
                <div className="mt-0.5 text-xs tracking-wide text-bakery-muted">
                  {formatCategory(ingredient.category)}
                </div>
              </td>
              <td
                className={`cursor-pointer px-4 py-4 ${quantityClass(ingredient)}`}
                onClick={() => onEdit(ingredient)}
              >
                {formatQuantity(ingredient.currentQuantity, ingredient.unit)}
              </td>
              <td className="cursor-pointer px-4 py-4" onClick={() => onEdit(ingredient)}>
                <div className="flex items-center gap-2 text-bakery-brown-dark">
                  <span>{formatExpiryDate(ingredient.expiryDate)}</span>
                  <ExpiryIcon status={ingredient.expiryStatus} />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onStockIn(ingredient)}
                    className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                    title="Stock in"
                  >
                    + In
                  </button>
                  <button
                    type="button"
                    onClick={() => onStockOut(ingredient)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                    title="Stock out"
                  >
                    - Out
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
