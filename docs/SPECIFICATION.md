# Bakery Inventory & Cake Recipe Manager — Project Specification

**Version:** 1.3  
**Date:** July 15, 2026  
**Status:** Approved

---

## 1. Overview

A lightweight web application for managing bakery inventory and cake recipes. All data is persisted to local JSON files on disk — no database server is required. The app is intended for a single bakery or home baker who wants a simple, self-hosted tool to track ingredients, stock levels, and recipes with cost awareness.

### 1.1 Goals

- Track ingredient inventory (stock in, stock out, current levels, expiry dates).
- Define cake recipes with ingredient quantities and instructions.
- Calculate recipe cost from ingredient unit prices.
- Warn when stock is low, expired, or nearing expiry.
- Keep all data in human-readable files for easy backup and manual editing.

### 1.2 Non-Goals (v1)

- Multi-user authentication or role-based access control.
- Cloud sync or real-time collaboration.
- Point-of-sale or order management.
- Production calendar or scheduled baking.
- Nutritional analysis or allergen labeling compliance.
- Mobile-native apps (desktop/tablet split-view first; mobile single-column not required in v1).
- Recipe image file uploads (URL/path string only).

### 1.3 Confirmed Decisions

| Decision | Choice |
|----------|--------|
| Currency | VND (₫) |
| UI language | English |
| Stock deduction | User-initiated when making a cake from a selected recipe |
| Inventory & recipes | User can add and remove (create and delete) |
| Production calendar | Not required |
| Expiry date | Each inventory item has an optional expiry date |
| Primary UI | Split-view home: recipes (left) + inventory (right) |

---

## 2. Users & Use Cases

### 2.1 Primary User

A bakery owner or baker who manages ingredients and recipes on one machine or local network.

### 2.2 Core Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-01 | Manage ingredients | Add, edit, and remove ingredients with unit, cost, reorder threshold, and expiry date. |
| UC-02 | Record stock movements | Log purchases (stock in) and manual usage (stock out) with date, optional expiry date on stock-in, and optional note. |
| UC-03 | View inventory | See current stock, low-stock alerts, expiry status, and recent movement history. |
| UC-04 | Manage recipes | Add, edit, and remove cake recipes: name, yield, ingredients, steps, notes. |
| UC-05 | Calculate recipe cost | Auto-compute total and per-unit cost from ingredient prices and quantities. |
| UC-06 | Check bake feasibility | Given a recipe and batch count, show whether stock is sufficient and what is missing. |
| UC-07 | Make a cake | User selects a recipe, sets batch count, confirms — stock is deducted from inventory. |
| UC-08 | Export / backup data | Download or copy data files for backup; restore from backup. |

---

## 3. Functional Requirements

### 3.1 Ingredients

- **Fields:** id, name, category (e.g. produce, dairy, flour, pantry — stored lowercase, shown uppercase in UI), unit (g, kg, ml, L, piece, etc.), unit cost, current quantity, reorder level, **expiryDate** (optional, ISO date `YYYY-MM-DD`), notes, createdAt, updatedAt.
- **expiryDate meaning:** expiry date of the **current stock on hand**. When quantity is 0, `expiryDate` is `null`.
- **Operations:** Create, read, update, delete (add/remove).
- **Validation:** name required and unique; quantity ≥ 0; unit cost ≥ 0; if `expiryDate` is set, it must be a valid date.
- **Delete rule:** removing an ingredient is blocked if it is still referenced by any recipe; user must remove or update those recipes first.

**Expiry status (computed, not stored):**

| Status | Condition |
|--------|-----------|
| `none` | No expiry date set, or quantity is 0 |
| `ok` | Expiry date is more than `expiryWarningDays` away |
| `expiring_soon` | Expiry date is today or within `expiryWarningDays` |
| `expired` | Expiry date is before today |

### 3.2 Stock Movements

- **Fields:** id, ingredientId, type (`in` | `out` | `adjustment`), quantity (positive number), date, reason (purchase, bake, waste, correction, other), **expiryDate** (optional, for `in` movements only), referenceId (optional link to recipe/bake), note, createdAt.
- **Behavior:** applying a movement updates the ingredient's `current quantity`. For `in` movements, if `expiryDate` is provided, update the ingredient's `expiryDate`. When quantity reaches 0 after an `out` or `adjustment`, set ingredient `expiryDate` to `null`.
- **Operations:** create movement; list/filter by ingredient, date range, type.
- **Validation:** cannot reduce stock below zero unless an explicit `adjustment` with note is used; `expiryDate` only allowed on `in` movements.

