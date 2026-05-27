from typing import List, Optional, Any
from bson import ObjectId
from app.repositories.base import BaseRepository
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductIngredient, Ingredient
from app.models.customer import Customer
from app.models.payment import Payment
from app.models.coupon import Coupon

class OrderRepository(BaseRepository[Order]):
    async def _populate_order_details(self, db: Any, order: Order) -> Order:
        # Load order items
        oi_docs = await db["order_items"].find({"order_id": str(order.id)}).to_list(length=100)
        items = []
        for oi_doc in oi_docs:
            oi = OrderItem(**oi_doc)
            # Load product for order item
            prod_id = oi.product_id
            prod_query = ObjectId(prod_id) if isinstance(prod_id, str) and ObjectId.is_valid(prod_id) else prod_id
            prod_doc = await db["products"].find_one({"_id": prod_query})
            if prod_doc:
                prod = Product(**prod_doc)
                # Load recipe ingredients for product
                pi_docs = await db["product_ingredients"].find({"product_id": str(prod.id)}).to_list(length=100)
                recipe_ingredients = []
                for pi_doc in pi_docs:
                    pi = ProductIngredient(**pi_doc)
                    ing_id = pi.ingredient_id
                    ing_query = ObjectId(ing_id) if isinstance(ing_id, str) and ObjectId.is_valid(ing_id) else ing_id
                    ing_doc = await db["ingredients"].find_one({"_id": ing_query})
                    if ing_doc:
                        pi.ingredient = Ingredient(**ing_doc)
                    recipe_ingredients.append(pi)
                prod.recipe_ingredients = recipe_ingredients
                oi.product = prod
            items.append(oi)
        order.items = items

        # Load customer
        cust_id = getattr(order, "customer_id", None)
        if cust_id:
            cust_query = ObjectId(cust_id) if isinstance(cust_id, str) and ObjectId.is_valid(cust_id) else cust_id
            cust_doc = await db["customers"].find_one({"_id": cust_query})
            if cust_doc:
                order.customer = Customer(**cust_doc)
            else:
                order.customer = None
        else:
            order.customer = None

        # Load coupon
        coup_id = getattr(order, "coupon_id", None)
        if coup_id:
            coup_query = ObjectId(coup_id) if isinstance(coup_id, str) and ObjectId.is_valid(coup_id) else coup_id
            coup_doc = await db["coupons"].find_one({"_id": coup_query})
            if coup_doc:
                order.coupon = Coupon(**coup_doc)
            else:
                order.coupon = None
        else:
            order.coupon = None

        # Load payments
        pay_docs = await db["payments"].find({"order_id": str(order.id)}).to_list(length=100)
        order.payments = [Payment(**p) for p in pay_docs]

        return order

    async def get_with_details(self, db: Any, id: Any) -> Optional[Order]:
        order = await self.get(db, id)
        if not order:
            return None
        return await self._populate_order_details(db, order)

    async def get_by_number(self, db: Any, order_number: str) -> Optional[Order]:
        doc = await db[self.collection_name].find_one({"order_number": order_number})
        if not doc:
            return None
        order = self.model(**doc)
        return await self._populate_order_details(db, order)

    async def get_multi_filtered(
        self,
        db: Any,
        *,
        skip: int = 0,
        limit: int = 100,
        cashier_id: Optional[str] = None,
        customer_id: Optional[str] = None,
        order_status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Order]:
        query = {}
        if cashier_id is not None:
            query["cashier_id"] = str(cashier_id)
        if customer_id is not None:
            query["customer_id"] = str(customer_id)
        if order_status is not None:
            query["order_status"] = order_status
        if payment_status is not None:
            query["payment_status"] = payment_status

        cursor = db[self.collection_name].find(query).skip(skip).limit(limit).sort("_id", -1)
        docs = await cursor.to_list(length=limit)
        
        orders = []
        for doc in docs:
            order = self.model(**doc)
            orders.append(await self._populate_order_details(db, order))
        return orders

order_repository = OrderRepository(Order)
