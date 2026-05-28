from pydantic import BaseModel
from decimal import Decimal
import json

class M(BaseModel):
    price: Decimal

print("Decimal('4.5') ->", repr(M(price=Decimal('4.5')).model_dump()))
print("Decimal('4.5') JSON ->", M(price=Decimal('4.5')).model_dump_json())
print("Decimal('4.50') JSON ->", M(price=Decimal('4.50')).model_dump_json())
