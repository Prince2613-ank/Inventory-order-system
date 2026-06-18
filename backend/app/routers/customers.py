from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import customers as crud
from .. import schemas

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[schemas.CustomerResponse])
def list_customers(
    search: Optional[str] = Query(None, description="Filter by name or email (case-insensitive)"),
    db: Session = Depends(get_db),
):
    return crud.get_customers(db, search=search)


@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.get_customer(db, customer_id)


@router.post("", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    crud.delete_customer(db, customer_id)
