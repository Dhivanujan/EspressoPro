from app.database.base import Base

class Order(Base):
    __tablename__ = "orders"

class OrderItem(Base):
    __tablename__ = "order_items"
