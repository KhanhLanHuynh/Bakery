import { Link, useLocation } from 'react-router-dom'

interface AppHeaderProps {
  onAddIngredient: () => void
  onAddRecipe?: () => void
}

export function AppHeader({ onAddIngredient, onAddRecipe }: AppHeaderProps) {
  const location = useLocation()

  const navClass = (path: string) =>
    location.pathname === path
      ? 'rounded-lg bg-bakery-brown px-4 py-2 text-sm font-medium text-white'
      : 'rounded-lg border border-bakery-border/30 px-4 py-2 text-sm text-bakery-card hover:bg-white/10'

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-medium text-bakery-card">Bakery Manager</h1>
        <p className="mt-1 text-sm text-bakery-tan">Inventory and recipe management</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAddIngredient}
          className="rounded-lg bg-bakery-brown px-4 py-2 text-sm font-medium text-white transition hover:bg-bakery-brown-dark"
        >
          + Ingredient
        </button>
        {onAddRecipe ? (
          <button
            type="button"
            onClick={onAddRecipe}
            className="rounded-lg border border-bakery-border/30 px-4 py-2 text-sm text-bakery-card hover:bg-white/10"
          >
            + Recipe
          </button>
        ) : (
          <Link to="/" className="rounded-lg border border-bakery-border/30 px-4 py-2 text-sm text-bakery-card hover:bg-white/10">
            + Recipe
          </Link>
        )}
        <Link to="/movements" className={navClass('/movements')}>
          Movements
        </Link>
        <Link to="/settings" className={navClass('/settings')}>
          Settings
        </Link>
      </div>
    </header>
  )
}
