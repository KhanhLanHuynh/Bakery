import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchIngredients, fetchMovements } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import type { Ingredient, Movement } from '../types'
import {
  formatMovementReason,
  formatMovementType,
  formatQuantity,
} from '../utils/format'

export function MovementsPage() {
  const navigate = useNavigate()
  const [movements, setMovements] = useState<Movement[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ingredientId, setIngredientId] = useState('')
  const [type, setType] = useState<'' | Movement['type']>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [movementData, ingredientData] = await Promise.all([
        fetchMovements({
          ingredientId: ingredientId || undefined,
          type: type || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
        fetchIngredients(),
      ])
      setMovements(movementData)
      setIngredients(ingredientData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load movements')
    } finally {
      setLoading(false)
    }
  }, [ingredientId, type, from, to])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const ingredientOptions = useMemo(
    () => ingredients.map((item) => ({ id: item.id, name: item.name })),
    [ingredients],
  )

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader onAddIngredient={() => navigate('/')} />

        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-bakery-tan hover:text-bakery-card"
          >
            ← Back to home
          </button>
        </div>

        <section className="rounded-2xl bg-bakery-card p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-bakery-brown">Stock Movements</h2>
            <p className="mt-1 text-sm text-bakery-muted">
              Chronological history of stock in, stock out, and adjustments.
            </p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <select
              value={ingredientId}
              onChange={(event) => setIngredientId(event.target.value)}
              className="rounded-xl border border-bakery-border bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All ingredients</option>
              {ingredientOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(event) => setType(event.target.value as '' | Movement['type'])}
              className="rounded-xl border border-bakery-border bg-white px-3 py-2.5 text-sm"
            >
              <option value="">All types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>

            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-xl border border-bakery-border bg-white px-3 py-2.5 text-sm"
              placeholder="From"
            />

            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-xl border border-bakery-border bg-white px-3 py-2.5 text-sm"
              placeholder="To"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="py-16 text-center text-bakery-muted">Loading movements...</div>
          ) : movements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-bakery-border bg-white/50 px-6 py-12 text-center text-sm text-bakery-muted">
              No movements recorded yet. Use Stock In or Stock Out from the inventory panel.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-bakery-border bg-white/60">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-bakery-border bg-bakery-card/80 text-xs uppercase tracking-wide text-bakery-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Ingredient</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-bakery-border/70 last:border-b-0"
                    >
                      <td className="px-4 py-4 text-bakery-brown-dark">{movement.date}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-bakery-brown-dark">
                          {movement.ingredientName}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            movement.type === 'in'
                              ? 'font-medium text-green-700'
                              : movement.type === 'out'
                                ? 'font-medium text-amber-800'
                                : 'font-medium text-bakery-brown'
                          }
                        >
                          {formatMovementType(movement.type)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-bakery-brown-dark">
                        {movement.type === 'out' ? '-' : '+'}
                        {formatQuantity(movement.quantity, movement.ingredientUnit)}
                      </td>
                      <td className="px-4 py-4 text-bakery-muted">
                        {formatMovementReason(movement.reason)}
                      </td>
                      <td className="px-4 py-4 text-bakery-muted">{movement.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
