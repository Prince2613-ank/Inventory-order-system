from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import products as crud
from .. import schemas

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[schemas.ProductResponse])
def list_products(
    search: Optional[str] = Query(None, description="Filter by name or SKU (case-insensitive)"),
    db: Session = Depends(get_db),
):
    return crud.get_products(db, search=search)


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return crud.get_product(db, product_id)


@router.post("", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db, payload)


@router.post("/bulk", response_model=schemas.BulkProductResult, status_code=status.HTTP_201_CREATED)
def bulk_create_products(
    payload: List[schemas.ProductCreate],
    db: Session = Depends(get_db),
):
    """Create multiple products in a single atomic transaction."""
    return crud.bulk_create_products(db, payload)


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    crud.delete_product(db, product_id)
