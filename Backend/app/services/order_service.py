from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.settings import settings
from app.models.order import Order, OrderItem
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.customer import Customer
from app.models.coupon import Coupon
from app.models.inventory import InventoryLog
from app.schemas.order import OrderCreate
from app.repositories.order import order_repository

class OrderService:
    async def create_order(self, db: AsyncSession, *, order_in: OrderCreate, cashier_id: int) -> Order:
        # 1. Generate Order Number
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        result = await db.execute(
            select(func.count(Order.id)).filter(Order.order_number.like(f"COFFEE-{today_str}-%"))
        )
        orders_today = result.scalar() or 0
        seq = orders_today + 1
        order_number = f"COFFEE-{today_str}-{seq:04d}"

        # 2. Process Items, Validate & Calculate Subtotal
        subtotal = Decimal("0.00")
        validated_items = []
        
        for item_in in order_in.items:
            res = await db.execute(select(Product).filter(Product.id == item_in.product_id))
            product = res.scalars().first()
            if not product:
                raise ValueError(f"Product with ID {item_in.product_id} not found")
            if not product.availability_status:
                raise ValueError(f"Product '{product.name}' is currently unavailable")
            
            # Check direct product stock
            if product.stock_quantity < item_in.quantity:
                raise ValueError(f"Insufficient stock for product '{product.name}'. Available: {product.stock_quantity}")
            
            # Check ingredients recipe stock
            recipe_res = await db.execute(
                select(ProductIngredient).filter(ProductIngredient.product_id == product.id)
            )
            recipe_items = recipe_res.scalars().all()
            for recipe in recipe_items:
                ing_res = await db.execute(select(Ingredient).filter(Ingredient.id == recipe.ingredient_id))
                ingredient = ing_res.scalars().first()
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
            coupon_res = await db.execute(
                select(Coupon).filter(Coupon.code == order_in.coupon_code.upper(), Coupon.active == True)
            )
            coupon = coupon_res.scalars().first()
            if not coupon:
                raise ValueError(f"Coupon code '{order_in.coupon_code}' is invalid or inactive")
            if coupon.expiry_date < datetime.now(timezone.utc).replace(tzinfo=None):
                raise ValueError(f"Coupon code '{order_in.coupon_code}' has expired")
            
            coupon_id = coupon.id
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
            cashier_id=cashier_id,
            customer_id=order_in.customer_id,
            coupon_id=coupon_id,
            customer_name=order_in.customer_name,
            order_type=order_in.order_type,
            order_status="pending",
            payment_status="pending",
            subtotal=subtotal,
            tax=tax_amount,
            discount_amount=discount_amount,
            total=total_amount
        )
        db.add(db_order)
        await db.flush()  # Get db_order.id

        # 6. Process items (decrement stock & log inventory movements)
        for product, quantity, price, item_subtotal, recipe in validated_items:
            db_item = OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=price,
                subtotal=item_subtotal
            )
            db.add(db_item)
            
            # Decrement product stock
            product.stock_quantity -= quantity
            db.add(product)
            
            # Log product stock movement
            prod_log = InventoryLog(
                item_type="product",
                item_id=product.id,
                change_amount=float(-quantity),
                reason="sale",
                adjusted_by=cashier_id
            )
            db.add(prod_log)
            
            # Decrement recipe ingredients stock
            for recipe_item in recipe:
                ing_res = await db.execute(select(Ingredient).filter(Ingredient.id == recipe_item.ingredient_id))
                ingredient = ing_res.scalars().first()
                deducted_qty = recipe_item.quantity_required * quantity
                ingredient.stock_quantity -= deducted_qty
                db.add(ingredient)
                
                # Log ingredient stock movement
                ing_log = InventoryLog(
                    item_type="ingredient",
                    item_id=ingredient.id,
                    change_amount=-float(deducted_qty),
                    reason="sale",
                    adjusted_by=cashier_id
                )
                db.add(ing_log)

        # 7. Loyalty Points Calculation and Award
        if order_in.customer_id:
            cust_res = await db.execute(select(Customer).filter(Customer.id == order_in.customer_id))
            customer = cust_res.scalars().first()
            if customer:
                points_earned = int(float(total_amount) * settings.LOYALTY_POINT_REWARD_RATE)
                customer.loyalty_points += points_earned
                db.add(customer)

        await db.flush()
        
        # Load relationships fully for return schema
        order_with_details = await order_repository.get_with_details(db, db_order.id)
        return order_with_details

order_service = OrderService()
