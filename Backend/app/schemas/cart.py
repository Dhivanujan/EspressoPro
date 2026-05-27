from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(default=1, gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemResponse(BaseModel):
    id: str
    cart_id: str
    product_id: str
    quantity: int
    created_at: datetime
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)

class CartCreate(BaseModel):
    customer_name: Optional[str] = None

class CartResponse(BaseModel):
    id: str
    cashier_id: str
    customer_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[CartItemResponse] = []
    subtotal: float
    tax: float
    total: float

    model_config = ConfigDict(from_attributes=True)
