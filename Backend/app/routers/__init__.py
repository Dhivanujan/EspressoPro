from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router
from app.routers.products import router as products_router
from app.routers.carts import router as carts_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router
from app.routers.inventory import router as inventory_router
from app.routers.analytics import router as analytics_router
from app.routers.customers import router as customers_router
from app.routers.coupons import router as coupons_router
from app.routers.websockets import router as ws_router

__all__ = [
    "auth_router",
    "categories_router",
    "products_router",
    "carts_router",
    "orders_router",
    "payments_router",
    "inventory_router",
    "analytics_router",
    "customers_router",
    "coupons_router",
    "ws_router"
]
