import os
from decimal import Decimal
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from .database import engine, Base, get_db
from . import models, schemas
from .routers import products, customers, orders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description=(
        "Full-featured inventory and order management system. "
        "Supports product catalog, customer records, multi-item orders with "
        "atomic stock control, full-text search, and dashboard analytics."
    ),
    version="1.1.0",
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:80,http://localhost")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

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

    revenue_raw = db.query(func.sum(models.Order.total_amount)).scalar()
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
        low_stock_products=low_stock,
        recent_orders=recent_orders,
    )


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
