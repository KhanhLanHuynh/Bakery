# Bakery Manager

A local web app for managing bakery inventory and cake recipes. All data is stored in JSON files — no database required.

## Features

- **Split-view home** — recipes on the left, inventory on the right
- **Ingredients** — CRUD, search, sort, category filter, low-stock and expiry alerts
- **Stock movements** — stock in/out, chronological log with filters
- **Recipes** — CRUD, cost breakdown, makeable badge, pieces per batch
- **Make cake** — feasibility check, stock deduction, bake history
- **Settings** — currency, categories, units, expiry warnings
- **Backup** — download a zip of all data files

## Requirements

- Node.js 18+

## Setup

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Development

```bash
npm run dev
```

This starts:

- API server at `http://localhost:3001`
- React client at `http://localhost:5173` (proxies `/api` to the server)

Open `http://localhost:5173` in your browser.

## Production build

```bash
npm run build --prefix client
npm run build --prefix server
npm run start --prefix server
```

Serve the `client/dist` folder with any static file server, or configure your reverse proxy to serve the UI and forward `/api` to the Node server.

## Project structure

```
Bakery/
├── client/          # React + Vite + Tailwind UI
├── server/          # Express API + JSON file storage
├── data/            # Runtime JSON data (gitignored)
├── data/sample/     # Seed files copied on first run when data is empty
└── docs/            # Specification
```

## Data

On first run, if `data/ingredients.json` or `data/recipes.json` is empty, the server seeds from `data/sample/`.

To reset to sample data:

1. Stop the server
2. Delete or clear files in `data/` (keep `data/sample/`)
3. Restart the server

### Backup & restore

- **Download:** Settings page → **Download Backup**, or `GET /api/backup`
- **Restore:** unzip the backup and copy the JSON files into `data/`

## API

### Ingredients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ingredients` | List ingredients |
| GET | `/api/ingredients/:id` | Get one ingredient |
| POST | `/api/ingredients` | Create ingredient |
| PUT | `/api/ingredients/:id` | Update ingredient |
| DELETE | `/api/ingredients/:id` | Remove ingredient |

### Movements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movements` | List movements (query: `ingredientId`, `type`, `from`, `to`) |
| POST | `/api/movements` | Record movement and update stock |

### Recipes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List recipes |
| GET | `/api/recipes/:id` | Get recipe with cost breakdown and makeable status |
| POST | `/api/recipes` | Create recipe |
| PUT | `/api/recipes/:id` | Update recipe |
| DELETE | `/api/recipes/:id` | Remove recipe |
| POST | `/api/recipes/:id/duplicate` | Duplicate recipe |
| GET | `/api/recipes/:id/feasibility` | Stock check for N batches (query: `batches`) |
| POST | `/api/recipes/:id/make` | Make cake: deduct stock and log bake |

### Bakes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bakes` | List make-cake history |

### Settings & backup

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update app settings |
| GET | `/api/backup` | Download zip of data JSON files |

## Sample seed data

`data/sample/` includes:

- 8 ingredients (produce, dairy, flour, pantry, egg, flavoring)
- 3 recipes (sourdough, vanilla sponge, chocolate layer cake)
- Default `settings.json`
