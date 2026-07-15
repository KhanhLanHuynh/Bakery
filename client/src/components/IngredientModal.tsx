import { useEffect, useState, type FormEvent } from 'react'
import type { Ingredient, IngredientInput, Settings } from '../types'

interface IngredientModalProps {
  open: boolean
  ingredient: Ingredient | null
  settings: Settings | null
  onClose: () => void
  onSave: (data: IngredientInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onStockIn?: () => void
  onStockOut?: () => void
}

const emptyForm: IngredientInput = {
  name: '',
  category: 'flour',
  unit: 'g',
  unitCost: 0,
  currentQuantity: 0,
  reorderLevel: 0,
  expiryDate: null,
  notes: '',
}

export function IngredientModal({
  open,
  ingredient,
  settings,
  onClose,
  onSave,
  onDelete,
  onStockIn,
  onStockOut,
}: IngredientModalProps) {
  const [form, setForm] = useState<IngredientInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    if (ingredient) {
      setForm({
        name: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        unitCost: ingredient.unitCost,
        currentQuantity: ingredient.currentQuantity,
        reorderLevel: ingredient.reorderLevel,
        expiryDate: ingredient.expiryDate,
        notes: ingredient.notes,
      })
    } else {
      setForm({
        ...emptyForm,
        category: settings?.ingredientCategories[0] ?? 'flour',
        unit: settings?.units[0] ?? 'g',
      })
    }
    setError(null)
  }, [open, ingredient, settings])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave({
        ...form,
        expiryDate: form.expiryDate || null,
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save ingredient')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!ingredient || !onDelete) {
      return
    }

    if (!window.confirm(`Delete "${ingredient.name}"?`)) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onDelete(ingredient.id)
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete ingredient')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-bakery-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="ingredient-modal-title" className="font-serif text-2xl text-bakery-brown">
              {ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
            </h2>
            <p className="mt-1 text-sm text-bakery-muted">
              {ingredient ? 'Update inventory details.' : 'Add a new item to inventory.'}
            </p>
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
            <span className="mb-1 block font-medium text-bakery-brown-dark">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              >
                {(settings?.ingredientCategories ?? ['flour']).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Unit</span>
              <select
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              >
                {(settings?.units ?? ['g']).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Unit Cost (VND)</span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.unitCost}
                onChange={(event) => setForm({ ...form, unitCost: Number(event.target.value) })}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Current Quantity</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.currentQuantity}
                onChange={(event) =>
                  setForm({ ...form, currentQuantity: Number(event.target.value) })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Reorder Level</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.reorderLevel}
                onChange={(event) => setForm({ ...form, reorderLevel: Number(event.target.value) })}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Expiry Date</span>
              <input
                type="date"
                value={form.expiryDate ?? ''}
                onChange={(event) =>
                  setForm({ ...form, expiryDate: event.target.value || null })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Notes</span>
            <textarea
              value={form.notes ?? ''}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows={3}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {ingredient && onStockIn && (
                <button
                  type="button"
                  onClick={onStockIn}
                  className="rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
                >
                  Stock In
                </button>
              )}
              {ingredient && onStockOut && (
                <button
                  type="button"
                  onClick={onStockOut}
                  className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
                >
                  Stock Out
                </button>
              )}
              {ingredient && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="flex gap-2">
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
                {saving ? 'Saving...' : ingredient ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
