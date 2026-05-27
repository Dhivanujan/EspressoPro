from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.inventory import InventoryLog
from app.models.user import User
from app.schemas.inventory import InventoryLogResponse, InventoryAdjustment, LowStockAlert
from app.services.inventory_service import inventory_service
from app.repositories.base import BaseRepository
from app.utils.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])
log_repo = BaseRepository(InventoryLog)

@router.get("/alerts", response_model=List[LowStockAlert])
async def get_stock_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all products or raw ingredients whose current stock is below their configured threshold safety limit.
    """
    return await inventory_service.get_low_stock_alerts(db)

@router.post("/adjust", status_code=status.HTTP_200_OK)
async def adjust_stock(
    adjustment: InventoryAdjustment,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Manually adjust the stock level of a product or raw ingredient (Admin only).
    Logs the action in the inventory logs.
    """
    res = await inventory_service.adjust_stock(db, adjustment=adjustment, user_id=admin_user.id)
    await db.commit()
    return res

@router.get("/logs", response_model=List[InventoryLogResponse])
async def get_inventory_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin"]))
):
    """
    Get paginated stock audit logs (Admin only).
    """
    res = await db.execute(
        select(InventoryLog)
        .offset(skip)
        .limit(limit)
        .order_by(InventoryLog.id.desc())
    )
    return list(res.scalars().all())
