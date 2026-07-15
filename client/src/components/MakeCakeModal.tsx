import { useEffect, useState, type FormEvent } from 'react'
import { fetchRecipeFeasibility } from '../api/client'
import type { FeasibilityResult, RecipeDetail } from '../types'
import { formatQuantity, todayIsoDate } from '../utils/format'

interface MakeCakeModalProps {
  open: boolean
  recipe: RecipeDetail | null
  batchCount: number
  onBatchCountChange: (count: number) => void
  onClose: () => void
  onConfirm: (data: { batchCount: number; date: string; note: string }) => Promise<void>
}

export function MakeCakeModal({
  open,
  recipe,
  batchCount,
  onBatchCountChange,
  onClose,
  onConfirm,
}: MakeCakeModalProps) {
  const [date, setDate] = useState(todayIsoDate())
  const [note, setNote] = useState('')
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null)
  const [loadingFeasibility, setLoadingFeasibility] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !recipe) {
      return
    }

    setDate(todayIsoDate())
    setNote('')
    setError(null)
    setFeasibility(null)
  }, [open, recipe])

  useEffect(() => {
    if (!open || !recipe) {
      return
    }

    let cancelled = false
    setLoadingFeasibility(true)

    void fetchRecipeFeasibility(recipe.id, batchCount)
      .then((result) => {
        if (!cancelled) {
          setFeasibility(result)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to check feasibility')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFeasibility(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, recipe, batchCount])

  if (!open || !recipe) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onConfirm({ batchCount, date, note })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to make recipe')
    } finally {
      setSaving(false)
    }
  }

  const canConfirm = feasibility?.makeable && !loadingFeasibility && !saving

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-bakery-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="make-cake-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="make-cake-modal-title" className="font-serif text-2xl text-bakery-brown">
              Make Cake
            </h2>
            <p className="mt-1 text-sm text-bakery-muted">{recipe.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-bakery-muted hover:bg-white/60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Batch count</span>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={batchCount}
              onChange={(event) => onBatchCountChange(Math.max(1, Number(event.target.value)))}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Date</span>
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Note (optional)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          <div className="rounded-xl border border-bakery-border bg-white/60 p-4">
            <h3 className="text-sm font-medium text-bakery-brown-dark">Feasibility check</h3>

            {loadingFeasibility ? (
              <p className="mt-2 text-sm text-bakery-muted">Checking stock...</p>
            ) : feasibility ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="space-y-1">
                  <p className="font-medium text-bakery-brown-dark">Ingredients required:</p>
                  {recipe.ingredients.map((line) => {
                    const issue = feasibility.issues.find(
                      (item) => item.ingredientId === line.ingredientId,
                    )
                    const breakdown = recipe.costBreakdown.find(
                      (item) => item.ingredientId === line.ingredientId,
                    )
                    const requiredQty = line.quantity * batchCount
                    const name = breakdown?.ingredientName ?? 'Ingredient'

                    return (
                      <div key={line.ingredientId} className="text-bakery-muted">
                        {name}: {formatQuantity(requiredQty, line.unit)}
                        {issue?.type === 'shortfall' && (
                          <span className="text-red-700">
                            {' '}
                            (have {issue.available}
                            {issue.unit})
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {feasibility.issues.length > 0 && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
                    {feasibility.issues.map((issue) => (
                      <div key={`${issue.ingredientId}-${issue.type}`}>
                        {issue.type === 'expired'
                          ? `${issue.ingredientName} is expired`
                          : `${issue.ingredientName}: need ${issue.required}${issue.unit}, have ${issue.available}${issue.unit}`}
                      </div>
                    ))}
                  </div>
                )}

                {feasibility.warnings.length > 0 && (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                    {feasibility.warnings.map((warning) => (
                      <div key={warning.ingredientId}>
                        {warning.ingredientName} is expiring soon
                      </div>
                    ))}
                  </div>
                )}

                {feasibility.makeable && feasibility.warnings.length === 0 && (
                  <p className="text-bakery-brown-dark">All ingredients are available.</p>
                )}
              </div>
            ) : null}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-bakery-border px-4 py-2 text-sm text-bakery-muted hover:bg-white/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canConfirm}
              className="rounded-lg bg-bakery-brown px-4 py-2 text-sm font-medium text-white hover:bg-bakery-brown-dark disabled:opacity-50"
            >
              {saving ? 'Making...' : 'Make Cake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