### 3.3 Recipes

- **Fields:** id, name, description, category (cake, frosting, filling, etc.), yield (e.g. "1 cake (8 inch)", quantity + unit), prepTimeMinutes, bakeTimeMinutes, **imageUrl** (optional string — URL or local path to thumbnail), **difficulty** (`beginner` | `intermediate` | `advanced`), ingredients (array of `{ ingredientId, quantity, unit, note }`), steps (ordered list of strings), tags, createdAt, updatedAt.
- **Display helpers:** total time shown as formatted sum of prep + bake (e.g. `55m` or `24h`); difficulty shown as a badge; image shown as recipe thumbnail (placeholder if `imageUrl` is empty).
- **Operations:** Create, read, update, delete (add/remove); duplicate recipe.
- **Validation:** at least one ingredient; all ingredient references must exist; quantities > 0; difficulty must be one of the allowed values when provided (default: `intermediate`).
- **Delete rule:** removing a recipe deletes the record from `recipes.json`; past bake history (if any) retains the recipe name as a snapshot.
- **Image uploads:** out of scope for v1 — store URL/path string only.

### 3.4 Recipe Costing

- Convert ingredient quantities to the ingredient's base unit when possible (e.g. 500 g + unit cost per kg).
- Display:
  - total recipe cost;
  - cost per yield unit (e.g. per cake);
  - cost breakdown per ingredient.
- Flag missing or zero-cost ingredients in the breakdown.

### 3.5 Make Cake (stock deduction)

User-initiated action from a selected recipe — no production calendar or scheduling.

**Flow:**
1. User opens a recipe and enters how many batches to make (default: 1).
2. App shows feasibility check: required vs available stock per ingredient, including expiry status.
3. If stock is insufficient, block the action and show the shortfall list.
4. If any required ingredient is **expired**, block the action and show which items are expired.
5. User confirms **Make cake** (expiring-soon items show a warning but do not block).
6. App deducts ingredient quantities (recipe amount × batch count) and records `out` movements with reason `bake`.

**Bake record fields:** id, recipeId, recipeName (snapshot), batchCount, date, note (optional), createdAt.

**Persistence:** append to `bakes.json` for history; each deduction also creates entries in `movements.json`.

### 3.6 Alerts (embedded in inventory panel)

There is no separate dashboard page. Stock and freshness alerts are shown **inline** in the Ingredient Inventory panel:

- Quantity text turns **red** when `currentQuantity ≤ reorderLevel` (critical low); **amber** when low but above reorder (optional soft threshold display).
- Expiry column shows a **red** clock/alert icon when expired, **amber** when expiring soon (within `expiryWarningDays`).
- Recipe panel shows a **Makeable** / **Not makeable** badge for the selected recipe based on stock + expiry.

---

## 4. Data Storage Design

All persistent data lives under a `data/` directory at the project root. JSON is the primary format for readability and easy manual editing.

### 4.1 File Layout

```
data/
├── ingredients.json      # Array of ingredient records
├── movements.json        # Array of stock movement records
├── recipes.json          # Array of recipe records
├── bakes.json            # History of completed "make cake" actions
└── settings.json         # App settings (currency, default units, categories)
```

### 4.2 Example Schemas

**ingredients.json**
```json
[
  {
    "id": "ing_001",
    "name": "All-purpose flour",
    "category": "flour",
    "unit": "g",
    "unitCost": 0.002,
    "currentQuantity": 5000,
    "reorderLevel": 1000,
    "expiryDate": "2026-09-30",
    "notes": "",
    "createdAt": "2026-07-15T10:00:00.000Z",
    "updatedAt": "2026-07-15T10:00:00.000Z"
  }
]
```

**movements.json**
```json
[
  {
    "id": "mov_001",
    "ingredientId": "ing_001",
    "type": "in",
    "quantity": 5000,
    "date": "2026-07-15",
    "reason": "purchase",
    "expiryDate": "2026-09-30",
    "referenceId": null,
    "note": "Bulk buy from supplier",
    "createdAt": "2026-07-15T10:05:00.000Z"
  }
]
```

