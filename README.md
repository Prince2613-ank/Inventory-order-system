# Inventory & Order Management System

A full-stack web application for managing products, customers, and orders with real-time inventory tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.x |
| Frontend | React 18, React Router v6, Axios |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |

## Running Locally with Docker Compose (Recommended)

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Clone the repo and create your `.env` file:**
   ```bash
   git clone <repo-url>
   cd inventory-order-system
   cp .env.example .env
   ```

2. **Edit `.env`** — set a real `POSTGRES_PASSWORD`:
   ```
   POSTGRES_DB=inventory_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_strong_password_here
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost,http://localhost:80
   ```

3. **Start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the app:**
   - Frontend: http://localhost
   - Backend API docs: http://localhost:8000/docs
   - Backend health: http://localhost:8000/health

> The backend waits for Postgres to be fully ready (healthcheck polling) before starting, so you won't see connection errors on first boot.

## Running Without Docker (Local Dev)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file in backend/
cp .env.example .env
# Edit .env — set DATABASE_URL to point to your local Postgres instance
# e.g. DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:8000" > .env
npm start
```

Frontend available at http://localhost:3000

## API Endpoint Summary

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| GET | `/products/{id}` | Get product by ID |
| POST | `/products` | Create product |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List all customers |
| GET | `/customers/{id}` | Get customer by ID |
| POST | `/customers` | Create customer |
| DELETE | `/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order with full item details |
| POST | `/orders` | Create order (reduces stock atomically) |
| DELETE | `/orders/{id}` | Cancel order (restores stock) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Summary stats + low-stock products |
| GET | `/health` | Health check |

## Design Decisions & Assumptions

### Order supports multiple products
Orders use an `order_items` junction table, so a single order can contain multiple products with their own quantities. This is the expected behavior for any real inventory system.

### Order cancellation restores stock
**Assumption made:** Deleting/cancelling an order via `DELETE /orders/{id}` restores all product quantities back to inventory. Rationale: in an inventory system, a cancelled order should free up reserved stock. This is documented behavior, not silent guessing.

### Unit price snapshot
`order_items.unit_price` stores the product price at the time of the order. This means historical orders are not retroactively affected by future price changes. The `total_amount` on the order is always calculated server-side from the snapshot prices.

### Stock is never negative
Before an order is placed, the system checks that every requested product has sufficient stock. If *any* item in an order is understocked, the **entire order is rejected** — no partial fulfillment. This check happens inside a `SELECT ... FOR UPDATE` transaction to prevent race conditions under concurrent load.

### Low-stock threshold
Defined as `LOW_STOCK_THRESHOLD = 10` in `backend/app/main.py`. Products with `quantity_in_stock < 10` appear in the dashboard low-stock list. Change this constant to adjust the threshold app-wide.

### Database constraints
- `products.sku` has a `UNIQUE` constraint at the database level
- `customers.email` has a `UNIQUE` constraint at the database level
- `products.price >= 0` and `products.quantity_in_stock >= 0` are enforced as `CHECK` constraints
- Foreign keys are enforced; order_items cascade-delete when an order is deleted

### CORS
Allowed origins are set via the `ALLOWED_ORIGINS` environment variable (comma-separated). Never hardcoded.

## Deployment

### Backend — Railway
Railway offers the best free-tier Docker deployment: no sleep, built-in Postgres add-on, simple env var UI.

1. Push code to GitHub
2. Create a new Railway project → "Deploy from GitHub repo"
3. Select the `backend/` directory as the root, or use a railway.toml
4. Add a Postgres plugin → Railway auto-populates `DATABASE_URL`
5. Set `ALLOWED_ORIGINS` to your Vercel frontend URL

### Frontend — Vercel
Vercel offers zero-config React deploys with the fastest global CDN.

1. Import the GitHub repo in Vercel
2. Set root directory to `frontend/`
3. Set environment variable: `REACT_APP_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy

### Environment Variables Summary

**Backend (Railway):**
- `DATABASE_URL` — set automatically by Railway Postgres plugin
- `ALLOWED_ORIGINS` — `https://your-app.vercel.app`

**Frontend (Vercel):**
- `REACT_APP_API_URL` — `https://your-app.up.railway.app`
