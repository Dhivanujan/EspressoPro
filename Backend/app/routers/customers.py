from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.loyalty import LoyaltyTransactionResponse
from app.utils.deps import get_current_user
from app.repositories.base import BaseRepository
from bson import ObjectId
from decimal import Decimal

router = APIRouter(prefix="/customers", tags=["Loyalty Customers"])
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
    return customer

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def register_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new customer for the loyalty program.
    """
    res = await db.execute(select(Customer).filter(Customer.phone == customer_in.phone))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this phone number is already registered"
        )
        
    payload = customer_in.model_dump()
    payload.update({
        "loyalty_points": 0,
        "lifetime_spending": 0.0,
        "lifetime_points": 0,
        "tier": "Bronze",
        "visit_count": 0,
        "last_visit_at": None,
        "points_expiry_date": None
    })
    
    new_cust = await customer_repo.create(db, obj_in=payload)
    await db.commit()
    await db.refresh(new_cust)
    return populate_customer_defaults(new_cust)

@router.get("/search", response_model=CustomerResponse)
async def lookup_customer_by_phone(
    phone: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Look up a customer profile by their phone number.
    """
    res = await db.execute(select(Customer).filter(Customer.phone == phone))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found with this phone number"
        )
    return populate_customer_defaults(customer)

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List registered loyalty customers.
    """
    customers = await customer_repo.get_multi(db, skip=skip, limit=limit)
    return [populate_customer_defaults(c) for c in customers]

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_details(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed customer profile by ID.
    """
    customer = await customer_repo.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return populate_customer_defaults(customer)

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a customer's profile details.
    """
    customer = await customer_repo.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
    if customer_in.phone:
        res = await db.execute(
            select(Customer).filter(Customer.phone == customer_in.phone, Customer.id != customer_id)
        )
        if res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this phone number is already registered"
            )
            
    updated = await customer_repo.update(db, db_obj=customer, obj_in=customer_in)
    await db.commit()
    await db.refresh(updated)
    return populate_customer_defaults(updated)

@router.get("/{customer_id}/loyalty-transactions", response_model=List[LoyaltyTransactionResponse])
async def get_customer_loyalty_transactions(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get customer loyalty ledger audit history.
    """
    cursor = db["loyalty_transactions"].find({"customer_id": customer_id})
    docs = await cursor.to_list(length=100)
    
    transactions = []
    for doc in docs:
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
        transactions.append(doc)
        
    # Sort transactions by created_at descending
    transactions.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return transactions

@router.get("/{customer_id}/purchase-history")
async def get_customer_purchase_history(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve customer visit frequency and spending patterns.
    """
    cursor = db["orders"].find({"customer_id": customer_id})
    docs = await cursor.to_list(length=100)
    
    orders = []
    for doc in docs:
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
        orders.append(doc)
        
    # Sort orders by created_at descending
    orders.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return orders