**recipes.json**
```json
[
  {
    "id": "rec_001",
    "name": "Vanilla Sponge Cake",
    "description": "Light vanilla sponge for 8-inch round pan",
    "category": "cake",
    "yield": { "amount": 1, "unit": "cake", "description": "8-inch round" },
    "prepTimeMinutes": 20,
    "bakeTimeMinutes": 35,
    "imageUrl": "",
    "difficulty": "intermediate",
    "ingredients": [
      { "ingredientId": "ing_001", "quantity": 200, "unit": "g", "note": "" }
    ],
    "steps": [
      "Preheat oven to 175°C.",
      "Cream butter and sugar until light.",
      "Fold in dry ingredients alternately with milk.",
      "Bake until a skewer comes out clean."
    ],
    "tags": ["vanilla", "sponge"],
    "createdAt": "2026-07-15T10:00:00.000Z",
    "updatedAt": "2026-07-15T10:00:00.000Z"
  }
]
```

**settings.json**
```json
{
  "currency": "VND",
  "currencySymbol": "₫",
  "lowStockHighlight": true,
  "expiryWarningDays": 7,
  "ingredientCategories": ["produce", "dairy", "flour", "pantry", "egg", "flavoring", "other"],
  "recipeCategories": ["cake", "frosting", "filling", "other"],
  "units": ["g", "kg", "ml", "L", "piece", "tbsp", "tsp"]
}
```

### 4.3 Data Access Rules

- **Read:** load JSON file into memory on request (or with simple in-memory cache).
- **Write:** validate → write to a temp file → atomic rename to target file (prevents corruption on crash).
- **IDs:** generate with prefix + short unique string (e.g. `ing_`, `rec_`, `mov_`).
- **Concurrency:** single-writer assumption (one user / one server instance). File lock or write queue if needed later.
- **Backup:** user can copy the entire `data/` folder; app may offer a "Download backup" zip endpoint.

---

## 5. Application Architecture

### 5.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + TypeScript + Vite | Fast dev, component model, type safety |
| Styling | Tailwind CSS | Match warm bakery split-view mockup quickly |
| Backend | Node.js + Express (or Vite full-stack plugin) | File I/O from same process |
| Data | JSON files via `fs` | No database dependency |
| Validation | Zod | Shared schemas for API and forms |

