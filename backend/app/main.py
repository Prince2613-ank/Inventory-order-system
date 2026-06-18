import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from . import models, schemas
from .routers import products, customers, orders

# Create all tables on startup (idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Manage products, customers, and orders with stock tracking.",
    version="1.0.0",
)

# CORS — allow origins defined by environment variable
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:80")
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

# Low-stock threshold — change this constant to adjust what "low stock" means
LOW_STOCK_THRESHOLD = 10


@app.get("/dashboard", response_model=schemas.DashboardResponse, tags=["Dashboard"])
def dashboard(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity_in_stock < LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity_in_stock)
        .all()
    )
    return schemas.DashboardResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock,
    )


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
