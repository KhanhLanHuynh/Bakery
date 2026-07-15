import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadBackup, fetchSettings, updateSettings } from '../api/client'
import { AppHeader } from '../components/AppHeader'
import type { Settings } from '../types'

function listToText(values: string[]): string {
  return values.join('\n')
}

function textToList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function SettingsPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<Settings | null>(null)
  const [ingredientCategoriesText, setIngredientCategoriesText] = useState('')
  const [recipeCategoriesText, setRecipeCategoriesText] = useState('')
  const [unitsText, setUnitsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    void loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    setError(null)

    try {
      const settings = await fetchSettings()
      setForm(settings)
      setIngredientCategoriesText(listToText(settings.ingredientCategories))
      setRecipeCategoriesText(listToText(settings.recipeCategories))
      setUnitsText(listToText(settings.units))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateSettings({
        ...form,
        ingredientCategories: textToList(ingredientCategoriesText),
        recipeCategories: textToList(recipeCategoriesText),
        units: textToList(unitsText),
      })
      setForm(updated)
      setIngredientCategoriesText(listToText(updated.ingredientCategories))
      setRecipeCategoriesText(listToText(updated.recipeCategories))
      setUnitsText(listToText(updated.units))
      setSuccess('Settings saved.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadBackup() {
    setDownloading(true)
    setError(null)

    try {
      await downloadBackup()
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Failed to download backup')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl">
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
            <h2 className="font-serif text-2xl text-bakery-brown">Settings</h2>
            <p className="mt-1 text-sm text-bakery-muted">
              Currency display, categories, units, and expiry warnings.
            </p>
          </div>

          {loading || !form ? (
            <div className="py-12 text-center text-sm text-bakery-muted">Loading settings...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-bakery-brown-dark">Currency</span>
                  <input
                    required
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                    className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-bakery-brown-dark">
                    Currency Symbol
                  </span>
                  <input
                    required
                    value={form.currencySymbol}
                    onChange={(event) =>
                      setForm({ ...form, currencySymbol: event.target.value })
                    }
                    className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-bakery-brown-dark">
                    Expiry Warning (days)
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.expiryWarningDays}
                    onChange={(event) =>
                      setForm({ ...form, expiryWarningDays: Number(event.target.value) })
                    }
                    className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2"
                  />
                </label>
                <label className="flex items-end gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.lowStockHighlight}
                    onChange={(event) =>
                      setForm({ ...form, lowStockHighlight: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-bakery-border"
                  />
                  <span className="pb-2 font-medium text-bakery-brown-dark">
                    Highlight low stock in inventory
                  </span>
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-bakery-brown-dark">
                  Ingredient Categories
                </span>
                <span className="mb-2 block text-xs text-bakery-muted">One per line</span>
                <textarea
                  required
                  rows={6}
                  value={ingredientCategoriesText}
                  onChange={(event) => setIngredientCategoriesText(event.target.value)}
                  className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-bakery-brown-dark">
                  Recipe Categories
                </span>
                <span className="mb-2 block text-xs text-bakery-muted">One per line</span>
                <textarea
                  required
                  rows={4}
                  value={recipeCategoriesText}
                  onChange={(event) => setRecipeCategoriesText(event.target.value)}
                  className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2 font-mono text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-bakery-brown-dark">Units</span>
                <span className="mb-2 block text-xs text-bakery-muted">One per line</span>
                <textarea
                  required
                  rows={4}
                  value={unitsText}
                  onChange={(event) => setUnitsText(event.target.value)}
                  className="w-full rounded-lg border border-bakery-border bg-white px-3 py-2 font-mono text-sm"
                />
              </label>

              <div className="rounded-xl border border-bakery-border bg-white/60 p-4">
                <h3 className="text-sm font-medium text-bakery-brown-dark">Backup</h3>
                <p className="mt-1 text-sm text-bakery-muted">
                  Download a zip of your data files (ingredients, recipes, movements, bakes,
                  settings).
                </p>
                <button
                  type="button"
                  onClick={() => void handleDownloadBackup()}
                  disabled={downloading}
                  className="mt-3 rounded-lg border border-bakery-border bg-white px-4 py-2 text-sm text-bakery-brown-dark hover:bg-bakery-card/60 disabled:opacity-50"
                >
                  {downloading ? 'Preparing backup...' : 'Download Backup'}
                </button>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              {success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-bakery-brown px-4 py-2 text-sm font-medium text-white hover:bg-bakery-brown-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
