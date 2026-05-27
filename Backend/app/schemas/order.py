from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.schemas.product import ProductResponse
from app.schemas.customer import CustomerResponse

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    coupon_code: Optional[str] = None
    order_type: str = Field("takeaway", pattern="^(dine_in|takeaway)$")
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    order_status: str = Field(..., pattern="^(pending|preparing|completed|cancelled)$")

class OrderResponse(BaseModel):
    id: int
    order_number: str
    cashier_id: int
    customer_id: Optional[int] = None
    coupon_id: Optional[int] = None
    customer_name: Optional[str] = None
    order_type: str
    order_status: str
    payment_status: str
    subtotal: Decimal
    tax: Decimal
    discount_amount: Decimal
    total: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    customer: Optional[CustomerResponse] = None

    model_config = ConfigDict(from_attributes=True)
