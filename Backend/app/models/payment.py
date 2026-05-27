from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    payment_method = Column(String, nullable=False)  # "cash", "card", "qr"
    amount_paid = Column(Numeric(10, 2), nullable=False)
    change_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    transaction_reference = Column(String, nullable=True)  # transaction id from terminal/QR
    payment_status = Column(String, default="completed", nullable=False)  # "pending", "completed", "failed"
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="payments")
