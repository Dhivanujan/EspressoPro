import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def main():
    print(f"Connecting to MongoDB database: {settings.MONGODB_DB}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    
    # 1. Update Loyalty Config Document
    print("Updating loyalty_config collection to Sri Lankan LKR trends...")
    config_update = {
        "currency_per_point": 100.0,
        "redemption_value_per_point": 1.0,
        "tier_multipliers": {"Bronze": 1.0, "Silver": 1.1, "Gold": 1.25, "Platinum": 1.5},
        "tier_thresholds": {"Bronze": 0.0, "Silver": 5000.0, "Gold": 15000.0, "Platinum": 40000.0},
        "points_expiry_days": 365
    }
    
    # Try updating the first document or insert if none exists
    res = await db["loyalty_config"].update_one({}, {"$set": config_update}, upsert=True)
    print(f"Loyalty Config updated. Matched: {res.matched_count}, Upserted ID: {res.upserted_id}")
    
    # 2. Update existing seeded customers to Sri Lankan numbers
    print("Updating seeded customer phone numbers to Sri Lankan format...")
    # Update Alice Smith (+15550199) -> +94771234567
    alice_res = await db["customers"].update_one(
        {"name": "Alice Smith"},
        {"$set": {"phone": "+94771234567"}}
    )
    print(f"Alice Smith phone updated. Matched: {alice_res.matched_count}, Modified: {alice_res.modified_count}")
    
    # Update Bob Jones (+15550288) -> +94777654321
    bob_res = await db["customers"].update_one(
        {"name": "Bob Jones"},
        {"$set": {"phone": "+94777654321"}}
    )
    print(f"Bob Jones phone updated. Matched: {bob_res.matched_count}, Modified: {bob_res.modified_count}")
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
