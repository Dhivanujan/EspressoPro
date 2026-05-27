import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_cashier: User):
    """
    Test standard login with correct credentials.
    """
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "cashier"
    assert data["full_name"] == "Cashier Test"

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient, test_cashier: User):
    """
    Test login with incorrect password.
    """
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

@pytest.mark.asyncio
async def test_register_cashier_by_admin(client: AsyncClient, test_admin: User):
    """
    Test that an Admin can register a new cashier user.
    """
    # 1. Login as Admin
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Register cashier
    reg_data = {
        "username": "new_cashier",
        "full_name": "New Employee",
        "role": "cashier",
        "password": "secretpassword"
    }
    response = await client.post(
        "/api/v1/auth/register",
        json=reg_data,
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "new_cashier"
    assert data["role"] == "cashier"

@pytest.mark.asyncio
async def test_register_cashier_by_cashier_denied(client: AsyncClient, test_cashier: User):
    """
    Test that cashiers cannot register other users.
    """
    # 1. Login as Cashier
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Try to register a cashier
    reg_data = {
        "username": "unauthorized_cashier",
        "full_name": "Unauth Employee",
        "role": "cashier",
        "password": "secretpassword"
    }
    response = await client.post(
        "/api/v1/auth/register",
        json=reg_data,
        headers=headers
    )
    assert response.status_code == 403
    assert "sufficient permissions" in response.json()["detail"]
