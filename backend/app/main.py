import os
from contextlib import asynccontextmanager
from decimal import Decimal
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text, distinct
from sqlalchemy.orm import Session, joinedload
from .database import engine, Base, get_db
from . import models, schemas
from .routers import products, customers, orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE products ALTER COLUMN created_at SET DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE customers ALTER COLUMN created_at SET DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT NOW()"))
        connection.execute(text("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'active'"))
    yield


app = FastAPI(
    title="Inventory & Order Management API",
    description=(
        "Full-featured inventory and order management system. "
        "Supports product catalog, customer records, multi-item orders with "
        "atomic stock control, full-text search, and dashboard analytics."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:80,http://localhost")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

print("ALLOWED_ORIGINS ENV =", os.getenv("ALLOWED_ORIGINS"))
print("PARSED ORIGINS =", allowed_origins)

@app.get("/env-test")
def env_test():
    return {
        "raw": os.getenv("ALLOWED_ORIGINS"),
        "parsed": allowed_origins
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

# Products with quantity_in_stock below this value appear in the low-stock alert
LOW_STOCK_THRESHOLD = 10


@app.get("/dashboard", response_model=schemas.DashboardResponse, tags=["Dashboard"])
def dashboard(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    active_orders = db.query(models.Order).filter(models.Order.status == "active").count()
    completed_orders = db.query(models.Order).filter(models.Order.status == "completed").count()
    cancelled_orders = db.query(models.Order).filter(models.Order.status == "cancelled").count()
    customers_with_orders = db.query(func.count(distinct(models.Order.customer_id))).scalar() or 0

    revenue_raw = (
        db.query(func.sum(models.Order.total_amount))
        .filter(models.Order.status == "completed")
        .scalar()
    )
    total_revenue = Decimal(str(revenue_raw)) if revenue_raw is not None else Decimal("0")

    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock < LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity_in_stock)
        .all()
    )

    recent_raw = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items),
        )
        .order_by(models.Order.created_at.desc())
        .limit(5)
        .all()
    )

    recent_orders = [
        schemas.RecentOrderSummary(
            id=o.id,
            customer_name=o.customer.full_name,
            total_amount=o.total_amount,
            items_count=len(o.items),
            created_at=o.created_at,
        )
        for o in recent_raw
    ]

    return schemas.DashboardResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_orders=active_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        customers_with_orders=customers_with_orders,
        low_stock_count=len(low_stock),
        low_stock_products=low_stock,
        recent_orders=recent_orders,
    )


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
