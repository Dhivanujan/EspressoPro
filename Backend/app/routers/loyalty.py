from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.loyalty import (
    LoyaltyConfigResponse,
    LoyaltyConfigUpdate,
    LoyaltyCampaignResponse,
    LoyaltyCampaignCreate,
    LoyaltyTransactionResponse,
    ManualPointAdjustment
)
from app.schemas.customer import CustomerResponse
from app.utils.deps import get_current_user, RoleChecker
from app.services.auth import auth_service
from app.repositories.base import BaseRepository
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from decimal import Decimal

router = APIRouter(prefix="/loyalty", tags=["CRM & Loyalty Program"])
customer_repo = BaseRepository(Customer)

# Helper to ensure defaults for customer profiles
def populate_customer_defaults(customer):
    if not hasattr(customer, "loyalty_points") or getattr(customer, "loyalty_points") is None:
        customer.loyalty_points = 0
    if not hasattr(customer, "lifetime_spending") or getattr(customer, "lifetime_spending") is None:
        customer.lifetime_spending = Decimal("0.00")
    if not hasattr(customer, "lifetime_points") or getattr(customer, "lifetime_points") is None:
        customer.lifetime_points = 0
    if not hasattr(customer, "tier") or getattr(customer, "tier") is None:
        customer.tier = "Bronze"
    if not hasattr(customer, "visit_count") or getattr(customer, "visit_count") is None:
        customer.visit_count = 0
    if not hasattr(customer, "last_visit_at") or getattr(customer, "last_visit_at") is None:
        customer.last_visit_at = None
    if not hasattr(customer, "points_expiry_date") or getattr(customer, "points_expiry_date") is None:
        customer.points_expiry_date = None
    return customer

# Helper to determine VIP tier
def determine_tier(spending: Decimal, points: int, thresholds: dict) -> str:
    p_thresh = thresholds.get("Platinum", 1000.0)
    g_thresh = thresholds.get("Gold", 500.0)
    s_thresh = thresholds.get("Silver", 200.0)
    
    val = float(spending)
    if val >= p_thresh:
        return "Platinum"
    elif val >= g_thresh:
        return "Gold"
    elif val >= s_thresh:
        return "Silver"
    else:
        return "Bronze"

async def get_loyalty_config(db):
    config_doc = await db["loyalty_config"].find_one({})
    if not config_doc:
        default_config = {
            "currency_per_point": 100.0,
            "redemption_value_per_point": 1.0,
            "tier_multipliers": {"Bronze": 1.0, "Silver": 1.1, "Gold": 1.25, "Platinum": 1.5},
            "tier_thresholds": {"Bronze": 0.0, "Silver": 200.0, "Gold": 500.0, "Platinum": 1000.0},
            "points_expiry_days": 365,
            "created_at": datetime.now(timezone.utc).replace(tzinfo=None),
            "updated_at": datetime.now(timezone.utc).replace(tzinfo=None)
        }
        res = await db["loyalty_config"].insert_one(default_config)
        default_config["_id"] = res.inserted_id
        return default_config
    return config_doc

@router.get("/config", response_model=LoyaltyConfigResponse)
async def get_global_loyalty_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the global loyalty program configuration.
    """
    config = await get_loyalty_config(db)
    if "_id" in config:
        config["id"] = str(config["_id"])
    return LoyaltyConfigResponse(**config)

@router.put("/config", response_model=LoyaltyConfigResponse)
async def update_global_loyalty_config(
    config_in: LoyaltyConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Update global loyalty rules (Admin only).
    """
    config = await get_loyalty_config(db)
    config_id = config["_id"]
    
    update_data = config_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None)
    
    await db["loyalty_config"].update_one({"_id": config_id}, {"$set": update_data})
    
    updated = await db["loyalty_config"].find_one({"_id": config_id})
    updated["id"] = str(updated["_id"])
    return LoyaltyConfigResponse(**updated)

@router.get("/campaigns", response_model=List[LoyaltyCampaignResponse])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all active loyalty point bonus campaigns.
    """
    cursor = db["loyalty_campaigns"].find()
    docs = await cursor.to_list(length=100)
    
    campaigns = []
    for doc in docs:
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
        campaigns.append(doc)
    return campaigns

@router.post("/campaigns", response_model=LoyaltyCampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    campaign_in: LoyaltyCampaignCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Create a new seasonal loyalty campaign (Admin only).
    """
    payload = campaign_in.model_dump()
    payload["created_at"] = datetime.now(timezone.utc).replace(tzinfo=None)
    payload["updated_at"] = datetime.now(timezone.utc).replace(tzinfo=None)
    
    res = await db["loyalty_campaigns"].insert_one(payload)
    payload["id"] = str(res.inserted_id)
    return LoyaltyCampaignResponse(**payload)

@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete or deactivate a campaign (Admin only).
    """
    q_id = ObjectId(campaign_id) if ObjectId.is_valid(campaign_id) else campaign_id
    res = await db["loyalty_campaigns"].delete_one({"_id": q_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return None

@router.post("/customers/{customer_id}/adjust-points", response_model=CustomerResponse)
async def manual_point_adjustment(
    customer_id: str,
    adjustment: ManualPointAdjustment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adjust a customer's loyalty points balance manually.
    Requires manager credentials override if performed by a cashier or supervisor.
    """
    cust_query = ObjectId(customer_id) if ObjectId.is_valid(customer_id) else customer_id
    cust_doc = await db["customers"].find_one({"_id": cust_query})
    if not cust_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    
    customer = Customer(**cust_doc)
    populate_customer_defaults(customer)

    # Check manager authorization override if cashier or supervisor
    approved_by = current_user.username
    if current_user.role in ["cashier", "supervisor"]:
        if not adjustment.approved_by_username or not adjustment.approved_by_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Manager/Admin supervisor override credentials are required for cashier point adjustments"
            )
        
        # Verify supervisor user exists and matches credentials
        sup_doc = await db["users"].find_one({"username": adjustment.approved_by_username})
        if not sup_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid manager override username"
            )
        
        sup_user = User(**sup_doc)
        if not auth_service.verify_password(adjustment.approved_by_password, sup_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid manager override password"
            )
            
        if sup_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Provided credentials do not belong to an authorized Manager/Admin"
            )
        approved_by = sup_user.username

    # Execute points adjustment
    customer.loyalty_points += adjustment.points
    if customer.loyalty_points < 0:
         customer.loyalty_points = 0 # Guard against negative points
         
    if adjustment.points > 0:
        customer.lifetime_points += adjustment.points
        
    loyalty_config = await get_loyalty_config(db)
    customer.tier = determine_tier(customer.lifetime_spending, customer.lifetime_points, loyalty_config["tier_thresholds"])
    
    # Save customer changes
    db.add(customer)
    await db.commit()
    
    # Audit log adjustment
    audit_tx = {
        "customer_id": customer_id,
        "order_id": None,
        "type": "manual_adjustment",
        "points": adjustment.points,
        "reason": adjustment.reason,
        "adjusted_by": current_user.username,
        "approved_by": approved_by,
        "created_at": datetime.now(timezone.utc).replace(tzinfo=None)
    }
    await db["loyalty_transactions"].insert_one(audit_tx)
    
    await db.refresh(customer)
    return populate_customer_defaults(customer)
