from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional

class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=20)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: Decimal = Field(..., gt=0.0)
    active: bool = True
    expiry_date: datetime

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.upper()

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=3, max_length=20)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[Decimal] = Field(None, gt=0.0)
    active: Optional[bool] = None
    expiry_date: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.upper()
        return v

class CouponResponse(CouponBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
