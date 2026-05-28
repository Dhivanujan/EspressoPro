from bson import ObjectId
from decimal import Decimal

DECIMAL_FIELDS = {
    "price", "subtotal", "tax", "total", "discount",
    "discount_amount", "unit_price", "amount_paid",
    "change_amount", "discount_value"
}

class MockColumn:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return BinaryExpression(self, other, "eq")

    def __ne__(self, other):
        return BinaryExpression(self, other, "ne")

    def __lt__(self, other):
        return BinaryExpression(self, other, "lt")

    def __le__(self, other):
        return BinaryExpression(self, other, "le")

    def __gt__(self, other):
        return BinaryExpression(self, other, "gt")

    def __ge__(self, other):
        return BinaryExpression(self, other, "ge")

    def __repr__(self):
        return f"MockColumn({self.name})"

class BinaryExpression:
    def __init__(self, left, right, op):
        self.left = left
        self.right = right
        self.operator = op

    def __repr__(self):
        return f"BinaryExpression({self.left} {self.operator} {self.right})"

class BaseMeta(type):
    def __getattr__(cls, name):
        if name.startswith("__"):
            return super().__getattr__(name)
        return MockColumn(name)

class Base(metaclass=BaseMeta):
    def __init__(self, **kwargs):
        # Convert _id to string id
        if "_id" in kwargs:
            kwargs["id"] = str(kwargs["_id"])
        elif "id" in kwargs and kwargs["id"]:
            kwargs["id"] = str(kwargs["id"])
            
        for k, v in kwargs.items():
            if k in DECIMAL_FIELDS and v is not None:
                try:
                    v = Decimal(str(v)).quantize(Decimal('0.00'))
                except Exception:
                    pass
            setattr(self, k, v)

    def to_dict(self):
        d = {}
        for k, v in self.__dict__.items():
            # Filter out relationship attributes (subclasses of Base or lists of them)
            if isinstance(v, Base):
                continue
            if isinstance(v, list) and any(isinstance(x, Base) for x in v):
                continue
            if k in ("items", "customer", "coupon", "payments", "recipe_ingredients", "ingredient"):
                continue
            d[k] = v
            
        if "id" in d:
            val = d.pop("id")
            if val:
                try:
                    d["_id"] = ObjectId(val)
                except Exception:
                    d["_id"] = val
        return d
