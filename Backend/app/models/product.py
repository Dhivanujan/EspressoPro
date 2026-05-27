from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True)
    quantity_required = Column(Float, nullable=False)  # Quantity of ingredient needed per 1 unit of product

    # Relationships
    product = relationship("Product", back_populates="recipe_ingredients")
    ingredient = relationship("Ingredient", back_populates="product_usages")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    image_url = Column(String, nullable=True)
    availability_status = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="products")
    recipe_ingredients = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    stock_quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String, nullable=False)  # 'g', 'ml', 'pcs', etc.
    low_stock_threshold = Column(Float, default=100.0, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    product_usages = relationship("ProductIngredient", back_populates="ingredient", cascade="all, delete-orphan")
