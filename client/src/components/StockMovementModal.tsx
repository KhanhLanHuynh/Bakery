import { useEffect, useState, type FormEvent } from 'react'
import type { Ingredient, MovementInput } from '../types'
import { todayIsoDate } from '../utils/format'

interface StockMovementModalProps {
  open: boolean
  ingredient: Ingredient | null
  mode: 'in' | 'out'
  onClose: () => void
  onSave: (data: MovementInput) => Promise<void>
}

export function StockMovementModal({
  open,
  ingredient,
  mode,
  onClose,
  onSave,
}: StockMovementModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [date, setDate] = useState(todayIsoDate())
  const [reason, setReason] = useState<'purchase' | 'waste' | 'other'>(
    mode === 'in' ? 'purchase' : 'waste',
  )
  const [expiryDate, setExpiryDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setQuantity(1)
    setDate(todayIsoDate())
    setReason(mode === 'in' ? 'purchase' : 'waste')
    setExpiryDate(ingredient?.expiryDate ?? '')
    setNote('')
    setError(null)
  }, [open, ingredient, mode])

  if (!open || !ingredient) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ingredient) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        ingredientId: ingredient.id,
        type: mode,
        quantity,
        date,
        reason,
        expiryDate: mode === 'in' ? expiryDate || null : null,
        note,
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to record movement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-bakery-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movement-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="movement-modal-title" className="font-serif text-2xl text-bakery-brown">
              {mode === 'in' ? 'Stock In' : 'Stock Out'}
            </h2>
            <p className="mt-1 text-sm text-bakery-muted">{ingredient.name}</p>
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
            <span className="mb-1 block font-medium text-bakery-brown-dark">Quantity ({ingredient.unit})</span>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
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
            <span className="mb-1 block font-medium text-bakery-brown-dark">Reason</span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as typeof reason)}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            >
              {mode === 'in' ? (
                <option value="purchase">Purchase</option>
              ) : (
                <>
                  <option value="waste">Waste</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
          </label>

          {mode === 'in' && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Expiry Date</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

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
              disabled={saving}
              className="rounded-lg bg-bakery-brown px-4 py-2 text-sm font-medium text-white hover:bg-bakery-brown-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'in' ? 'Record Stock In' : 'Record Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
