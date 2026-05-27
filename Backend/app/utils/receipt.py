from datetime import datetime, timezone
from app.config.settings import settings
from app.models.order import Order

class ReceiptGenerator:
    @staticmethod
    def generate_receipt_data(order: Order, payment_method: str, amount_paid: float, change_amount: float) -> dict:
        items = []
        for item in order.items:
            items.append(
                {
                    "name": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "subtotal": float(item.subtotal)
                }
            )
        
        return {
            "shop_name": settings.SHOP_NAME,
            "order_number": order.order_number,
            "items": items,
            "subtotal": float(order.subtotal),
            "tax": float(order.tax),
            "discount": float(order.discount_amount),
            "total": float(order.total),
            "payment_method": payment_method,
            "amount_paid": float(amount_paid),
            "change_amount": float(change_amount),
            "timestamp": datetime.now(timezone.utc).replace(tzinfo=None)
        }

receipt_generator = ReceiptGenerator()
