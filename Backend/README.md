# Coffee Shop POS System - Production-Ready Backend

This is a production-ready, highly modular, and secure asynchronous backend for a modern **Coffee Shop Point of Sale (POS) system** built using **Python FastAPI**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL**.

The backend implements **Clean Architecture** patterns, ensuring separation of concerns across database schemas, business services, repositories, and API routers.

---

## Technical Stack
* **Backend Framework:** FastAPI (asynchronous endpoints)
* **Database:** PostgreSQL (production) / SQLite (in-memory for test suite execution)
* **ORM:** SQLAlchemy 2.0 (with full async engine/session support)
* **Migrations:** Alembic
* **Authentication:** JWT (JSON Web Tokens) with cryptographically secure password hashing (Bcrypt)
* **Validation:** Pydantic v2
* **Containerization:** Docker & Docker Compose
* **Real-time Notifications:** WebSockets (for instant order status updates)
* **Testing:** Pytest with AsyncIO support

---

## Folder Structure
```
app/
├── main.py                  # Entrypoint, mounts CORS, middleware, and routers
├── config/
│   └── settings.py          # Environment configuration (Pydantic BaseSettings)
├── database/
│   ├── session.py           # Async engines, connection pools, and get_db session dependency
│   └── base.py              # Declarative Base for mapping models
├── models/
│   ├── user.py              # Cashiers & Admins with role-based checks
│   ├── category.py          # Hot Coffee, Cold Coffee, Bakery, etc.
│   ├── product.py           # Products, ingredients inventory, and recipe mappings
│   ├── cart.py              # Temporary database-backed cash register shopping carts
│   ├── customer.py          # Customers & Loyalty point rewards tracker
│   ├── coupon.py            # Coupon codes (fixed or percentage-based)
│   ├── order.py             # Order headers and OrderItem checkout lists
│   ├── payment.py           # Payment receipts (Cash, Card, QR)
│   └── inventory.py         # Inventory movements log (sales, restocks, wastage logs)
├── schemas/
│   └── ...                  # Pydantic validation models matching models
├── repositories/
│   ├── base.py              # Asynchronous generic CRUD pattern
│   └── ...                  # Repository subclasses (optimised joins/selectinload)
├── services/
│   ├── auth.py              # JWT token claims and password hashing
│   ├── order_service.py     # Transactional checkout, recipes, stock deductions, loyalty rewards
│   ├── inventory_service.py # Low stock scanning alerts and adjustments
│   └── analytics_service.py # Revenue aggregates, sales trends, and top selling products
├── routers/
│   ├── auth.py              # User signup, login, profile checks
│   ├── orders.py            # Cart checkouts, cancellations, status controls
│   ├── websockets.py        # Real-time WebSocket broadcasts
│   └── ...                  # Carts, Products, Categories, Loyalty, and Coupons
├── middleware/
│   └── errors.py            # Global exception handling mapping errors to JSON
└── utils/
    ├── deps.py              # Authentication dependencies & role restrictions
    └── receipt.py           # JSON Receipt formatting tool
```

---

## Getting Started (Local Setup)

### Prerequisites
* Python 3.10+
* PostgreSQL database instance running locally or via Docker

### 1. Clone & Set Up Virtual Environment
Navigate to the `Backend` directory and initialize a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On macOS/Linux
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables
Create a `.env` file (based on `.env.example`) and edit details:
```bash
copy .env.example .env
```

### 4. Create Database Tables & Seed Mock Data
You can run our fully-featured database seeder which deletes existing tables, creates all relations, registers cashier accounts, seeds products, maps recipes, and inserts historical sales:
```bash
python seed.py
```

### 5. Start the Development Server
```bash
python app/main.py
```
Or run via uvicorn directly:
```bash
uvicorn app.main:app --reload
```
Once started, open:
* **Swagger/OpenAPI docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (Use the `Authorize` button to log in with seeded accounts)
* **ReDoc documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Running with Docker Compose

To deploy the entire environment (FastAPI backend containerized and an isolated PostgreSQL 15 database) with a single command:
```bash
docker-compose up --build -d
```
The FastAPI web server is equipped with a `depends_on` check that waits until PostgreSQL health checks pass before booting.

Once running:
* **Web Server API:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Database Host:** `localhost:5432`

To shut down and prune volumes:
```bash
docker-compose down -v
```

---

## Seeded Login Credentials
* **Admin Role (Full CRUD, stock adjusts, dashboard graphs):**
  * **Username:** `admin`
  * **Password:** `admin123`
* **Cashier Role (Order creation, cart actions, lookup clients):**
  * **Username:** `cashier`
  * **Password:** `cashier123`

---

## Real-time Order Updates (WebSockets)
Listen to order event channels by connecting to the WebSocket route:
`ws://localhost:8000/api/v1/ws/orders`

Broadcast notifications are emitted when:
1. An order is created (`order_created`)
2. Preparation status is changed (`order_status_updated`)
3. An order is cancelled (`order_cancelled`)

---

## Running Automated Tests
The test suite utilizes `pytest` with `pytest-asyncio` against a temporary database instance (or SQLite in-memory). To execute tests:
```bash
pytest
```
