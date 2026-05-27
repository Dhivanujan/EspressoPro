from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product, Ingredient
from app.models.inventory import InventoryLog
from app.schemas.inventory import LowStockAlert, InventoryAdjustment

class InventoryService:
    async def get_low_stock_alerts(self, db: AsyncSession) -> List[LowStockAlert]:
        alerts = []
        
        # 1. Fetch low stock products
        prod_res = await db.execute(
            select(Product).filter(Product.stock_quantity <= Product.low_stock_threshold)
        )
        products = prod_res.scalars().all()
        for prod in products:
            alerts.append(
                LowStockAlert(
                    item_type="product",
                    item_id=prod.id,
                    name=prod.name,
                    current_stock=float(prod.stock_quantity),
                    threshold=float(prod.low_stock_threshold)
                )
            )

        # 2. Fetch low stock ingredients
        ing_res = await db.execute(
            select(Ingredient).filter(Ingredient.stock_quantity <= Ingredient.low_stock_threshold)
        )
        ingredients = ing_res.scalars().all()
        for ing in ingredients:
            alerts.append(
                LowStockAlert(
                    item_type="ingredient",
                    item_id=ing.id,
                    name=ing.name,
                    current_stock=ing.stock_quantity,
                    threshold=ing.low_stock_threshold,
                    unit=ing.unit
                )
            )

        return alerts

    async def adjust_stock(
        self, db: AsyncSession, *, adjustment: InventoryAdjustment, user_id: int
    ) -> dict:
        if adjustment.item_type == "product":
            res = await db.execute(select(Product).filter(Product.id == adjustment.item_id))
            item = res.scalars().first()
            if not item:
                raise ValueError(f"Product with ID {adjustment.item_id} not found")
            item.stock_quantity += int(adjustment.change_amount)
            if item.stock_quantity < 0:
                raise ValueError("Adjustment results in negative stock for the product")
            db.add(item)
            new_stock = float(item.stock_quantity)
            unit = None
        else:  # ingredient
            res = await db.execute(select(Ingredient).filter(Ingredient.id == adjustment.item_id))
            item = res.scalars().first()
            if not item:
                raise ValueError(f"Ingredient with ID {adjustment.item_id} not found")
            item.stock_quantity += adjustment.change_amount
            if item.stock_quantity < 0:
                raise ValueError("Adjustment results in negative stock for the ingredient")
            db.add(item)
            new_stock = item.stock_quantity
            unit = item.unit

        # Create log
        log = InventoryLog(
            item_type=adjustment.item_type,
            item_id=adjustment.item_id,
            change_amount=adjustment.change_amount,
            reason=adjustment.reason,
            adjusted_by=user_id
        )
        db.add(log)
        await db.flush()

        return {
            "item_type": adjustment.item_type,
            "item_id": adjustment.item_id,
            "name": item.name,
            "new_stock": new_stock,
            "unit": unit,
            "log_id": log.id
        }

inventory_service = InventoryService()
