import asyncio
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.database.session import get_db, MotorDatabaseWrapper
from app.services.auth import auth_service
from app.models.user import User

TEST_MONGODB_URL = "mongodb://localhost:27017"
TEST_MONGODB_DB = "coffeeshop_pos_test"

@pytest_asyncio.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[MotorDatabaseWrapper, None]:
    client = AsyncIOMotorClient(TEST_MONGODB_URL)
    raw_database = client[TEST_MONGODB_DB]
    
    # 1. Clear all test collections first for a clean environment
    collections = [
        "users", "categories", "ingredients", "products", "product_ingredients",
        "coupons", "customers", "orders", "order_items", "payments", "inventory_logs"
    ]
    for col in collections:
        await raw_database[col].drop()
        
    db = MotorDatabaseWrapper(raw_database)
    yield db
    
    # Clean up after test
    for col in collections:
        await raw_database[col].drop()
    client.close()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: MotorDatabaseWrapper) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session
            
    app.dependency_overrides[get_db] = override_get_db
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def test_admin(db_session: MotorDatabaseWrapper) -> User:
    admin = User(
        username="admin_test",
        password_hash=auth_service.get_password_hash("adminpass"),
        full_name="Admin Test",
        role="admin",
        is_active=True
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin

@pytest_asyncio.fixture(scope="function")
async def test_cashier(db_session: MotorDatabaseWrapper) -> User:
    cashier = User(
        username="cashier_test",
        password_hash=auth_service.get_password_hash("cashierpass"),
        full_name="Cashier Test",
        role="cashier",
        is_active=True
    )
    db_session.add(cashier)
    await db_session.commit()
    await db_session.refresh(cashier)
    return cashier
