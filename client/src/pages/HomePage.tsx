import { useCallback, useEffect, useState } from 'react'
import {
  createIngredient,
  createMovement,
  createRecipe,
  deleteIngredient,
  deleteRecipe,
  duplicateRecipe,
  fetchIngredients,
  fetchRecipe,
  fetchRecipes,
  fetchSettings,
  makeRecipe,
  updateIngredient,
  updateRecipe,
} from '../api/client'
import { AppHeader } from '../components/AppHeader'
import { IngredientModal } from '../components/IngredientModal'
import { InventoryPanel } from '../components/InventoryPanel'
import { MakeCakeModal } from '../components/MakeCakeModal'
import { RecipeModal } from '../components/RecipeModal'
import { RecipePanel } from '../components/RecipePanel'
import { StockMovementModal } from '../components/StockMovementModal'
import type {
  Ingredient,
  IngredientInput,
  MovementInput,
  Recipe,
  RecipeDetail,
  RecipeInput,
  Settings,
} from '../types'

export function HomePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | RecipeDetail | null>(null)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [movementIngredient, setMovementIngredient] = useState<Ingredient | null>(null)
  const [movementMode, setMovementMode] = useState<'in' | 'out'>('in')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [batchCount, setBatchCount] = useState(1)
  const [makeCakeModalOpen, setMakeCakeModalOpen] = useState(false)

  const loadRecipeDetail = useCallback(async (id: string) => {
    setRecipeLoading(true)
    try {
      const detail = await fetchRecipe(id)
      setSelectedRecipe(detail)
      setSelectedRecipeId(id)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load recipe')
    } finally {
      setRecipeLoading(false)
    }
  }, [])

  const loadData = useCallback(
    async (preferredRecipeId?: string | null) => {
      setLoading(true)
      setError(null)

      try {
        const [ingredientData, recipeData, settingsData] = await Promise.all([
          fetchIngredients(),
          fetchRecipes(),
          fetchSettings(),
        ])
        setIngredients(ingredientData)
        setRecipes(recipeData)
        setSettings(settingsData)

        if (recipeData.length > 0) {
          const nextId =
            preferredRecipeId && recipeData.some((recipe) => recipe.id === preferredRecipeId)
              ? preferredRecipeId
              : recipeData[0].id
          await loadRecipeDetail(nextId)
        } else {
          setSelectedRecipe(null)
          setSelectedRecipeId(null)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    },
    [loadRecipeDetail],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function refreshAfterStockChange() {
    const ingredientData = await fetchIngredients()
    setIngredients(ingredientData)
    if (selectedRecipeId) {
      await loadRecipeDetail(selectedRecipeId)
    }
  }

  function openCreateModal() {
    setEditingIngredient(null)
    setModalOpen(true)
  }

  function openEditModal(ingredient: Ingredient) {
    setEditingIngredient(ingredient)
    setModalOpen(true)
  }

  function openCreateRecipeModal() {
    setEditingRecipe(null)
    setRecipeModalOpen(true)
  }

  function openEditRecipeModal() {
    if (selectedRecipe) {
      setEditingRecipe(selectedRecipe)
      setRecipeModalOpen(true)
    }
  }

  function openStockModal(ingredient: Ingredient, mode: 'in' | 'out') {
    setMovementIngredient(ingredient)
    setMovementMode(mode)
    setMovementModalOpen(true)
  }

  async function handleSaveIngredient(data: IngredientInput) {
    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, data)
    } else {
      await createIngredient(data)
    }
    await loadData(selectedRecipeId)
  }

  async function handleDeleteIngredient(id: string) {
    await deleteIngredient(id)
    await loadData(selectedRecipeId)
  }

  async function handleSaveRecipe(data: RecipeInput) {
    if (editingRecipe) {
      const updated = await updateRecipe(editingRecipe.id, data)
      await loadData(updated.id)
      return
    }

    const created = await createRecipe(data)
    await loadData(created.id)
  }

  async function handleDeleteRecipe(id: string) {
    await deleteRecipe(id)
    await loadData(null)
  }

  async function handleDuplicateRecipe(id: string) {
    const duplicate = await duplicateRecipe(id)
    await loadData(duplicate.id)
  }

  async function handleMovementSave(data: MovementInput) {
    await createMovement(data)
    await refreshAfterStockChange()
  }

  async function handleSelectRecipe(id: string) {
    setBatchCount(1)
    await loadRecipeDetail(id)
  }

  async function handleMakeCake(data: {
    batchCount: number
    date: string
    note: string
  }) {
    if (!selectedRecipeId) {
      return
    }

    await makeRecipe(selectedRecipeId, data)
    await refreshAfterStockChange()
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader
          onAddIngredient={openCreateModal}
          onAddRecipe={openCreateRecipeModal}
        />

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-bakery-card px-6 py-16 text-center text-bakery-muted">
            Loading...
          </div>
        ) : (
          <div className="grid min-h-[70vh] gap-6 lg:grid-cols-2">
            <RecipePanel
              recipes={recipes}
              selectedRecipe={selectedRecipe}
              loading={recipeLoading}
              currencySymbol={settings?.currencySymbol ?? '₫'}
              batchCount={batchCount}
              onBatchCountChange={setBatchCount}
              onSelectRecipe={handleSelectRecipe}
              onEditRecipe={openEditRecipeModal}
              onMakeCake={() => setMakeCakeModalOpen(true)}
            />
            <InventoryPanel
              ingredients={ingredients}
              categories={settings?.ingredientCategories}
              onAdd={openCreateModal}
              onEdit={openEditModal}
              onStockIn={(ingredient) => openStockModal(ingredient, 'in')}
              onStockOut={(ingredient) => openStockModal(ingredient, 'out')}
            />
          </div>
        )}

        <IngredientModal
          open={modalOpen}
          ingredient={editingIngredient}
          settings={settings}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveIngredient}
          onDelete={editingIngredient ? handleDeleteIngredient : undefined}
          onStockIn={
            editingIngredient
              ? () => {
                  setModalOpen(false)
                  openStockModal(editingIngredient, 'in')
                }
              : undefined
          }
          onStockOut={
            editingIngredient
              ? () => {
                  setModalOpen(false)
                  openStockModal(editingIngredient, 'out')
                }
              : undefined
          }
        />

        <RecipeModal
          open={recipeModalOpen}
          recipe={editingRecipe}
          ingredients={ingredients}
          settings={settings}
          onClose={() => setRecipeModalOpen(false)}
          onSave={handleSaveRecipe}
          onDelete={editingRecipe ? handleDeleteRecipe : undefined}
          onDuplicate={editingRecipe ? handleDuplicateRecipe : undefined}
        />

        <StockMovementModal
          open={movementModalOpen}
          ingredient={movementIngredient}
          mode={movementMode}
          onClose={() => setMovementModalOpen(false)}
          onSave={handleMovementSave}
        />

        <MakeCakeModal
          open={makeCakeModalOpen}
          recipe={selectedRecipe}
          batchCount={batchCount}
          onBatchCountChange={setBatchCount}
          onClose={() => setMakeCakeModalOpen(false)}
          onConfirm={handleMakeCake}
        />
      </div>
    </div>
  )
}
