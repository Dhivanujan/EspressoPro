from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Any
from bson import ObjectId
from app.config.settings import settings
from app.models.order import Order, OrderItem
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.customer import Customer
from app.models.coupon import Coupon
from app.models.inventory import InventoryLog
from app.schemas.order import OrderCreate
from app.repositories.order import order_repository

class OrderService:
    async def create_order(self, db: Any, *, order_in: OrderCreate, cashier_id: str) -> Order:
        # 1. Generate Order Number
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        orders_today = await db["orders"].count_documents({"order_number": {"$regex": f"^COFFEE-{today_str}-"}})
        seq = orders_today + 1
        order_number = f"COFFEE-{today_str}-{seq:04d}"

        # 2. Process Items, Validate & Calculate Subtotal
        subtotal = Decimal("0.00")
        validated_items = []
        
        for item_in in order_in.items:
            prod_id = item_in.product_id
            prod_query = ObjectId(prod_id) if isinstance(prod_id, str) and ObjectId.is_valid(prod_id) else prod_id
            prod_doc = await db["products"].find_one({"_id": prod_query})
            if not prod_doc:
                raise ValueError(f"Product with ID {item_in.product_id} not found")
            
            product = Product(**prod_doc)
            if not product.availability_status:
                raise ValueError(f"Product '{product.name}' is currently unavailable")
            
            # Check direct product stock
            if product.stock_quantity < item_in.quantity:
                raise ValueError(f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}")
            
            # Check ingredients recipe stock
            pi_docs = await db["product_ingredients"].find({"product_id": str(product.id)}).to_list(length=100)
            recipe_items = [ProductIngredient(**pi) for pi in pi_docs]
            
            for recipe in recipe_items:
                ing_id = recipe.ingredient_id
                ing_query = ObjectId(ing_id) if isinstance(ing_id, str) and ObjectId.is_valid(ing_id) else ing_id
                ing_doc = await db["ingredients"].find_one({"_id": ing_query})
                if not ing_doc:
                    continue
                ingredient = Ingredient(**ing_doc)
                required_total = recipe.quantity_required * item_in.quantity
                if ingredient.stock_quantity < required_total:
                    raise ValueError(
                        f"Insufficient ingredient stock for '{ingredient.name}' required for '{product.name}'. "
                        f"Available: {ingredient.stock_quantity} {ingredient.unit}, Required: {required_total} {ingredient.unit}"
                    )
            
            item_subtotal = Decimal(str(product.price)) * item_in.quantity
            subtotal += item_subtotal
            validated_items.append((product, item_in.quantity, product.price, item_subtotal, recipe_items))

        # 3. Calculate Discount from Coupon
        discount_amount = Decimal("0.00")
        coupon_id = None
        if order_in.coupon_code:
            coupon_doc = await db["coupons"].find_one({"code": order_in.coupon_code.upper(), "active": True})
            if not coupon_doc:
                raise ValueError(f"Coupon code '{order_in.coupon_code}' is invalid or inactive")
            
            coupon = Coupon(**coupon_doc)
            expiry = coupon.expiry_date
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
            
            now_dt = datetime.now(timezone.utc)
            if expiry.tzinfo is None:
                now_dt = now_dt.replace(tzinfo=None)
                
            if expiry < now_dt:
                raise ValueError(f"Coupon code '{order_in.coupon_code}' has expired")
            
            coupon_id = str(coupon.id)
            if coupon.discount_type == "percentage":
                discount_amount = subtotal * (Decimal(str(coupon.discount_value)) / Decimal("100.00"))
            else:  # fixed
                discount_amount = Decimal(str(coupon.discount_value))
            
            if discount_amount > subtotal:
                discount_amount = subtotal

        # 4. Calculate Tax & Total
        tax_amount = (subtotal - discount_amount) * Decimal(str(settings.TAX_RATE))
        total_amount = (subtotal - discount_amount) + tax_amount

        # Round all decimals to 2 places
        subtotal = subtotal.quantize(Decimal("0.01"))
        discount_amount = discount_amount.quantize(Decimal("0.01"))
        tax_amount = tax_amount.quantize(Decimal("0.01"))
        total_amount = total_amount.quantize(Decimal("0.01"))

        # 5. Create Order Object
        db_order = Order(
            order_number=order_number,
            cashier_id=str(cashier_id),
            customer_id=str(order_in.customer_id) if order_in.customer_id else None,
            coupon_id=coupon_id,
            customer_name=order_in.customer_name,
            order_type=order_in.order_type,
            order_status="pending",
            payment_status="pending",
            subtotal=float(subtotal),
            tax=float(tax_amount),
            discount_amount=float(discount_amount),
            total=float(total_amount),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_order)
        await db.flush()  # Save db_order and populate db_order.id

        # 6. Process items (decrement stock & log inventory movements)
        for product, quantity, price, item_subtotal, recipe in validated_items:
            db_item = OrderItem(
                order_id=str(db_order.id),
                product_id=str(product.id),
                quantity=quantity,
                unit_price=float(price),
                subtotal=float(item_subtotal)
            )
            db.add(db_item)
            
            # Decrement product stock
            product.stock_quantity -= quantity
            db.add(product)
            
            # Log product stock movement
            prod_log = InventoryLog(
                item_type="product",
                item_id=str(product.id),
                change_amount=float(-quantity),
                reason="sale",
                adjusted_by=str(cashier_id),
                created_at=datetime.utcnow()
            )
            db.add(prod_log)
            
            # Decrement recipe ingredients stock
            for recipe_item in recipe:
                ing_id = recipe_item.ingredient_id
                ing_query = ObjectId(ing_id) if isinstance(ing_id, str) and ObjectId.is_valid(ing_id) else ing_id
                ing_doc = await db["ingredients"].find_one({"_id": ing_query})
                if ing_doc:
                    ingredient = Ingredient(**ing_doc)
                    deducted_qty = recipe_item.quantity_required * quantity
                    ingredient.stock_quantity -= deducted_qty
                    db.add(ingredient)
                    
                    # Log ingredient stock movement
                    ing_log = InventoryLog(
                        item_type="ingredient",
                        item_id=str(ingredient.id),
                        change_amount=-float(deducted_qty),
                        reason="sale",
                        adjusted_by=str(cashier_id),
                        created_at=datetime.utcnow()
                    )
                    db.add(ing_log)

        # 7. Loyalty Points Calculation and Award
        if order_in.customer_id:
            cust_id = order_in.customer_id
            cust_query = ObjectId(cust_id) if isinstance(cust_id, str) and ObjectId.is_valid(cust_id) else cust_id
            cust_doc = await db["customers"].find_one({"_id": cust_query})
            if cust_doc:
                customer = Customer(**cust_doc)
                points_earned = int(float(total_amount) * settings.LOYALTY_POINT_REWARD_RATE)
                customer.loyalty_points += points_earned
                db.add(customer)

        await db.flush()
        
        # Load relationships fully for return schema
        order_with_details = await order_repository.get_with_details(db, db_order.id)
        return order_with_details

order_service = OrderService()
