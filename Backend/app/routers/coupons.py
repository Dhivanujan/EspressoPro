from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.coupon import Coupon
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse
from app.utils.deps import get_current_user, RoleChecker
from app.repositories.base import BaseRepository

router = APIRouter(prefix="/coupons", tags=["Discount Coupons"])
coupon_repo = BaseRepository(Coupon)

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    coupon_in: CouponCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Create a new discount coupon (Admin only).
    """
    res = await db.execute(select(Coupon).filter(Coupon.code == coupon_in.code.upper()))
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A coupon with this code already exists"
        )
        
    new_coupon = await coupon_repo.create(db, obj_in=coupon_in.model_dump())
    await db.commit()
    await db.refresh(new_coupon)
    return new_coupon

@router.get("/validate/{code}", response_model=CouponResponse)
async def validate_coupon(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if a coupon code is active, valid, and not expired.
    """
    res = await db.execute(
        select(Coupon).filter(Coupon.code == code.upper(), Coupon.active == True)
    )
    coupon = res.scalars().first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Coupon code '{code}' is invalid or inactive"
        )
        
    if coupon.expiry_date < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon code '{code}' has expired"
        )
        
    return coupon

@router.get("", response_model=List[CouponResponse])
async def list_coupons(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    List all created coupons (Admin only).
    """
    return await coupon_repo.get_multi(db, skip=skip, limit=limit)

@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: int,
    coupon_in: CouponUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Update a coupon's configuration (Admin only).
    """
    coupon = await coupon_repo.get(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
        
    if coupon_in.code:
        res = await db.execute(
            select(Coupon).filter(Coupon.code == coupon_in.code.upper(), Coupon.id != coupon_id)
        )
        if res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A coupon with this code already exists"
            )
            
    updated = await coupon_repo.update(db, db_obj=coupon, obj_in=coupon_in)
    await db.commit()
    await db.refresh(updated)
    return updated

@router.delete("/{coupon_id}", response_model=CouponResponse)
async def delete_coupon(
    coupon_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Delete a coupon (Admin only).
    """
    coupon = await coupon_repo.get(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
        
    await coupon_repo.remove(db, id=coupon_id)
    await db.commit()
    return coupon
