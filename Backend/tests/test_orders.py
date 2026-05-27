import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

@pytest.mark.asyncio
async def test_order_checkout_and_cancellation_cycle(
    client: AsyncClient,
    db_session: AsyncSession,
    test_admin: User,
    test_cashier: User
):
    """
    Complete end-to-end checkout integration test.
    Tests stock deduction, loyalty point calculations, payments, and order cancellations.
    """
    # 1. Login Cashier
    cashier_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    headers = {"Authorization": f"Bearer {cashier_login.json()['access_token']}"}

    # 2. Seed a Product & Customer
    prod = Product(
        name="Mocha Latte",
        price=5.00,
        stock_quantity=10,
        low_stock_threshold=2,
        availability_status=True
    )
    cust = Customer(name="David Miller", phone="+1999999", loyalty_points=0)
    db_session.add_all([prod, cust])
    await db_session.commit()
    await db_session.refresh(prod)
    await db_session.refresh(cust)

    # 3. Create Order
    order_payload = {
        "customer_id": cust.id,
        "customer_name": cust.name,
        "order_type": "dine_in",
        "items": [
            {"product_id": prod.id, "quantity": 2}
        ]
    }
    order_response = await client.post(
        "/api/v1/orders",
        json=order_payload,
        headers=headers
    )
    assert order_response.status_code == 201
    order_data = order_response.json()
    assert order_data["subtotal"] == "10.00"
    assert order_data["total"] == "11.00"  # 10% tax rate added
    assert order_data["payment_status"] == "pending"
    assert order_data["order_status"] == "pending"

    # 4. Check Stock Deducted
    refreshed_prod = await db_session.get(Product, prod.id)
    assert refreshed_prod.stock_quantity == 8  # Started at 10, subtracted 2

    # 5. Check Loyalty points awarded
    refreshed_cust = await db_session.get(Customer, cust.id)
    # 10% of 11.00 = 1 point rewarded
    assert refreshed_cust.loyalty_points == 1

    # 6. Process Payment
    payment_payload = {
        "payment_method": "cash",
        "amount_paid": 20.00
    }
    pay_response = await client.post(
        f"/api/v1/payments/{order_data['id']}",
        json=payment_payload,
        headers=headers
    )
    assert pay_response.status_code == 201
    pay_data = pay_response.json()
    assert pay_data["amount_paid"] == "20.00"
    assert pay_data["change_amount"] == "9.00"  # 20.00 - 11.00 = 9.00
    assert pay_data["payment_status"] == "completed"

    # Check order is paid
    order_check = await client.get(f"/api/v1/orders/{order_data['id']}", headers=headers)
    assert order_check.json()["payment_status"] == "paid"
    assert order_check.json()["order_status"] == "preparing"

    # 7. Cancel Order (Admin or Cashier cancels - restores stock & loyalty)
    cancel_response = await client.post(
        f"/api/v1/orders/{order_data['id']}/cancel",
        headers=headers
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["order_status"] == "cancelled"

    # Verify stock restored
    await db_session.refresh(prod)
    assert prod.stock_quantity == 10  # Back to original level of 10!

    # Verify loyalty reverted
    await db_session.refresh(cust)
    assert cust.loyalty_points == 0  # Reverted back to 0!
