from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# Ingredient Schemas
class IngredientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    stock_quantity: float = Field(default=0.0, ge=0.0)
    unit: str = Field(..., min_length=1, max_length=20)  # e.g., 'g', 'ml', 'pcs'
    low_stock_threshold: float = Field(default=100.0, ge=0.0)

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    stock_quantity: Optional[float] = Field(None, ge=0.0)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    low_stock_threshold: Optional[float] = Field(None, ge=0.0)

class IngredientResponse(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Product Recipe Schemas
class ProductIngredientBase(BaseModel):
    ingredient_id: int
    quantity_required: float = Field(..., gt=0.0)

class ProductIngredientCreate(ProductIngredientBase):
    pass

class ProductIngredientResponse(ProductIngredientBase):
    ingredient: IngredientResponse

    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    category_id: Optional[int] = None
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0.0)
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    image_url: Optional[str] = None
    availability_status: Optional[bool] = True

class ProductCreate(ProductBase):
    recipe: Optional[List[ProductIngredientCreate]] = []

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0.0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    availability_status: Optional[bool] = None
    recipe: Optional[List[ProductIngredientCreate]] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    recipe_ingredients: List[ProductIngredientResponse] = []

    model_config = ConfigDict(from_attributes=True)
