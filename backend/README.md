# MedTrace Backend

## Run local

1. Copy `.env.example` to `.env`
2. `pip install -e .`
3. `alembic upgrade head`
4. `uvicorn app.main:app --reload`

## Run with Docker

1. Copy `.env.example` to `.env`
2. `docker compose up --build`
3. `docker compose exec api alembic upgrade head`
