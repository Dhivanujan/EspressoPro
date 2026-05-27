from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class InventoryLogResponse(BaseModel):
    id: str
    item_type: str  # "product" or "ingredient"
    item_id: str
    change_amount: float
    reason: str      # "sale", "restock", "wastage", "adjustment"
    adjusted_by: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryAdjustment(BaseModel):
    item_type: str = Field(..., pattern="^(product|ingredient)$")
    item_id: str
    change_amount: float  # Positive to add, negative to subtract
    reason: str = Field(..., pattern="^(restock|wastage|adjustment)$")

class LowStockAlert(BaseModel):
    item_type: str  # "product" or "ingredient"
    item_id: str
    name: str
    current_stock: float
    threshold: float
    unit: Optional[str] = None  # e.g., 'g', 'ml', 'pcs' (None for products)
