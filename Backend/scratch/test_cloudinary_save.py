import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Login
        login_res = await client.post(
            "http://localhost:8000/api/v1/auth/login",
            data={"username": "admin", "password": "admin123"}
        )
        print("Login status:", login_res.status_code)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create product with Cloudinary image URL
        payload = {
            "name": "Cloudinary Test Product 2",
            "price": 5.99,
            "category_id": "",
            "image_url": "https://res.cloudinary.com/dvcnhmd2z/image/upload/v1620000000/sample.jpg",
            "stock_quantity": 100,
            "low_stock_threshold": 10,
            "availability_status": True,
            "recipe": []
        }
        res = await client.post(
            "http://localhost:8000/api/v1/products",
            json=payload,
            headers=headers
        )
        print("Product creation status:", res.status_code)
        print("Response:", res.text)

if __name__ == "__main__":
    asyncio.run(main())
