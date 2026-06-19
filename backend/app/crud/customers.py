from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from .. import models, schemas


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Customer {customer_id} not found")
    return customer


def get_customers(db: Session, search: Optional[str] = None) -> List[models.Customer]:
    query = db.query(models.Customer)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            models.Customer.full_name.ilike(term) | models.Customer.email.ilike(term)
        )
    return query.order_by(models.Customer.id).all()


def create_customer(db: Session, payload: schemas.CustomerCreate) -> models.Customer:
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError as exc:
        db.rollback()
        if "uq_customers_email" in str(exc.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A customer with email '{payload.email}' already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Customer could not be created because of a database constraint",
        )
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete this customer because they have existing orders. Cancel or delete those orders first.",
        )
