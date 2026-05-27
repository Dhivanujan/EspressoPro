from app.database.base import Base

class ProductIngredient(Base):
    __tablename__ = "product_ingredients"

class Product(Base):
    __tablename__ = "products"

class Ingredient(Base):
    __tablename__ = "ingredients"
