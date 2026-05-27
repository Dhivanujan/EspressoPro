import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config.settings import settings
from app.database.base import Base
from app.models import (
    User, Category, Product, Ingredient, ProductIngredient,
    Customer, Coupon, Order, OrderItem, Payment, InventoryLog
)
from app.services.auth import auth_service

async def seed_data():
    print(f"Connecting to database: {settings.POSTGRES_DB}...")
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=True)
    
    # 1. Create tables
    async with engine.begin() as conn:
        print("Re-creating all database tables...")
        # Drop all tables first for a clean seed environment
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        print("Seeding initial POS data...")
        
        # 2. Seed Users
        admin_user = User(
            username="admin",
            password_hash=auth_service.get_password_hash("admin123"),
            full_name="Alex Shop Owner",
            role="admin",
            is_active=True
        )
        cashier_user = User(
            username="cashier",
            password_hash=auth_service.get_password_hash("cashier123"),
            full_name="John Cashier",
            role="cashier",
            is_active=True
        )
        db.add_all([admin_user, cashier_user])
        await db.flush()  # Gets User IDs

        # 3. Seed Categories
        cat_hot = Category(name="Hot Coffee", description="Warm, freshly brewed espresso beverages")
        cat_cold = Category(name="Cold Coffee", description="Chilled and blended coffee drinks")
        cat_tea = Category(name="Specialty Tea", description="Matcha, green, and herbal organic teas")
        cat_bakery = Category(name="Bakery & Desserts", description="Fresh croissants, muffins, and pastries")
        db.add_all([cat_hot, cat_cold, cat_tea, cat_bakery])
        await db.flush()

        # 4. Seed Raw Ingredients (Inventory)
        ing_beans = Ingredient(name="Espresso Beans", stock_quantity=5000.0, unit="g", low_stock_threshold=500.0)
        ing_milk = Ingredient(name="Whole Milk", stock_quantity=12000.0, unit="ml", low_stock_threshold=1500.0)
        ing_oat_milk = Ingredient(name="Oat Milk", stock_quantity=6000.0, unit="ml", low_stock_threshold=1000.0)
        ing_matcha = Ingredient(name="Uji Matcha Powder", stock_quantity=800.0, unit="g", low_stock_threshold=100.0)
        ing_caramel = Ingredient(name="Caramel Syrup", stock_quantity=2000.0, unit="ml", low_stock_threshold=300.0)
        db.add_all([ing_beans, ing_milk, ing_oat_milk, ing_matcha, ing_caramel])
        await db.flush()

        # 5. Seed Products
        prod_espresso = Product(
            category_id=cat_hot.id,
            name="Classic Espresso",
            description="Pure, rich double shot of espresso",
            price=Decimal("3.00"),
            stock_quantity=500,
            low_stock_threshold=20,
            availability_status=True
        )
        prod_cappuccino = Product(
            category_id=cat_hot.id,
            name="Cappuccino",
            description="Espresso balanced with steamed milk and deep layer of foam",
            price=Decimal("4.50"),
            stock_quantity=300,
            low_stock_threshold=15,
            availability_status=True
        )
        prod_latte = Product(
            category_id=cat_hot.id,
            name="Caffe Latte",
            description="Double shot of espresso topped with silky microfoam",
            price=Decimal("4.75"),
            stock_quantity=300,
            low_stock_threshold=15,
            availability_status=True
        )
        prod_iced_latte = Product(
            category_id=cat_cold.id,
            name="Iced Caffe Latte",
            description="Chilled double shot of espresso over milk and ice",
            price=Decimal("4.95"),
            stock_quantity=250,
            low_stock_threshold=15,
            availability_status=True
        )
        prod_caramel_macchiato = Product(
            category_id=cat_cold.id,
            name="Iced Caramel Macchiato",
            description="Espresso with vanilla syrup, chilled milk, and caramel drizzle",
            price=Decimal("5.50"),
            stock_quantity=200,
            low_stock_threshold=10,
            availability_status=True
        )
        prod_matcha = Product(
            category_id=cat_tea.id,
            name="Iced Matcha Latte",
            description="Premium Japanese matcha whisked with cold milk over ice",
            price=Decimal("5.25"),
            stock_quantity=150,
            low_stock_threshold=10,
            availability_status=True
        )
        prod_croissant = Product(
            category_id=cat_bakery.id,
            name="Butter Croissant",
            description="Flaky, buttery French croissant baked fresh daily",
            price=Decimal("3.50"),
            stock_quantity=30,  # Bakery has low physical inventory
            low_stock_threshold=5,
            availability_status=True
        )
        prod_muffin = Product(
            category_id=cat_bakery.id,
            name="Blueberry Muffin",
            description="Moist bakery muffin bursting with wild blueberries",
            price=Decimal("3.25"),
            stock_quantity=20,
            low_stock_threshold=5,
            availability_status=True
        )
        db.add_all([
            prod_espresso, prod_cappuccino, prod_latte, prod_iced_latte,
            prod_caramel_macchiato, prod_matcha, prod_croissant, prod_muffin
        ])
        await db.flush()

        # 6. Seed Product Recipes (ProductIngredient mappings)
        recipes = [
            ProductIngredient(product_id=prod_espresso.id, ingredient_id=ing_beans.id, quantity_required=18.0),
            
            ProductIngredient(product_id=prod_cappuccino.id, ingredient_id=ing_beans.id, quantity_required=18.0),
            ProductIngredient(product_id=prod_cappuccino.id, ingredient_id=ing_milk.id, quantity_required=150.0),
            
            ProductIngredient(product_id=prod_latte.id, ingredient_id=ing_beans.id, quantity_required=18.0),
            ProductIngredient(product_id=prod_latte.id, ingredient_id=ing_milk.id, quantity_required=200.0),
            
            ProductIngredient(product_id=prod_iced_latte.id, ingredient_id=ing_beans.id, quantity_required=18.0),
            ProductIngredient(product_id=prod_iced_latte.id, ingredient_id=ing_milk.id, quantity_required=220.0),
            
            ProductIngredient(product_id=prod_caramel_macchiato.id, ingredient_id=ing_beans.id, quantity_required=18.0),
            ProductIngredient(product_id=prod_caramel_macchiato.id, ingredient_id=ing_milk.id, quantity_required=200.0),
            ProductIngredient(product_id=prod_caramel_macchiato.id, ingredient_id=ing_caramel.id, quantity_required=15.0),
            
            ProductIngredient(product_id=prod_matcha.id, ingredient_id=ing_matcha.id, quantity_required=5.0),
            ProductIngredient(product_id=prod_matcha.id, ingredient_id=ing_milk.id, quantity_required=250.0),
        ]
        db.add_all(recipes)

        # 7. Seed Coupons
        cp1 = Coupon(
            code="WELCOME10",
            discount_type="percentage",
            discount_value=Decimal("10.00"),
            active=True,
            expiry_date=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=365)
        )
        cp2 = Coupon(
            code="COFFEE5",
            discount_type="fixed",
            discount_value=Decimal("5.00"),
            active=True,
            expiry_date=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=365)
        )
        db.add_all([cp1, cp2])

        # 8. Seed Loyalty Customers
        cust_alice = Customer(name="Alice Smith", phone="+15550199", loyalty_points=180)
        cust_bob = Customer(name="Bob Jones", phone="+15550288", loyalty_points=45)
        db.add_all([cust_alice, cust_bob])
        await db.flush()

        # 9. Seed 7 Days of Completed Orders (Historical Sales Analytics)
        print("Generating historical sales logs...")
        cashier_id = cashier_user.id
        products_list = [
            prod_espresso, prod_cappuccino, prod_latte, prod_iced_latte,
            prod_caramel_macchiato, prod_matcha, prod_croissant, prod_muffin
        ]
        
        # We will seed around 15-30 orders per day for the last 7 days
        for day in range(7):
            order_date = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=6 - day)
            # Create a range of orders per day
            num_orders = random.randint(15, 25)
            for seq in range(1, num_orders + 1):
                # Pick a random client or guest
                customer_id = None
                customer_name = "Guest Client"
                if random.random() < 0.35:
                    customer = random.choice([cust_alice, cust_bob])
                    customer_id = customer.id
                    customer_name = customer.name
                
                # Pick 1 to 4 products
                items_count = random.randint(1, 4)
                order_products = random.sample(products_list, items_count)
                
                subtotal = Decimal("0.00")
                order_items_list = []
                for p in order_products:
                    qty = random.randint(1, 3)
                    item_sub = p.price * qty
                    subtotal += item_sub
                    order_items_list.append((p, qty, item_sub))
                
                # Dynamic coupon application occasionally
                discount_amount = Decimal("0.00")
                coupon_id = None
                if random.random() < 0.15:
                    coupon = random.choice([cp1, cp2])
                    coupon_id = coupon.id
                    if coupon.discount_type == "percentage":
                        discount_amount = subtotal * (coupon.discount_value / Decimal("100.00"))
                    else:
                        discount_amount = coupon.discount_value
                    if discount_amount > subtotal:
                        discount_amount = subtotal
                
                tax = (subtotal - discount_amount) * Decimal(str(settings.TAX_RATE))
                total = (subtotal - discount_amount) + tax
                
                # Format to decimal scales
                subtotal = subtotal.quantize(Decimal("0.01"))
                discount_amount = discount_amount.quantize(Decimal("0.01"))
                tax = tax.quantize(Decimal("0.01"))
                total = total.quantize(Decimal("0.01"))
                
                # Order Number format
                order_number = f"COFFEE-{order_date.strftime('%Y%m%d')}-{seq:04d}"
                
                db_order = Order(
                    order_number=order_number,
                    cashier_id=cashier_id,
                    customer_id=customer_id,
                    coupon_id=coupon_id,
                    customer_name=customer_name,
                    order_type=random.choice(["dine_in", "takeaway"]),
                    order_status="completed",
                    payment_status="paid",
                    subtotal=subtotal,
                    tax=tax,
                    discount_amount=discount_amount,
                    total=total,
                    created_at=order_date,
                    updated_at=order_date
                )
                db.add(db_order)
                await db.flush()  # Gets db_order.id
                
                # Add order items
                for p, qty, item_sub in order_items_list:
                    db_item = OrderItem(
                        order_id=db_order.id,
                        product_id=p.id,
                        quantity=qty,
                        unit_price=p.price,
                        subtotal=item_sub
                    )
                    db.add(db_item)
                
                # Create payment
                payment_method = random.choice(["cash", "card", "qr"])
                change_amount = Decimal("0.00")
                amount_paid = total
                if payment_method == "cash":
                    # Pay with some bills
                    bill = float(total)
                    if bill < 5.0: bill = 5.0
                    elif bill < 10.0: bill = 10.0
                    elif bill < 20.0: bill = 20.0
                    elif bill < 50.0: bill = 50.0
                    amount_paid = Decimal(str(bill)).quantize(Decimal("0.01"))
                    change_amount = amount_paid - total
                    
                db_payment = Payment(
                    order_id=db_order.id,
                    payment_method=payment_method,
                    amount_paid=amount_paid,
                    change_amount=change_amount,
                    transaction_reference=f"TXN-{random.randint(100000, 999999)}",
                    payment_status="completed",
                    created_at=order_date
                )
                db.add(db_payment)
                
        await db.commit()
        print("Database tables initialized and populated successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
