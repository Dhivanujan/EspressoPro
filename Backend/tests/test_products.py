import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_category_and_product_flow(client: AsyncClient, test_admin: User, test_cashier: User):
    """
    Test creating a category and adding a product under Admin, then retrieving it under Cashier.
    """
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

    # 3. Create Category (Admin only)
    cat_response = await client.post(
        "/api/v1/categories",
        json={"name": "Espresso Bar", "description": "Classic espresso items"},
        headers=admin_headers
    )
    assert cat_response.status_code == 201
    cat_id = cat_response.json()["id"]

    # 4. Create Product (Admin only)
    prod_data = {
        "category_id": cat_id,
        "name": "Flat White",
        "description": "Double espresso with textured milk",
        "price": 4.50,
        "stock_quantity": 100,
        "low_stock_threshold": 10,
        "availability_status": True
    }
    prod_response = await client.post(
        "/api/v1/products",
        json=prod_data,
        headers=admin_headers
    )
    assert prod_response.status_code == 201
    prod_id = prod_response.json()["id"]

    # 5. List Products (Cashier can view)
    list_response = await client.get(
        "/api/v1/products",
        params={"category_id": cat_id},
        headers=cashier_headers
    )
    assert list_response.status_code == 200
    products = list_response.json()
    assert len(products) == 1
    assert products[0]["name"] == "Flat White"
    assert products[0]["price"] == "4.50"

    # 6. Attempt Delete Product as Cashier (should be Denied)
    delete_response = await client.delete(
        f"/api/v1/products/{prod_id}",
        headers=cashier_headers
    )
    assert delete_response.status_code == 403

    # 7. Delete Product as Admin (should succeed)
    admin_delete_response = await client.delete(
        f"/api/v1/products/{prod_id}",
        headers=admin_headers
    )
    assert admin_delete_response.status_code == 200


@pytest.mark.asyncio
async def test_product_image_upload(client: AsyncClient, test_admin: User):
    """
    Test uploading a product image (Admin only).
    """
    # 1. Login as Admin
    admin_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "adminpass"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Upload image (valid GIF structure)
    gif_bytes = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    files = {"file": ("test.gif", gif_bytes, "image/gif")}
    response = await client.post(
        "/api/v1/products/upload-image",
        files=files,
        headers=admin_headers
    )
    assert response.status_code == 201
    res_data = response.json()
    assert "url" in res_data
    assert "provider" in res_data

