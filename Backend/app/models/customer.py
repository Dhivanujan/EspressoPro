from app.database.base import Base
from decimal import Decimal

class Customer(Base):
    __tablename__ = "customers"

    def __init__(self, **kwargs):
        if "loyalty_points" not in kwargs or kwargs["loyalty_points"] is None:
            kwargs["loyalty_points"] = 0
        if "lifetime_spending" not in kwargs or kwargs["lifetime_spending"] is None:
            kwargs["lifetime_spending"] = Decimal("0.00")
        if "lifetime_points" not in kwargs or kwargs["lifetime_points"] is None:
            kwargs["lifetime_points"] = 0
        if "tier" not in kwargs or kwargs["tier"] is None:
            kwargs["tier"] = "Bronze"
        if "visit_count" not in kwargs or kwargs["visit_count"] is None:
            kwargs["visit_count"] = 0
        if "last_visit_at" not in kwargs:
            kwargs["last_visit_at"] = None
        if "points_expiry_date" not in kwargs:
            kwargs["points_expiry_date"] = None
        super().__init__(**kwargs)
