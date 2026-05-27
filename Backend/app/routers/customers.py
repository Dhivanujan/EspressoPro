from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.utils.deps import get_current_user
from app.repositories.base import BaseRepository

router = APIRouter(prefix="/customers", tags=["Loyalty Customers"])
customer_repo = BaseRepository(Customer)

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
        
    new_cust = await customer_repo.create(db, obj_in=customer_in.model_dump())
    await db.commit()
    await db.refresh(new_cust)
    return new_cust

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
    return customer

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
    return await customer_repo.get_multi(db, skip=skip, limit=limit)

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_details(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed customer profile by ID.
    """
    customer = await customer_repo.get(db, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
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
    return updated
