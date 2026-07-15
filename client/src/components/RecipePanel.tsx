import { useEffect, useMemo, useRef, useState } from 'react'
import type { Recipe, RecipeDetail } from '../types'
import {
  formatCurrency,
  formatDifficulty,
  formatQuantity,
  formatTotalTime,
} from '../utils/format'

interface RecipePanelProps {
  recipes: Recipe[]
  selectedRecipe: RecipeDetail | null
  loading: boolean
  currencySymbol: string
  batchCount: number
  onBatchCountChange: (count: number) => void
  onSelectRecipe: (id: string) => void
  onEditRecipe: () => void
  onMakeCake: () => void
}

export function RecipePanel({
  recipes,
  selectedRecipe,
  loading,
  currencySymbol,
  batchCount,
  onBatchCountChange,
  onSelectRecipe,
  onEditRecipe,
  onMakeCake,
}: RecipePanelProps) {
  const [search, setSearch] = useState('')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [costOpen, setCostOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return recipes
    }
    return recipes.filter((recipe) => recipe.name.toLowerCase().includes(query))
  }, [recipes, search])

  useEffect(() => {
    function closeSelector(event: MouseEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setSelectorOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', closeSelector)
    return () => document.removeEventListener('mousedown', closeSelector)
  }, [])

  function openSelector() {
    setSelectorOpen(true)
    setSearch('')
    const selectedIndex = recipes.findIndex((recipe) => recipe.id === selectedRecipe?.id)
    setActiveIndex(Math.max(selectedIndex, 0))
  }

  function selectRecipe(recipe: Recipe) {
    onSelectRecipe(recipe.id)
    setSelectorOpen(false)
    setSearch('')
  }

  function handleSelectorKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!selectorOpen && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      event.preventDefault()
      openSelector()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filteredRecipes.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && filteredRecipes[activeIndex]) {
      event.preventDefault()
      selectRecipe(filteredRecipes[activeIndex])
    } else if (event.key === 'Escape') {
      setSelectorOpen(false)
      setSearch('')
    }
  }

  return (
    <section className="flex h-full flex-col rounded-2xl bg-bakery-card p-6 shadow-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-bakery-brown">Bakery Recipes</h2>
          <p className="mt-1 text-sm text-bakery-muted">
            Select a recipe to view details and production steps.
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          👨‍🍳
        </span>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-bakery-border bg-white/50 px-6 py-12 text-center">
          <p className="font-serif text-xl text-bakery-brown">No recipes yet</p>
          <p className="mt-2 max-w-sm text-sm text-bakery-muted">
            Click &quot;+ Recipe&quot; in the header to add your first recipe.
          </p>
        </div>
      ) : (
        <>
          <div ref={selectorRef} className="relative mb-4">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bakery-muted">
              🔍
            </span>
            <input
              type="text"
              role="combobox"
              aria-label="Select recipe"
              aria-expanded={selectorOpen}
              aria-controls="recipe-options"
              aria-autocomplete="list"
              value={selectorOpen ? search : (selectedRecipe?.name ?? '')}
              placeholder="Search recipes..."
              onFocus={openSelector}
              onClick={openSelector}
              onChange={(event) => {
                setSelectorOpen(true)
                setSearch(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleSelectorKeyDown}
              className="h-11 w-full rounded-xl border border-bakery-border bg-white py-2 pl-10 pr-9 text-sm"
            />
            <button
              type="button"
              onClick={() => (selectorOpen ? setSelectorOpen(false) : openSelector())}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-bakery-muted"
              aria-label={selectorOpen ? 'Close recipe list' : 'Open recipe list'}
              tabIndex={-1}
            >
              {selectorOpen ? '▴' : '▾'}
            </button>

            {selectorOpen && (
              <ul
                id="recipe-options"
                role="listbox"
                className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-bakery-border bg-white p-1 shadow-lg"
              >
                {filteredRecipes.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-bakery-muted">No recipes found</li>
                ) : (
                  filteredRecipes.map((recipe, index) => (
                    <li
                      key={recipe.id}
                      role="option"
                      aria-selected={recipe.id === selectedRecipe?.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        selectRecipe(recipe)
                      }}
                      className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${
                        index === activeIndex
                          ? 'bg-bakery-card text-bakery-brown-dark'
                          : 'text-bakery-muted hover:bg-bakery-card/60'
                      }`}
                    >
                      {recipe.name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {loading || !selectedRecipe ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-bakery-border bg-white/50 py-12 text-sm text-bakery-muted">
              Loading recipe...
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="rounded-xl border border-bakery-border bg-white/60 p-4">
                <div className="flex gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-bakery-card text-3xl">
                    {selectedRecipe.imageUrl ? (
                      <img
                        src={selectedRecipe.imageUrl}
                        alt={selectedRecipe.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      '🍞'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl text-bakery-brown-dark">
                        {selectedRecipe.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          selectedRecipe.makeable
                            ? 'bg-bakery-brown text-white'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedRecipe.makeable ? 'Makeable' : 'Not makeable'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-bakery-muted">
                      <span>
                        ⏱{' '}
                        {formatTotalTime(
                          selectedRecipe.prepTimeMinutes,
                          selectedRecipe.bakeTimeMinutes,
                        )}
                      </span>
                      <span>
                        🍰 Makes {selectedRecipe.pieces ?? 1} piece
                        {(selectedRecipe.pieces ?? 1) === 1 ? '' : 's'}
                      </span>
                      <span className="rounded-full bg-bakery-card px-2 py-0.5 text-xs font-medium text-bakery-brown">
                        {formatDifficulty(selectedRecipe.difficulty)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedRecipe.description && (
                  <p className="mt-4 text-sm italic text-bakery-muted">
                    {selectedRecipe.description}
                  </p>
                )}

                {!selectedRecipe.makeable && selectedRecipe.feasibilityIssues.length > 0 && (
                  <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {selectedRecipe.feasibilityIssues.map((issue) => (
                      <div key={`${issue.ingredientId}-${issue.type}`}>
                        {issue.type === 'expired'
                          ? `${issue.ingredientName} is expired`
                          : `${issue.ingredientName}: need ${issue.required}${issue.unit}, have ${issue.available}${issue.unit}`}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-bakery-brown">
                    Preparation Steps
                  </h4>
                  <ol className="mt-3 space-y-3">
                    {selectedRecipe.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm text-bakery-brown-dark">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bakery-card text-xs font-semibold text-bakery-brown">
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-bakery-border bg-white/60">
                <button
                  type="button"
                  onClick={() => setCostOpen((open) => !open)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-bakery-brown-dark"
                >
                  <span>
                    Cost: {formatCurrency(selectedRecipe.totalCost, currencySymbol)} total ·{' '}
                    {formatCurrency(selectedRecipe.costPerPiece, currencySymbol)} per piece ·{' '}
                    {formatCurrency(selectedRecipe.costPerYield, currencySymbol)} per{' '}
                    {selectedRecipe.yield.unit}
                  </span>
                  <span>{costOpen ? '▴' : '▾'}</span>
                </button>

                {costOpen && (
                  <div className="border-t border-bakery-border px-4 py-3">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-bakery-muted">
                        <tr>
                          <th className="pb-2 font-medium">Ingredient</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecipe.costBreakdown.map((line) => (
                          <tr key={line.ingredientId} className="border-t border-bakery-border/60">
                            <td className="py-2">
                              <div>{line.ingredientName}</div>
                              {line.warning && (
                                <div className="text-xs text-amber-700">{line.warning}</div>
                              )}
                            </td>
                            <td className="py-2 text-bakery-muted">
                              {formatQuantity(line.quantity, line.unit)}
                            </td>
                            <td className="py-2 text-bakery-brown-dark">
                              {line.lineCost === null
                                ? '—'
                                : formatCurrency(line.lineCost, currencySymbol)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-bakery-brown-dark">Batches</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={batchCount}
                    onChange={(event) =>
                      onBatchCountChange(Math.max(1, Number(event.target.value)))
                    }
                    className="w-24 rounded-xl border border-bakery-border bg-white px-3 py-2"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onEditRecipe}
                    className="rounded-xl border border-bakery-border bg-white px-4 py-2 text-sm text-bakery-brown-dark hover:bg-bakery-card/60"
                  >
                    Edit Recipe
                  </button>
                  <button
                    type="button"
                    onClick={onMakeCake}
                    className="rounded-xl bg-bakery-brown px-4 py-2 text-sm font-medium text-white hover:bg-bakery-brown-dark"
                  >
                    Make Cake
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
