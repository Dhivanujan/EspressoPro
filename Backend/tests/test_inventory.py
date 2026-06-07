import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.product import Ingredient, Product

@pytest.mark.asyncio
async def test_inventory_adjustment_flow(client: AsyncClient, test_admin: User, test_cashier: User, db_session):
    # 1. Login as Admin
    admin_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Login as Cashier
    cashier_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    cashier_token = cashier_login.json()["access_token"]
    cashier_headers = {"Authorization": f"Bearer {cashier_token}"}

    # 3. Add an ingredient
    ing = Ingredient(
        name="Coffee Beans",
        stock_quantity=100.0,
        unit="g",
        low_stock_threshold=10.0
    )
    db_session.add(ing)
    await db_session.commit()
    await db_session.refresh(ing)

    # 4. Try adjusting as Cashier (should be 403 Forbidden)
    adjust_fail = await client.post(
        "/api/v1/inventory/adjust",
        json={
            "item_type": "ingredient",
            "item_id": str(ing.id),
            "change_amount": 50.0,
            "reason": "restock"
        },
        headers=cashier_headers
    )
    assert adjust_fail.status_code == 403

    # 5. Adjust as Admin (should succeed)
    adjust_ok = await client.post(
        "/api/v1/inventory/adjust",
        json={
            "item_type": "ingredient",
            "item_id": str(ing.id),
            "change_amount": 50.0,
            "reason": "restock"
        },
        headers=admin_headers
    )
    assert adjust_ok.status_code == 200
    res_data = adjust_ok.json()
    assert res_data["new_stock"] == 150.0

    # 6. Verify db quantity is updated
    updated_ing_doc = await db_session["ingredients"].find_one({"_id": ing._id})
    assert updated_ing_doc["stock_quantity"] == 150.0

    # 7. Check low stock alerts
    alerts_response = await client.get(
        "/api/v1/inventory/alerts",
        headers=admin_headers
    )
    assert alerts_response.status_code == 200
    
    # 8. Check logs
    logs_response = await client.get(
        "/api/v1/inventory/logs",
        headers=admin_headers
    )
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert len(logs) > 0
    assert logs[0]["reason"] == "restock"
    assert logs[0]["change_amount"] == 50.0
