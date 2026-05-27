from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductIngredient

class OrderRepository(BaseRepository[Order]):
    async def get_with_details(self, db: AsyncSession, id: int) -> Optional[Order]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.id == id)
            .options(
                selectinload(self.model.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.recipe_ingredients)
                .selectinload(ProductIngredient.ingredient),
                selectinload(self.model.customer),
                selectinload(self.model.payments)
            )
        )
        return result.scalars().first()

    async def get_by_number(self, db: AsyncSession, order_number: str) -> Optional[Order]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.order_number == order_number)
            .options(
                selectinload(self.model.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.recipe_ingredients)
                .selectinload(ProductIngredient.ingredient),
                selectinload(self.model.customer),
                selectinload(self.model.payments)
            )
        )
        return result.scalars().first()

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        cashier_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Order]:
        query = select(self.model).options(
            selectinload(self.model.items)
            .selectinload(OrderItem.product)
            .selectinload(Product.recipe_ingredients)
            .selectinload(ProductIngredient.ingredient),
            selectinload(self.model.customer),
            selectinload(self.model.payments)
        )
        filters = []
        if cashier_id is not None:
            filters.append(self.model.cashier_id == cashier_id)
        if customer_id is not None:
            filters.append(self.model.customer_id == customer_id)
        if order_status is not None:
            filters.append(self.model.order_status == order_status)
        if payment_status is not None:
            filters.append(self.model.payment_status == payment_status)
        
        if filters:
            query = query.filter(and_(*filters))
            
        query = query.offset(skip).limit(limit).order_by(self.model.id.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

order_repository = OrderRepository(Order)
