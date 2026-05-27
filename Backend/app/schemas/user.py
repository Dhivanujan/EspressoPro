from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field("cashier", pattern="^(admin|cashier)$")
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, pattern="^(admin|cashier)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
