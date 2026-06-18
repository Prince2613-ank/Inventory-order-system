from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import orders as crud
from .. import schemas

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[schemas.OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)


@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return crud.get_order(db, order_id)


@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, payload)


@router.patch("/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    return crud.cancel_order(db, order_id)


@router.patch("/{order_id}/complete", response_model=schemas.OrderResponse)
def complete_order(order_id: int, db: Session = Depends(get_db)):
    return crud.complete_order(db, order_id)
