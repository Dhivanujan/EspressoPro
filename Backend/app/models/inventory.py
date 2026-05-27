from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(Integer, primary_key=True, index=True)
    item_type = Column(String, nullable=False)  # "product" or "ingredient"
    item_id = Column(Integer, nullable=False)     # References product_id or ingredient_id
    change_amount = Column(Float, nullable=False)  # e.g., -1.0, +50.0
    reason = Column(String, nullable=False)        # "sale", "restock", "wastage", "adjustment"
    adjusted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")
