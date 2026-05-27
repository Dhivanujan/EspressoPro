from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)  # e.g., '+1234567890' or simple digits

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    loyalty_points: Optional[int] = Field(None, ge=0)

class CustomerResponse(CustomerBase):
    id: str
    loyalty_points: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
