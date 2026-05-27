from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.product import Product, ProductIngredient

class ProductRepository(BaseRepository[Product]):
    async def get_with_recipe(self, db: AsyncSession, id: int) -> Optional[Product]:
        result = await db.execute(
            select(self.model)
            .filter(self.model.id == id)
            .options(
                selectinload(self.model.recipe_ingredients).selectinload(ProductIngredient.ingredient)
            )
        )
        return result.scalars().first()

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        availability: Optional[bool] = None
    ) -> List[Product]:
        query = select(self.model).options(
            selectinload(self.model.recipe_ingredients).selectinload(ProductIngredient.ingredient)
        )
        filters = []
        if category_id is not None:
            filters.append(self.model.category_id == category_id)
        if search is not None:
            filters.append(
                or_(
                    self.model.name.ilike(f"%{search}%"),
                    self.model.description.ilike(f"%{search}%")
                )
            )
        if availability is not None:
            filters.append(self.model.availability_status == availability)
        
        if filters:
            query = query.filter(and_(*filters))
            
        query = query.offset(skip).limit(limit).order_by(self.model.id.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

product_repository = ProductRepository(Product)
