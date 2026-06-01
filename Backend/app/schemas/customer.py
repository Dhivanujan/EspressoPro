from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)  # e.g., '+1234567890' or simple digits
    birthdate: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    loyalty_points: Optional[int] = Field(None, ge=0)
    lifetime_spending: Optional[Decimal] = Field(None, ge=0.0)
    lifetime_points: Optional[int] = Field(None, ge=0)
    tier: Optional[str] = Field(None, pattern="^(Bronze|Silver|Gold|Platinum)$")
    birthdate: Optional[str] = None
    points_expiry_date: Optional[datetime] = None

class CustomerResponse(CustomerBase):
    id: str
    loyalty_points: int
    lifetime_spending: Decimal
    lifetime_points: int
    tier: str
    visit_count: int
    last_visit_at: Optional[datetime] = None
    points_expiry_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
