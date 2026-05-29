import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    users_col = db["users"]
    count = await users_col.count_documents({})
    print(f"Total users in DB: {count}")
    async for u in users_col.find():
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Active: {u.get('is_active')}, Hash: {u.get('password_hash')}")

if __name__ == "__main__":
    asyncio.run(main())
