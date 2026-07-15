import type {
  Bake,
  FeasibilityResult,
  Ingredient,
  IngredientInput,
  MakeRecipeInput,
  MakeRecipeResult,
  Movement,
  MovementInput,
  RecipeDetail,
  RecipeInput,
  RecipeSummary,
  Settings,
} from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
  } catch {
    throw new Error('Cannot reach the API server. Is it running on port 3001?')
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('API server is unavailable. Restart with npm run dev.')
    }
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function fetchIngredients(): Promise<Ingredient[]> {
  return request<Ingredient[]>('/api/ingredients')
}

export function createIngredient(data: IngredientInput): Promise<Ingredient> {
  return request<Ingredient>('/api/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateIngredient(id: string, data: Partial<IngredientInput>): Promise<Ingredient> {
  return request<Ingredient>(`/api/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteIngredient(id: string): Promise<void> {
  return request<void>(`/api/ingredients/${id}`, {
    method: 'DELETE',
  })
}

export function fetchSettings(): Promise<Settings> {
  return request<Settings>('/api/settings')
}

export function updateSettings(data: Settings): Promise<Settings> {
  return request<Settings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function downloadBackup(): Promise<void> {
  const response = await fetch('/api/backup')
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${response.status}`)
  }

  const blob = await response.blob()
  const date = new Date().toISOString().slice(0, 10)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bakery-backup-${date}.zip`
  link.click()
  URL.revokeObjectURL(url)
}

export function fetchMovements(params?: {
  ingredientId?: string
  type?: Movement['type']
  from?: string
  to?: string
}): Promise<Movement[]> {
  const searchParams = new URLSearchParams()
  if (params?.ingredientId) searchParams.set('ingredientId', params.ingredientId)
  if (params?.type) searchParams.set('type', params.type)
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)

  const query = searchParams.toString()
  return request<Movement[]>(`/api/movements${query ? `?${query}` : ''}`)
}

export function createMovement(data: MovementInput): Promise<Movement> {
  return request<Movement>('/api/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function fetchRecipes(): Promise<RecipeSummary[]> {
  return request<RecipeSummary[]>('/api/recipes')
}

export function fetchRecipe(id: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/api/recipes/${id}`)
}

export function createRecipe(data: RecipeInput): Promise<RecipeDetail> {
  return request<RecipeDetail>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRecipe(id: string, data: Partial<RecipeInput>): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteRecipe(id: string): Promise<void> {
  return request<void>(`/api/recipes/${id}`, {
    method: 'DELETE',
  })
}

export function duplicateRecipe(id: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/api/recipes/${id}/duplicate`, {
    method: 'POST',
  })
}

export function fetchRecipeFeasibility(
  id: string,
  batchCount: number,
): Promise<FeasibilityResult> {
  return request<FeasibilityResult>(
    `/api/recipes/${id}/feasibility?batches=${batchCount}`,
  )
}

export function makeRecipe(id: string, data: MakeRecipeInput): Promise<MakeRecipeResult> {
  return request<MakeRecipeResult>(`/api/recipes/${id}/make`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function fetchBakes(): Promise<Bake[]> {
  return request<Bake[]>('/api/bakes')
}