### 5.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                   │
│  Header │ Home (Recipes | Inventory) │ Movements │ Settings│
└──────────────────────────┬──────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────▼──────────────────────────────┐
│                   API Server (Node/Express)              │
│  Routes → Services → File Repository → data/*.json       │
└──────────────────────────────────────────────────────────┘
```

### 5.3 API Endpoints (REST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List ingredients (filter: category, lowStock, expired, expiringSoon) |
| GET | `/api/ingredients/:id` | Get one ingredient |
| POST | `/api/ingredients` | Create ingredient |
| PUT | `/api/ingredients/:id` | Update ingredient |
| DELETE | `/api/ingredients/:id` | Remove ingredient (blocked if used in recipes) |
| GET | `/api/movements` | List movements (query: ingredientId, from, to) |
| POST | `/api/movements` | Record movement and update stock |
| GET | `/api/recipes` | List recipes |
| GET | `/api/recipes/:id` | Get recipe with cost breakdown |
| POST | `/api/recipes` | Create recipe |
| PUT | `/api/recipes/:id` | Update recipe |
| DELETE | `/api/recipes/:id` | Remove recipe |
| POST | `/api/recipes/:id/duplicate` | Clone recipe |
| GET | `/api/recipes/:id/feasibility?batches=N` | Stock check for N batches |
| GET | `/api/bakes` | List make-cake history |
| POST | `/api/recipes/:id/make` | Make cake: validate stock, deduct inventory, log bake |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| GET | `/api/backup` | Download zip of `data/` folder |

---

## 6. User Interface

Primary experience is a **split-view home screen** matching the draft mockup: recipes on the left, inventory on the right. Secondary screens and modals handle CRUD, make-cake confirmation, movements, and settings.

### 6.1 Screens

| Screen | Role |
|--------|------|
| **Home (split view)** | Default landing — recipe panel (left) + inventory panel (right) |
| **Modals / drawers** | Add/edit ingredient, add/edit recipe, make cake confirmation, stock-in/out |
| **Stock Movements** | Secondary page — chronological log (linked from header) |
| **Settings** | Secondary page — currency, categories, units, `expiryWarningDays` |

There is no separate Dashboard, Ingredients list, or Recipes list page. That content lives in the split view or opens as modals.

### 6.2 Visual Design

Match the warm bakery split-view mockup:

- **Layout:** Two equal cream/white cards with rounded corners (~12–16px) on a dark outer background; desktop-first two-column grid. Tablet may stack panels vertically; mobile single-column collapse is not required in v1.
- **Palette:** Warm neutrals — cream card backgrounds, brown headings (approx. `#8B6914`), tan accents, soft gray body text.
- **Typography:** Serif or semi-serif for panel titles; sans-serif for body; uppercase brown labels for section headers (e.g. `PREPARATION STEPS`).
- **Icons:** Chef hat (recipes panel), package/box (inventory panel), clock (time), sort arrows, search magnifier, expiry alert icons.
- **Cards:** Subtle shadow, generous padding.
- **Status colors:** Red = expired / critical low stock; amber/orange = expiring soon / low stock; default text = OK.
- **Principles:** Inline validation; confirm destructive actions; show units and VND consistently (e.g. `5,000 g`, `12,000 ₫`); all UI text in English.

### 6.3 App Header

Minimal top bar above the split view:

- App title: **Bakery Manager**
- Actions: `+ Ingredient`, `+ Recipe`, `Movements`, `Settings`
- No sidebar navigation

### 6.4 Left Panel — Bakery Recipes

| Element | Behavior |
|---------|----------|
| Panel header | Title "Bakery Recipes", subtitle "Select a recipe to view details and production steps", chef-hat icon |
| Recipe selector | Searchable dropdown at top; switches active recipe |
| Recipe hero | Thumbnail (`imageUrl` or placeholder), recipe name, **Makeable** / **Not makeable** badge |
| Meta row | Total time (formatted from prep + bake) and difficulty badge (`Beginner` / `Intermediate` / `Advanced`) |
| Description | Italic short blurb |
| Preparation steps | Numbered list; step text may include duration notes |
| Footer actions | Collapsible cost breakdown, batch count input, **Make cake** button |

**Makeable badge logic (computed):**

| Badge | Condition |
|-------|-----------|
| `Makeable` | All recipe ingredients have sufficient stock and none are expired |
| `Not makeable` | Any shortfall or expired ingredient (tooltip or detail lists issues) |

Expiring-soon ingredients do not change the badge to Not makeable but may show a warning in the make-cake modal.

### 6.5 Right Panel — Ingredient Inventory

| Element | Behavior |
|---------|----------|
| Panel header | Title "Ingredient Inventory", subtitle "Monitor stock levels and manage ingredient freshness", box icon |
| Search bar | Filter by ingredient name |
| Sort control | Sort by name, quantity, or expiry date (asc/desc) |
| **+ Add** | Opens add-ingredient modal |
| Table columns | **Ingredient Name** (with uppercase category sub-label), **Qty**, **Expiry Date** |
| Row styling | Qty text **red** when `currentQuantity ≤ reorderLevel`; amber for soft low-stock if used; expiry column shows red/amber clock icon for expired / expiring soon |
| Row actions | Click row → edit drawer/modal; stock-in/out available from edit or quick actions |

**Category display:** Store lowercase in JSON (`flour`, `dairy`); render uppercase in the UI (`FLOUR`, `DAIRY`).

### 6.6 Modals and Secondary Pages

- **Add / edit ingredient:** name, category, unit, unit cost, quantity, reorder level, expiry date, notes; delete with confirmation (blocked if used in recipes).
- **Add / edit recipe:** name, description, category, yield, times, difficulty, imageUrl, ingredients picker, steps; delete with confirmation.
- **Stock in / out:** quantity, date, reason; stock-in includes optional expiry date.
- **Make cake:** batch count, feasibility summary (shortfalls / expired), confirm / cancel; on confirm, deduct stock.
- **Stock Movements page:** chronological log with filters (ingredient, date range, type).
- **Settings page:** currency display settings, categories, units, `expiryWarningDays`.

### 6.7 Key Interactions

- Selecting a recipe in the left dropdown updates the detail card and **Makeable** badge live.
- Inventory table on the right updates when stock changes (after stock-in/out or make cake).
- **Make cake** opens a confirmation modal from the recipe panel footer.
- Add/edit ingredient and recipe via modals — no page navigation required for daily use.
- Low-stock and expiry status use **inline color coding** in the inventory table (not separate badge pills).
- Cost breakdown in the recipe panel footer updates when ingredient prices change.

---

## 7. Business Rules

1. Ingredients and recipes can be added and removed via the UI.
2. An ingredient cannot be deleted while referenced by any recipe.
3. Stock deduction happens only when the user confirms **Make cake** for a selected recipe.
4. Make cake is blocked if any required ingredient stock is insufficient **or any required ingredient is expired**.
5. Expiring-soon ingredients show a warning on make cake but do not block the action; they do not set the badge to **Not makeable**.
6. Categories are stored lowercase in JSON and displayed uppercase in the inventory panel.
7. `expiryDate` on an ingredient reflects the current batch on hand; v1 does not track multiple batches with different expiry dates.
8. Stock movements are append-only; corrections use `adjustment` type with required note.
9. Unit conversion (v1): support g↔kg and ml↔L only; other mismatches show a warning and exclude from auto-costing.
10. Cost = `(quantity in base unit) × unitCost`.
11. Currency is VND (₫); UI language is English.

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | Page load < 2s with up to 500 ingredients and 200 recipes |
| Data safety | Atomic writes; optional auto-backup on each save |
| Portability | Runs on Windows/macOS/Linux with Node 18+ |
| Deployment | `npm run dev` for local use; `npm run build` + `npm start` for production |
| Backup | Entire `data/` folder is the source of truth |
| Security (v1) | Local/trusted network only; no auth required |
| Language | English UI |

---

## 9. Project Structure (Proposed)

```
Bakery/
├── docs/
│   └── SPECIFICATION.md
├── data/                    # JSON data files (gitignored or seeded)
├── server/
│   ├── index.ts
│   ├── routes/
│   ├── services/
│   ├── repositories/      # File read/write
│   └── schemas/           # Zod models
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── types/
│   └── index.html
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. Implementation Phases

### Phase 1 — Foundation
- Project scaffold (Vite + React + Express + Tailwind CSS).
- File repository with atomic writes.
- Ingredients CRUD API + `ingredients.json`.
- **Split-view shell** with app header and right panel (inventory table, search, add/edit modal).
- Left panel shows a placeholder until Phase 3.

### Phase 2 — Inventory enhancements
- Stock-in/out modals; expiry date on stock-in.
- Sort control; color-coded quantity and expiry columns.
- Stock Movements secondary page.

### Phase 3 — Recipes
- Recipes CRUD API + `recipes.json` (including `imageUrl`, `difficulty`).
- Left panel fully wired: selector, thumbnail, steps, difficulty, time, description.
- Cost breakdown in recipe panel footer.
- Add/edit recipe modal.

### Phase 4 — Make Cake
- **Makeable** / **Not makeable** badge.
- Make-cake confirmation modal with feasibility check and stock deduction.
- `bakes.json` history persistence.

### Phase 5 — Polish
- Settings page.
- Backup download.
- Seed/sample data matching mockup style (categories, sample recipes).
- README with setup instructions.

---

## 11. Sample Seed Data

On first run, if `data/` is empty, initialize with:
- 5–10 common ingredients using mockup-style categories (produce, dairy, flour, pantry, etc.) with sample quantities and expiry dates.
- 2 sample recipes (e.g. vanilla sponge, chocolate cake) with difficulty, times, and optional imageUrl.
- Default `settings.json`.

---

## 12. Remaining Open Questions

| # | Question | Default Assumption |
|---|----------|-------------------|
| 1 | Git-track `data/` or gitignore? | Gitignore; provide `data/sample/` |
| 2 | Recipe image uploads (file picker)? | Out of scope for v1; use `imageUrl` string only |

---

## 13. Success Criteria

- [ ] All CRUD operations work without a database.
- [ ] Restarting the app preserves all data from JSON files.
- [ ] Recipe cost reflects current ingredient unit costs.
- [ ] Low-stock and expired ingredients are highlighted inline in the inventory panel.
- [ ] User can set and update expiry dates on inventory items.
- [ ] Split-view home shows recipes (left) and inventory (right).
- [ ] Selected recipe shows Makeable / Not makeable based on stock and expiry.
- [ ] User can back up and restore by copying `data/`.
- [ ] App runs locally with a single `npm run dev` command.
- [ ] User can add and remove ingredients and recipes.
- [ ] Making a cake from a recipe deducts stock after user confirmation.

---

## 14. Glossary

| Term | Definition |
|------|------------|
| Ingredient | A raw material tracked in inventory (e.g. flour, butter). |
| Movement | A stock in/out/adjustment event that changes quantity. |
| Recipe | A defined list of ingredients and steps to produce a product. |
| Yield | How much one recipe batch produces (e.g. 1 cake). |
| Reorder level | Minimum quantity before a low-stock alert is shown. |
| Expiry date | Date when the current stock of an ingredient should no longer be used. |
| Expiring soon | Ingredient with expiry date within `expiryWarningDays` (default: 7 days). |
| Make cake | User-confirmed action that deducts recipe ingredients from inventory. |
| Makeable | Selected recipe can be baked: sufficient stock and no expired required ingredients. |
| Difficulty | Recipe skill level: beginner, intermediate, or advanced. |