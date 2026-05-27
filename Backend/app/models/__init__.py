from app.database.base import Base
from app.models.user import User
from app.models.category import Category
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.cart import Cart, CartItem
from app.models.customer import Customer
from app.models.coupon import Coupon
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.inventory import InventoryLog

# Make sure they are all registered on the Base
__all__ = [
    "Base",
    "User",
    "Category",
    "Product",
    "Ingredient",
    "ProductIngredient",
    "Cart",
    "CartItem",
    "Customer",
    "Coupon",
    "Order",
    "OrderItem",
    "Payment",
    "InventoryLog",
]
