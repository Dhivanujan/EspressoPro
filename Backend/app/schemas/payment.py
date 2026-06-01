from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

class SplitPaymentItem(BaseModel):
    payment_method: str = Field(..., pattern="^(cash|card|qr|points)$")
    amount_paid: Decimal = Field(..., ge=0.0)

class PaymentCreate(BaseModel):
    payment_method: str = Field(..., pattern="^(cash|card|qr|points|split)$")
    amount_paid: Decimal = Field(..., ge=0.0)
    transaction_reference: Optional[str] = None
    splits: Optional[List[SplitPaymentItem]] = None

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    payment_method: str
    amount_paid: Decimal
    change_amount: Decimal
    transaction_reference: Optional[str] = None
    payment_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReceiptItem(BaseModel):
    name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

class ReceiptResponse(BaseModel):
    shop_name: str
    order_number: str
    items: List[ReceiptItem]
    subtotal: Decimal
    tax: Decimal
    discount: Decimal
    total: Decimal
    payment_method: str
    amount_paid: Decimal
    change_amount: Decimal
    timestamp: datetime
