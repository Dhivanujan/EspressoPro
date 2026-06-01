# EspressoPro — POS System

EspressoPro is a point-of-sale (POS) application tailored for coffee shops and small cafés. It provides order and billing, inventory management, customer records, payment processing, and analytics through a Next.js frontend and FastAPI backend.

## Quick links

- Frontend: [Frontend](Frontend)
- Backend: [Backend](Backend)

## What you'll find here

- A modern Next.js + Tailwind CSS frontend
- A FastAPI backend with MongoDB (Motor) and Pydantic
- Docker and docker-compose for local development
- Tests for backend features using pytest

---

## Prerequisites

- Git
- Python 3.10+ (recommended) or a compatible virtual environment
- Node.js 16+ and npm/yarn
- MongoDB 6+ (local or Docker)
- Docker & Docker Compose (recommended for easiest local setup)

---

## Backend — Local (venv) setup

1. Open a terminal in the `Backend` folder:

```powershell
cd "E:\\POS System\\Backend"
```

2. Create and activate a virtual environment (Windows example):

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Copy or create environment variables (example `.env` or set them in your shell):

- `MONGODB_URL` — Mongo connection string (e.g. `mongodb://localhost:27017`)
- `MONGODB_DB` — database name (e.g. `coffeeshop_pos`)
- `JWT_SECRET_KEY` — JWT / app secret

5. Seed sample data (optional but recommended for a working demo):

```powershell
python seed.py
```

6. Start the backend for development:

```powershell
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs`.

### Seeded login credentials

- Admin: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`

---

## Frontend — Local setup

1. Open a terminal in the `Frontend` folder:

```powershell
cd "E:\\POS System\\Frontend"
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn
```

3. Configure environment variables (if required). Example values can be provided in `.env.local` in the Next.js app.

4. Start the development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

The frontend will run at `http://localhost:3000` by default.

---

## Docker (recommended)

Start both backend and frontend (if configured) with the provided `docker-compose.yml` in `Backend`:

```powershell
cd "E:\\POS System\\Backend"
docker-compose up --build
```

This will create the required services (backend, database, etc.) as defined in the compose file. The backend expects MongoDB via `MONGODB_URL`; update the compose file if you want MongoDB running in Docker.

---

## Running tests

Backend tests use `pytest`. From the `Backend` folder:

```powershell
cd "E:\\POS System\\Backend"
pytest
```

---

## Project structure (high level)

- `Backend/` — FastAPI application
  - `app/main.py` — application entrypoint
  - `app/routers/` — API routes
  - `app/models/`, `app/schemas/`, `app/services/`, `app/repositories/`
- `Frontend/` — Next.js application

See the folders for more details.

---

## Contributing

- Fork the repository and create a feature branch
- Run tests and linters before submitting a PR
- Keep changes small and focused; add docs for new features

If you want me to update docs, add CI, or create a contributor guide, tell me and I can add it.

---

## License & Contact

Specify the project's license here (e.g., MIT). For questions or help, open an issue or contact the maintainers.
