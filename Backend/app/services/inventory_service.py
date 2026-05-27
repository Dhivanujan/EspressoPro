from typing import List, Any
from bson import ObjectId
from app.models.product import Product, Ingredient
from app.models.inventory import InventoryLog
from app.schemas.inventory import LowStockAlert, InventoryAdjustment
from datetime import datetime

class InventoryService:
    async def get_low_stock_alerts(self, db: Any) -> List[LowStockAlert]:
        alerts = []
        
        # 1. Fetch low stock products
        cursor = db["products"].find()
        products = await cursor.to_list(length=1000)
        for prod_doc in products:
            prod = Product(**prod_doc)
            if prod.stock_quantity <= prod.low_stock_threshold:
                alerts.append(
                    LowStockAlert(
                        item_type="product",
                        item_id=str(prod.id),
                        name=prod.name,
                        current_stock=float(prod.stock_quantity),
                        threshold=float(prod.low_stock_threshold)
                    )
                )

        # 2. Fetch low stock ingredients
        cursor_ing = db["ingredients"].find()
        ingredients = await cursor_ing.to_list(length=1000)
        for ing_doc in ingredients:
            ing = Ingredient(**ing_doc)
            if ing.stock_quantity <= ing.low_stock_threshold:
                alerts.append(
                    LowStockAlert(
                        item_type="ingredient",
                        item_id=str(ing.id),
                        name=ing.name,
                        current_stock=float(ing.stock_quantity),
                        threshold=float(ing.low_stock_threshold),
                        unit=ing.unit
                    )
                )

        return alerts

    async def adjust_stock(
        self, db: Any, *, adjustment: InventoryAdjustment, user_id: str
    ) -> dict:
        item_id = adjustment.item_id
        query_id = ObjectId(item_id) if isinstance(item_id, str) and ObjectId.is_valid(item_id) else item_id
        
        if adjustment.item_type == "product":
            prod_doc = await db["products"].find_one({"_id": query_id})
            if not prod_doc:
                raise ValueError(f"Product with ID {adjustment.item_id} not found")
            item = Product(**prod_doc)
            item.stock_quantity += int(adjustment.change_amount)
            if item.stock_quantity < 0:
                raise ValueError("Adjustment results in negative stock for the product")
            db.add(item)
            new_stock = float(item.stock_quantity)
            unit = None
        else:  # ingredient
            ing_doc = await db["ingredients"].find_one({"_id": query_id})
            if not ing_doc:
                raise ValueError(f"Ingredient with ID {adjustment.item_id} not found")
            item = Ingredient(**ing_doc)
            item.stock_quantity += adjustment.change_amount
            if item.stock_quantity < 0:
                raise ValueError("Adjustment results in negative stock for the ingredient")
            db.add(item)
            new_stock = float(item.stock_quantity)
            unit = item.unit

        # Create log
        log = InventoryLog(
            item_type=adjustment.item_type,
            item_id=str(adjustment.item_id),
            change_amount=adjustment.change_amount,
            reason=adjustment.reason,
            adjusted_by=str(user_id),
            created_at=datetime.utcnow()
        )
        db.add(log)
        await db.flush()

        return {
            "item_type": adjustment.item_type,
            "item_id": str(adjustment.item_id),
            "name": item.name,
            "new_stock": new_stock,
            "unit": unit,
            "log_id": str(log.id)
        }

inventory_service = InventoryService()
