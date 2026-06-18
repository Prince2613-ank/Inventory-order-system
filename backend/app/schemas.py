import re
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


# ---------------------------------------------------------------------------
# Product schemas
# ---------------------------------------------------------------------------

class ProductBase(BaseModel):
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Product name must not be empty")
        return v

    @field_validator("sku")
    @classmethod
    def sku_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("SKU must not be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price must be >= 0")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def qty_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity in stock must be >= 0")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    quantity_in_stock: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Product name must not be empty")
        return v

    @field_validator("sku")
    @classmethod
    def sku_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("SKU must not be empty")
        return v

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Price must be >= 0")
        return v

    @field_validator("quantity_in_stock")
    @classmethod
    def qty_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Quantity in stock must be >= 0")
        return v


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkProductResult(BaseModel):
    created: int
    failed: int
    errors: List[str]


# ---------------------------------------------------------------------------
# Customer schemas
# ---------------------------------------------------------------------------

PHONE_RE = re.compile(r"^\+?[\d\s\-().]{7,20}$")


class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name must not be empty")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v and not PHONE_RE.match(v):
                raise ValueError(
                    "Phone number must be 7–20 characters and contain only digits, "
                    "spaces, +, -, (, or )"
                )
        return v or None


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Order schemas
# ---------------------------------------------------------------------------

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not v:
            raise ValueError("An order must contain at least one item")
        return v


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    total_amount: Decimal
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard schemas
# ---------------------------------------------------------------------------

class RecentOrderSummary(BaseModel):
    id: int
    customer_name: str
    total_amount: Decimal
    items_count: int
    created_at: datetime


class DashboardResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: List[ProductResponse]
    recent_orders: List[RecentOrderSummary]
