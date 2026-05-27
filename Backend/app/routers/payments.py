from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse, ReceiptResponse
from app.repositories.order import order_repository
from app.repositories.base import BaseRepository
from app.utils.deps import get_current_user, RoleChecker
from app.utils.receipt import receipt_generator
from decimal import Decimal

router = APIRouter(prefix="/payments", tags=["Payment Processing"])
payment_repo = BaseRepository(Payment)

@router.post("/{order_id}", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def process_payment(
    order_id: int,
    payment_in: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a payment for an active order (Cash, Card, QR Payment).
    Calculates change amount for Cash transactions.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.payment_status == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already paid")
        
    if order.order_status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay for a cancelled order")
        
    # Check if payment cover total
    if payment_in.amount_paid < order.total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient amount paid. Total is {order.total}, paid {payment_in.amount_paid}"
        )
        
    # Calculate change
    change_amount = Decimal("0.00")
    if payment_in.payment_method == "cash":
        change_amount = payment_in.amount_paid - order.total
        
    # Create Payment transaction
    payment_data = {
        "order_id": order_id,
        "payment_method": payment_in.payment_method,
        "amount_paid": payment_in.amount_paid,
        "change_amount": change_amount,
        "transaction_reference": payment_in.transaction_reference,
        "payment_status": "completed"
    }
    
    new_payment = await payment_repo.create(db, obj_in=payment_data)
    
    # Update Order statuses
    order.payment_status = "paid"
    order.order_status = "preparing"  # Advances from pending to preparing once paid
    db.add(order)
    
    await db.commit()
    await db.refresh(new_payment)
    return new_payment

@router.get("/receipt/{order_id}", response_model=ReceiptResponse)
async def get_order_receipt(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate standard receipt JSON data for a completed/paid order.
    """
    order = await order_repository.get_with_details(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if order.payment_status != "paid" or not order.payments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receipt can only be generated for paid orders"
        )
        
    # Get last successful payment
    last_payment = order.payments[-1]
    
    receipt_data = receipt_generator.generate_receipt_data(
        order,
        payment_method=last_payment.payment_method,
        amount_paid=float(last_payment.amount_paid),
        change_amount=float(last_payment.change_amount)
    )
    return receipt_data

@router.get("", response_model=List[PaymentResponse])
async def get_payment_history(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Retrieve auditing transaction history logs (Admin only).
    """
    return await payment_repo.get_multi(db, skip=skip, limit=limit)
