import { useEffect, useState, type FormEvent } from 'react'
import type {
  Difficulty,
  Ingredient,
  Recipe,
  RecipeDetail,
  RecipeIngredientLine,
  RecipeInput,
  Settings,
} from '../types'

interface RecipeModalProps {
  open: boolean
  recipe: Recipe | RecipeDetail | null
  ingredients: Ingredient[]
  settings: Settings | null
  onClose: () => void
  onSave: (data: RecipeInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onDuplicate?: (id: string) => Promise<void>
}

const emptyIngredientLine = (unit = 'g'): RecipeIngredientLine => ({
  ingredientId: '',
  quantity: 1,
  unit,
  note: '',
})

const emptyForm = (settings: Settings | null): RecipeInput => ({
  name: '',
  description: '',
  category: settings?.recipeCategories[0] ?? 'cake',
  yield: { amount: 1, unit: 'cake', description: '' },
  pieces: 1,
  prepTimeMinutes: 0,
  bakeTimeMinutes: 0,
  imageUrl: '',
  difficulty: 'intermediate',
  ingredients: [emptyIngredientLine(settings?.units[0])],
  steps: [''],
  tags: [],
})

export function RecipeModal({
  open,
  recipe,
  ingredients,
  settings,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}: RecipeModalProps) {
  const [form, setForm] = useState<RecipeInput>(emptyForm(settings))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    if (recipe) {
      setForm({
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        yield: recipe.yield,
        pieces: recipe.pieces ?? 1,
        prepTimeMinutes: recipe.prepTimeMinutes,
        bakeTimeMinutes: recipe.bakeTimeMinutes,
        imageUrl: recipe.imageUrl,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        tags: recipe.tags,
      })
    } else {
      setForm(emptyForm(settings))
    }
    setError(null)
  }, [open, recipe, settings])

  if (!open) {
    return null
  }

  function updateIngredientLine(index: number, patch: Partial<RecipeIngredientLine>) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((line, i) =>
        i === index ? { ...line, ...patch } : line,
      ),
    }))
  }

  function updateStep(index: number, value: string) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, i) => (i === index ? value : step)),
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const cleaned: RecipeInput = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() ?? '',
        imageUrl: form.imageUrl?.trim() ?? '',
        ingredients: form.ingredients.filter((line) => line.ingredientId),
        steps: form.steps.map((step) => step.trim()).filter(Boolean),
        tags: form.tags ?? [],
      }

      if (cleaned.ingredients.length === 0) {
        throw new Error('Add at least one ingredient')
      }
      if (cleaned.steps.length === 0) {
        throw new Error('Add at least one preparation step')
      }

      await onSave(cleaned)
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!recipe || !onDelete) {
      return
    }
    if (!window.confirm(`Delete "${recipe.name}"?`)) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onDelete(recipe.id)
      onClose()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete recipe')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    if (!recipe || !onDuplicate) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onDuplicate(recipe.id)
      onClose()
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'Failed to duplicate recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-bakery-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-modal-title"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="recipe-modal-title" className="font-serif text-2xl text-bakery-brown">
              {recipe ? 'Edit Recipe' : 'Add Recipe'}
            </h2>
            <p className="mt-1 text-sm text-bakery-muted">
              {recipe ? 'Update recipe details and ingredients.' : 'Create a new bakery recipe.'}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-bakery-brown-dark">Description</span>
            <textarea
              value={form.description ?? ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={2}
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
                {(settings?.recipeCategories ?? ['cake']).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value as Difficulty })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Yield Amount</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={form.yield.amount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    yield: { ...form.yield, amount: Number(event.target.value) },
                  })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Yield Unit</span>
              <input
                required
                value={form.yield.unit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    yield: { ...form.yield, unit: event.target.value },
                  })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Yield Note</span>
              <input
                value={form.yield.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    yield: { ...form.yield, description: event.target.value },
                  })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Pieces</span>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.pieces}
                onChange={(event) =>
                  setForm({
                    ...form,
                    pieces: Math.max(1, Number(event.target.value)),
                  })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Prep (min)</span>
              <input
                type="number"
                min="0"
                required
                value={form.prepTimeMinutes}
                onChange={(event) =>
                  setForm({ ...form, prepTimeMinutes: Number(event.target.value) })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Bake (min)</span>
              <input
                type="number"
                min="0"
                required
                value={form.bakeTimeMinutes}
                onChange={(event) =>
                  setForm({ ...form, bakeTimeMinutes: Number(event.target.value) })
                }
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-bakery-brown-dark">Image URL</span>
              <input
                value={form.imageUrl ?? ''}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
                placeholder="https://..."
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-bakery-brown-dark">Ingredients</span>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    ingredients: [
                      ...form.ingredients,
                      emptyIngredientLine(settings?.units[0]),
                    ],
                  })
                }
                className="text-sm text-bakery-brown hover:text-bakery-brown-dark"
              >
                + Add ingredient
              </button>
            </div>
            <div className="space-y-2">
              {form.ingredients.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <select
                    required
                    value={line.ingredientId}
                    onChange={(event) =>
                      updateIngredientLine(index, { ingredientId: event.target.value })
                    }
                    className="col-span-5 rounded-lg border border-bakery-border bg-white px-2 py-2 text-sm"
                  >
                    <option value="">Select ingredient</option>
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={line.quantity}
                    onChange={(event) =>
                      updateIngredientLine(index, { quantity: Number(event.target.value) })
                    }
                    className="col-span-2 rounded-lg border border-bakery-border bg-white px-2 py-2 text-sm"
                  />
                  <select
                    value={line.unit}
                    onChange={(event) => updateIngredientLine(index, { unit: event.target.value })}
                    className="col-span-2 rounded-lg border border-bakery-border bg-white px-2 py-2 text-sm"
                  >
                    {(settings?.units ?? ['g']).map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.note}
                    onChange={(event) => updateIngredientLine(index, { note: event.target.value })}
                    placeholder="Note"
                    className="col-span-2 rounded-lg border border-bakery-border bg-white px-2 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        ingredients: form.ingredients.filter((_, i) => i !== index),
                      })
                    }
                    className="col-span-1 rounded-lg text-bakery-muted hover:bg-white/60"
                    aria-label="Remove ingredient"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-bakery-brown-dark">Preparation Steps</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, steps: [...form.steps, ''] })}
                className="text-sm text-bakery-brown hover:text-bakery-brown-dark"
              >
                + Add step
              </button>
            </div>
            <div className="space-y-2">
              {form.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="pt-2 text-sm text-bakery-muted">{index + 1}.</span>
                  <textarea
                    required
                    value={step}
                    onChange={(event) => updateStep(index, event.target.value)}
                    rows={2}
                    className="flex-1 rounded-lg border border-bakery-border bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        steps: form.steps.filter((_, i) => i !== index),
                      })
                    }
                    className="rounded-lg px-2 text-bakery-muted hover:bg-white/60"
                    aria-label="Remove step"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {recipe && onDuplicate && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={saving}
                  className="rounded-lg border border-bakery-border px-4 py-2 text-sm text-bakery-brown-dark hover:bg-white/60 disabled:opacity-50"
                >
                  Duplicate
                </button>
              )}
              {recipe && onDelete && (
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
                {saving ? 'Saving...' : recipe ? 'Save Changes' : 'Add Recipe'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
