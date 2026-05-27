from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemResponse(BaseModel):
    id: int
    cart_id: int
    product_id: int
    quantity: int
    created_at: datetime
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)

class CartCreate(BaseModel):
    customer_name: Optional[str] = None

class CartResponse(BaseModel):
    id: int
    cashier_id: int
    customer_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[CartItemResponse] = []
    subtotal: float
    tax: float
    total: float

    model_config = ConfigDict(from_attributes=True)
