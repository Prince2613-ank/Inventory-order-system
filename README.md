# Inventory & Order Management System

A production-ready full-stack web application for managing products, customers, and orders with real-time inventory tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI 0.111, SQLAlchemy 2.x |
| Database | PostgreSQL 16 |
| Frontend | React 18, React Router v6, Axios |
| Containerization | Docker (multi-stage builds), Docker Compose |
| Web Server | nginx (serves React production build) |

---

## Running Locally with Docker Compose (Recommended)

**Prerequisites:** Docker Desktop installed and running.

### 1. Clone and configure

```bash
git clone <repo-url>
cd inventory-order-system
cp .env.example .env
```

Edit `.env` and set a strong `POSTGRES_PASSWORD`:

```env
POSTGRES_DB=inventory_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost,http://localhost:80
```

### 2. Start all three services

```bash
docker-compose up --build
```

### 3. Access the application

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API docs (Swagger) | http://localhost:8000/docs |
| Backend health check | http://localhost:8000/health |

> The backend waits for PostgreSQL to be **fully ready** (via `pg_isready` healthcheck) before starting — no manual retry needed.

---

## Running Without Docker (Local Dev)

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create backend/.env
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

> `database.py` automatically normalises `postgresql://` → `postgresql+psycopg://` so psycopg3 always connects correctly.

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:8000" > .env
npm start
```

Frontend: http://localhost:3000

---

## API Endpoint Summary

### Products

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/products` | List all products (supports `?search=`) | 200 |
| GET | `/products/{id}` | Get product by ID | 200 / 404 |
| POST | `/products` | Create product | 201 / 409 / 422 |
| POST | `/products/bulk` | Bulk create (atomic) | 201 |
| PUT | `/products/{id}` | Update product | 200 / 404 / 409 |
| DELETE | `/products/{id}` | Delete product | 204 / 404 |

### Customers

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/customers` | List all customers (supports `?search=`) | 200 |
| GET | `/customers/{id}` | Get customer by ID | 200 / 404 |
| POST | `/customers` | Create customer | 201 / 409 / 422 |
| DELETE | `/customers/{id}` | Delete customer | 204 / 404 |

### Orders

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/orders` | List all orders (with items) | 200 |
| GET | `/orders/{id}` | Get order with full item details | 200 / 404 |
| POST | `/orders` | Create order (reduces stock atomically) | 201 / 400 / 404 |
| DELETE | `/orders/{id}` | Cancel order (restores stock) | 204 / 404 |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Totals, revenue, low-stock list, recent orders |
| GET | `/health` | Health check (`{"status":"ok"}`) |

---

## Business Logic Implemented

| Rule | Implementation |
|------|---------------|
| Unique SKU | DB `UNIQUE` constraint + 409 response |
| Unique customer email | DB `UNIQUE` constraint + 409 response |
| No negative stock | DB `CHECK (quantity_in_stock >= 0)` + Pydantic validator |
| Insufficient stock → reject order | `SELECT ... FOR UPDATE` inside transaction; entire order rejected if any item fails |
| Stock reduced on order creation | Atomic deduction inside same transaction |
| Total calculated server-side | Sum of `unit_price × quantity` per item; client total never trusted |
| Correct HTTP status codes | 201 Created, 204 No Content, 404 Not Found, 409 Conflict, 422 Unprocessable |

---

## Docker Architecture

```
docker-compose up
├── db          postgres:16-alpine     port 5432 (internal)
├── backend     python:3.11-slim       port 8000 → host 8000
└── frontend    nginx:1.25-alpine      port 80  → host 80
```

- **Backend Dockerfile:** `python:3.11-slim`, installs from `requirements.txt`, runs `uvicorn` with 2 workers.
- **Frontend Dockerfile:** Two-stage — `node:20-alpine` builds React app, `nginx:1.25-alpine` serves static files. nginx proxies `/api/*` → `backend:8000`.
- **Health check:** `pg_isready` polled every 5 s; backend `depends_on: condition: service_healthy`.
- **Named volume:** `postgres_data` persists DB across container restarts.
- **No hardcoded credentials:** All secrets via environment variables; `.env` is gitignored.

---

## Pushing the Backend Image to Docker Hub

The submission form requires a Docker Hub image link. Steps:

```bash
# 1. Build the image
docker build -t <your-dockerhub-username>/inventory-backend:latest ./backend

# 2. Log in to Docker Hub
docker login

# 3. Push
docker push <your-dockerhub-username>/inventory-backend:latest
```

Your image will be available at:
`https://hub.docker.com/r/<your-dockerhub-username>/inventory-backend`

---

## Deployment Guide

### Backend — Railway (recommended: no sleep, built-in Postgres, Docker-native)

1. Push this repo to GitHub.
2. Create a new Railway project → **Deploy from GitHub**.
3. Set the root directory to `backend/`.
4. Add a **Postgres** plugin — Railway auto-populates `DATABASE_URL`.
5. Set environment variable: `ALLOWED_ORIGINS=https://your-app.vercel.app`
6. Railway uses `backend/railway.toml` for the build/start command automatically.

### Frontend — Vercel (recommended: zero-config React, fastest CDN)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** → `frontend/`.
3. Set environment variable: `REACT_APP_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy.

---

## Design Decisions & Assumptions

| Decision | Detail |
|----------|--------|
| Multi-product orders | `order_items` junction table — one order can contain multiple products |
| Order cancellation restores stock | `DELETE /orders/{id}` adds quantities back; documented and intentional |
| Unit price snapshot | `order_items.unit_price` stores price at time of order; historical orders unaffected by price changes |
| Partial fulfilment | **Not supported** — if any item is understocked the whole order is rejected |
| Low-stock threshold | `LOW_STOCK_THRESHOLD = 10` in `backend/app/main.py` — single constant to change |
| psycopg3 URL normalisation | `database.py` converts `postgresql://` → `postgresql+psycopg://` automatically |
| Frontend search | Client-side filter with 250 ms debounce; backend also accepts `?search=` for API consumers |
| CSV export | Products, Customers, Orders pages each have an Export CSV button |

---

## Project Structure

```
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, dashboard endpoint
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic v2 request/response schemas
│   │   ├── database.py      # Engine, session, psycopg3 URL normalisation
│   │   ├── routers/         # products.py, customers.py, orders.py
│   │   └── crud/            # products.py, customers.py, orders.py
│   ├── Dockerfile
│   ├── railway.toml
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   ├── components/      # Forms, modals, chart, search, sort
│   │   ├── hooks/           # useDebounce, useSortableData
│   │   ├── utils/           # exportCsv
│   │   └── services/        # api.js (Axios)
│   ├── Dockerfile           # Multi-stage: node build → nginx serve
│   ├── nginx.conf
│   ├── vercel.json
│   └── .env.example
├── docker-compose.yml
├── .env.example
└── .gitignore
```
