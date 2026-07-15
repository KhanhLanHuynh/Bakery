export type ExpiryStatus = 'none' | 'ok' | 'expiring_soon' | 'expired'

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  unitCost: number
  currentQuantity: number
  reorderLevel: number
  expiryDate: string | null
  notes: string
  createdAt: string
  updatedAt: string
  expiryStatus: ExpiryStatus
  isLowStock: boolean
}

export interface IngredientInput {
  name: string
  category: string
  unit: string
  unitCost: number
  currentQuantity: number
  reorderLevel: number
  expiryDate?: string | null
  notes?: string
}

export interface Settings {
  currency: string
  currencySymbol: string
  lowStockHighlight: boolean
  expiryWarningDays: number
  ingredientCategories: string[]
  recipeCategories: string[]
  units: string[]
}

export type MovementType = 'in' | 'out' | 'adjustment'
export type MovementReason = 'purchase' | 'bake' | 'waste' | 'correction' | 'other'

export interface Movement {
  id: string
  ingredientId: string
  type: MovementType
  quantity: number
  date: string
  reason: MovementReason
  expiryDate: string | null
  referenceId: string | null
  note: string
  createdAt: string
  ingredientName: string
  ingredientUnit: string
}

export interface MovementInput {
  ingredientId: string
  type: MovementType
  quantity: number
  date: string
  reason: MovementReason
  expiryDate?: string | null
  note?: string
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface RecipeYield {
  amount: number
  unit: string
  description: string
}

export interface RecipeIngredientLine {
  ingredientId: string
  quantity: number
  unit: string
  note: string
}

export interface Recipe {
  id: string
  name: string
  description: string
  category: string
  yield: RecipeYield
  pieces: number
  prepTimeMinutes: number
  bakeTimeMinutes: number
  imageUrl: string
  difficulty: Difficulty
  ingredients: RecipeIngredientLine[]
  steps: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CostBreakdownLine {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
  lineCost: number | null
  warning: string | null
}

export interface FeasibilityIssue {
  ingredientId: string
  ingredientName: string
  required: number
  available: number
  unit: string
  type: 'shortfall' | 'expired'
}

export interface FeasibilityWarning {
  ingredientId: string
  ingredientName: string
  type: 'expiring_soon'
}

export interface FeasibilityResult {
  makeable: boolean
  issues: FeasibilityIssue[]
  warnings: FeasibilityWarning[]
}

export interface RecipeDetail extends Recipe {
  totalCost: number
  costPerYield: number
  costPerPiece: number
  costBreakdown: CostBreakdownLine[]
  makeable: boolean
  feasibilityIssues: FeasibilityIssue[]
  feasibilityWarnings: FeasibilityWarning[]
}

export interface RecipeInput {
  name: string
  description?: string
  category: string
  yield: RecipeYield
  pieces: number
  prepTimeMinutes: number
  bakeTimeMinutes: number
  imageUrl?: string
  difficulty?: Difficulty
  ingredients: RecipeIngredientLine[]
  steps: string[]
  tags?: string[]
}

export interface Bake {
  id: string
  recipeId: string
  recipeName: string
  batchCount: number
  date: string
  note: string
  createdAt: string
}

export interface MakeRecipeInput {
  batchCount: number
  date?: string
  note?: string
}

export interface MakeRecipeResult {
  bake: Bake
  movements: Movement[]
}
