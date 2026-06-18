from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from .. import models, schemas


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {product_id} not found")
    return product


def get_products(db: Session, search: Optional[str] = None) -> List[models.Product]:
    query = db.query(models.Product)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Product.name.ilike(term) | models.Product.sku.ilike(term)
        )
    return query.order_by(models.Product.id).all()


def create_product(db: Session, payload: schemas.ProductCreate) -> models.Product:
    product = models.Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )
    return product


def bulk_create_products(db: Session, payloads: List[schemas.ProductCreate]) -> schemas.BulkProductResult:
    """
    Insert multiple products in a single transaction.
    On any IntegrityError the entire batch is rolled back so no partial state is committed.
    Individual validation errors (e.g. duplicate SKU within the batch) are collected and returned.
    """
    created = 0
    errors: List[str] = []

    # Pre-check for duplicates within the submitted batch itself
    skus = [p.sku for p in payloads]
    seen: set = set()
    for sku in skus:
        if sku in seen:
            errors.append(f"Duplicate SKU in request batch: '{sku}'")
        seen.add(sku)

    if errors:
        return schemas.BulkProductResult(created=0, failed=len(payloads), errors=errors)

    products = [models.Product(**p.model_dump()) for p in payloads]
    for product in products:
        db.add(product)

    try:
        db.commit()
        created = len(products)
    except IntegrityError as exc:
        db.rollback()
        errors.append(f"Batch rejected — one or more SKUs already exist in the database. Detail: {exc.orig}")

    return schemas.BulkProductResult(created=created, failed=len(payloads) - created, errors=errors)


def update_product(db: Session, product_id: int, payload: schemas.ProductUpdate) -> models.Product:
    product = get_product(db, product_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
