import { useMemo, useState } from 'react'
import type { Ingredient } from '../types'
import { formatCategory } from '../utils/format'
import { IngredientTable } from './IngredientTable'

interface InventoryPanelProps {
  ingredients: Ingredient[]
  categories?: string[]
  onAdd: () => void
  onEdit: (ingredient: Ingredient) => void
  onStockIn: (ingredient: Ingredient) => void
  onStockOut: (ingredient: Ingredient) => void
}

type SortKey = 'name' | 'quantity' | 'expiryDate'
type SortDirection = 'asc' | 'desc'

export function InventoryPanel({
  ingredients,
  categories = [],
  onAdd,
  onEdit,
  onStockIn,
  onStockOut,
}: InventoryPanelProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('expiryDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const categoryOptions = useMemo(() => {
    const fromIngredients = ingredients.map((item) => item.category)
    const merged = [...new Set([...categories, ...fromIngredients])].sort()
    return merged
  }, [categories, ingredients])

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase()
    let filtered = [...ingredients]

    if (category) {
      filtered = filtered.filter((ingredient) => ingredient.category === category)
    }

    if (query) {
      filtered = filtered.filter((ingredient) => ingredient.name.toLowerCase().includes(query))
    }

    filtered.sort((a, b) => {
      let comparison = 0

      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortKey === 'quantity') {
        comparison = a.currentQuantity - b.currentQuantity
      } else {
        const aDate = a.expiryDate ?? ''
        const bDate = b.expiryDate ?? ''
        comparison = aDate.localeCompare(bDate)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [ingredients, search, category, sortKey, sortDirection])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('asc')
  }

  return (
    <section className="flex h-full flex-col rounded-2xl bg-bakery-card p-6 shadow-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-bakery-brown">Ingredient Inventory</h2>
          <p className="mt-1 text-sm text-bakery-muted">
            Monitor stock levels and manage ingredient freshness.
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">
          📦
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bakery-muted">
            🔍
          </span>
          <input
            type="search"
            placeholder="Search items..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-bakery-border bg-white py-2.5 pl-10 pr-4 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 appearance-none rounded-xl border border-bakery-border bg-white py-2 pl-3 pr-9 text-sm"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {formatCategory(item)}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-bakery-muted"
              aria-hidden="true"
            >
              ▾
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleSort(sortKey)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-bakery-border bg-white text-sm text-bakery-muted hover:bg-bakery-card/60"
            title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'} (click to reverse)`}
            aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
          <div className="relative">
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="h-10 appearance-none rounded-xl border border-bakery-border bg-white py-2 pl-3 pr-9 text-sm"
              aria-label="Sort by"
            >
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
              <option value="expiryDate">Expiry Date</option>
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-bakery-muted"
              aria-hidden="true"
            >
              ▾
            </span>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-10 items-center rounded-xl bg-bakery-brown px-4 text-sm font-medium text-white hover:bg-bakery-brown-dark"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <IngredientTable
          ingredients={filteredIngredients}
          onEdit={onEdit}
          onStockIn={onStockIn}
          onStockOut={onStockOut}
        />
      </div>
    </section>
  )
}
