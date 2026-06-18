from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from .. import models, schemas


def _build_order_response(order: models.Order) -> schemas.OrderResponse:
    items = [
        schemas.OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in order.items
    ]
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=items,
    )


def _load_order(db: Session, order_id: int) -> models.Order:
    order = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} not found")
    return order


def get_order(db: Session, order_id: int) -> schemas.OrderResponse:
    return _build_order_response(_load_order(db, order_id))


def get_orders(db: Session) -> List[schemas.OrderResponse]:
    orders = (
        db.query(models.Order)
        .options(
            joinedload(models.Order.customer),
            joinedload(models.Order.items).joinedload(models.OrderItem.product),
        )
        .order_by(models.Order.id)
        .all()
    )
    return [_build_order_response(o) for o in orders]


def create_order(db: Session, payload: schemas.OrderCreate) -> schemas.OrderResponse:
    # Verify customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found",
        )

    # Validate no duplicate product IDs in the request
    product_ids = [item.product_id for item in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate product IDs in order items; consolidate quantities instead",
        )

    # Lock product rows for update within this transaction to prevent race conditions
    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    product_map = {p.id: p for p in products}

    # Verify all requested products exist
    missing = [pid for pid in product_ids if pid not in product_map]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {missing}",
        )

    # Check stock sufficiency before touching anything — reject whole order if any item fails
    insufficient = []
    for item in payload.items:
        product = product_map[item.product_id]
        if product.quantity_in_stock < item.quantity:
            insufficient.append(
                f"'{product.name}' (SKU: {product.sku}): "
                f"requested {item.quantity}, available {product.quantity_in_stock}"
            )
    if insufficient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock: " + "; ".join(insufficient),
        )

    # All checks passed — build order atomically
    total = Decimal("0")
    order_items = []
    for item in payload.items:
        product = product_map[item.product_id]
        product.quantity_in_stock -= item.quantity
        line_total = product.price * item.quantity
        total += line_total
        order_items.append(
            models.OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=product.price,
            )
        )

    order = models.Order(
        customer_id=payload.customer_id,
        total_amount=total,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return get_order(db, order.id)


def delete_order(db: Session, order_id: int) -> None:
    """Cancel an order and restore stock to inventory."""
    order = _load_order(db, order_id)

    # Restore stock for each item before deleting
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
