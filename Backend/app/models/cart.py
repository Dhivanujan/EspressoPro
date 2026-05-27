from app.database.base import Base

class Cart(Base):
    __tablename__ = "carts"

class CartItem(Base):
    __tablename__ = "cart_items"
