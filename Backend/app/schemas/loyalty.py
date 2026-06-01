from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict

class LoyaltyConfigBase(BaseModel):
    currency_per_point: float = Field(100.0, ge=1.0)
    redemption_value_per_point: float = Field(1.0, ge=0.01)
    tier_multipliers: Dict[str, float] = Field(
        default={"Bronze": 1.0, "Silver": 1.1, "Gold": 1.25, "Platinum": 1.5}
    )
    tier_thresholds: Dict[str, float] = Field(
        default={"Bronze": 0.0, "Silver": 200.0, "Gold": 500.0, "Platinum": 1000.0}
    )
    points_expiry_days: int = Field(365, ge=1)

class LoyaltyConfigUpdate(BaseModel):
    currency_per_point: Optional[float] = Field(None, ge=1.0)
    redemption_value_per_point: Optional[float] = Field(None, ge=0.01)
    tier_multipliers: Optional[Dict[str, float]] = None
    tier_thresholds: Optional[Dict[str, float]] = None
    points_expiry_days: Optional[int] = Field(None, ge=1)

class LoyaltyConfigResponse(LoyaltyConfigBase):
    id: str
    updated_at: datetime

class LoyaltyCampaignBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    multiplier: float = Field(1.0, ge=1.0)
    bonus_points: int = Field(0, ge=0)
    start_date: datetime
    end_date: datetime
    active: bool = True

class LoyaltyCampaignCreate(LoyaltyCampaignBase):
    pass

class LoyaltyCampaignResponse(LoyaltyCampaignBase):
    id: str
    created_at: datetime

class LoyaltyTransactionResponse(BaseModel):
    id: str
    customer_id: str
    order_id: Optional[str] = None
    type: str  # earned, redeemed, expired, manual_adjustment
    points: int
    reason: str
    adjusted_by: str
    approved_by: Optional[str] = None
    created_at: datetime

class ManualPointAdjustment(BaseModel):
    points: int
    reason: str = Field(..., min_length=3, max_length=255)
    approved_by_username: Optional[str] = None
    approved_by_password: Optional[str] = None
