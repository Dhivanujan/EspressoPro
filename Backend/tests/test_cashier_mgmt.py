import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_list_users_as_admin(client: AsyncClient, test_admin: User, test_cashier: User):
    """
    Test that an admin can list all registered users.
    """
    # 1. Login as Admin
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get users list
    response = await client.get("/api/v1/auth/users", headers=headers)
    assert response.status_code == 200
    users_list = response.json()
    assert len(users_list) >= 2
    
    usernames = [u["username"] for u in users_list]
    assert "admin_test" in usernames
    assert "cashier_test" in usernames

@pytest.mark.asyncio
async def test_list_users_as_cashier_denied(client: AsyncClient, test_cashier: User):
    """
    Test that a cashier is denied access to list users.
    """
    # 1. Login as Cashier
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get users list (should fail)
    response = await client.get("/api/v1/auth/users", headers=headers)
    assert response.status_code == 403
    assert "sufficient permissions" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_user_details(client: AsyncClient, test_admin: User, test_cashier: User):
    """
    Test that an admin can update user parameters (name, role, password).
    """
    # 1. Login as Admin
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    admin_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Update cashier's name and change password
    update_data = {
        "full_name": "Updated Cashier Name",
        "role": "cashier",
        "is_active": True,
        "password": "newpassword123"
    }
    response = await client.put(
        f"/api/v1/auth/users/{test_cashier.id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Updated Cashier Name"
    assert updated_user["role"] == "cashier"

    # 3. Log in with the cashier's updated credentials
    cashier_login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "newpassword123"}
    )
    assert cashier_login_response.status_code == 200
    assert cashier_login_response.json()["full_name"] == "Updated Cashier Name"

@pytest.mark.asyncio
async def test_deactivate_user_prevents_login(client: AsyncClient, test_admin: User, test_cashier: User):
    """
    Test that deactivating a cashier prevents them from logging in.
    """
    # 1. Login as Admin
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    admin_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Deactivate cashier
    update_data = {
        "full_name": "Cashier Test",
        "role": "cashier",
        "is_active": False
    }
    response = await client.put(
        f"/api/v1/auth/users/{test_cashier.id}",
        json=update_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # 3. Attempt login with cashier credentials (should fail)
    cashier_login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "cashier_test", "password": "cashierpass"}
    )
    assert cashier_login_response.status_code == 400
    assert "deactivated" in cashier_login_response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_user_by_admin(client: AsyncClient, test_admin: User, test_cashier: User):
    """
    Test deleting a cashier, and check that self-deletion is blocked.
    """
    # 1. Login as Admin
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    admin_token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Try deleting self (admin should fail)
    self_delete_response = await client.delete(
        f"/api/v1/auth/users/{test_admin.id}",
        headers=headers
    )
    assert self_delete_response.status_code == 400
    assert "delete themselves" in self_delete_response.json()["detail"]

    # 3. Delete cashier (should succeed)
    delete_response = await client.delete(
        f"/api/v1/auth/users/{test_cashier.id}",
        headers=headers
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["username"] == "cashier_test"

    # 4. Check cashier is deleted from list
    list_response = await client.get("/api/v1/auth/users", headers=headers)
    assert list_response.status_code == 200
    usernames = [u["username"] for u in list_response.json()]
    assert "cashier_test" not in usernames
