from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.middleware.errors import setup_exception_handlers
from app.routers import (
    auth_router,
    categories_router,
    products_router,
    carts_router,
    orders_router,
    payments_router,
    inventory_router,
    analytics_router,
    customers_router,
    coupons_router,
    ws_router,
    loyalty_router
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready POS Backend for Coffee Shops",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Setup Exception Handlers
setup_exception_handlers(app)

# 3. Include Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(carts_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(coupons_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")
app.include_router(loyalty_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
