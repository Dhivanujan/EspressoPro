from typing import List, Optional, Any
from bson import ObjectId
from app.repositories.base import BaseRepository
from app.models.product import Product, ProductIngredient, Ingredient

class ProductRepository(BaseRepository[Product]):
    async def get_with_recipe(self, db: Any, id: Any) -> Optional[Product]:
        prod = await self.get(db, id)
        if not prod:
            return None
            
        pi_docs = await db["product_ingredients"].find({"product_id": str(prod.id)}).to_list(length=100)
        recipe_ingredients = []
        for pi_doc in pi_docs:
            pi = ProductIngredient(**pi_doc)
            # Fetch ingredient details
            ing_id = pi.ingredient_id
            query_id = ObjectId(ing_id) if isinstance(ing_id, str) and ObjectId.is_valid(ing_id) else ing_id
            ing_doc = await db["ingredients"].find_one({"_id": query_id})
            if ing_doc:
                pi.ingredient = Ingredient(**ing_doc)
            recipe_ingredients.append(pi)
            
        prod.recipe_ingredients = recipe_ingredients
        return prod

    async def get_multi_filtered(
        self,
        db: Any,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[str] = None,
        search: Optional[str] = None,
        availability: Optional[bool] = None
    ) -> List[Product]:
        query = {}
        if category_id is not None:
            query["category_id"] = str(category_id)
        if search is not None:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        if availability is not None:
            query["availability_status"] = availability
            
        cursor = db[self.collection_name].find(query).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        
        products = []
        for doc in docs:
            prod = self.model(**doc)
            
            # Fetch recipe ingredients
            pi_docs = await db["product_ingredients"].find({"product_id": str(prod.id)}).to_list(length=100)
            recipe_ingredients = []
            for pi_doc in pi_docs:
                pi = ProductIngredient(**pi_doc)
                ing_id = pi.ingredient_id
                query_id = ObjectId(ing_id) if isinstance(ing_id, str) and ObjectId.is_valid(ing_id) else ing_id
                ing_doc = await db["ingredients"].find_one({"_id": query_id})
                if ing_doc:
                    pi.ingredient = Ingredient(**ing_doc)
                recipe_ingredients.append(pi)
            prod.recipe_ingredients = recipe_ingredients
            products.append(prod)
            
        return products

product_repository = ProductRepository(Product)
