# MedTrace

Frontend en Next.js + backend en FastAPI para trazabilidad de medicamentos.

## Estructura

- `./` -> Frontend (Next.js)
- `./backend` -> API (FastAPI + PostgreSQL + Alembic)

## Requisitos

- Node.js 20+
- pnpm
- Docker Desktop (recomendado para backend)

## 1) Levantar frontend

Desde la raíz del repo:

```bash
pnpm install
pnpm dev
```

Frontend disponible en:

- `http://localhost:3000`

## 2) Levantar backend (Docker)

Desde `backend/`:

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api alembic current
```

Backend disponible en:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/api/v1/health`

PostgreSQL expuesto en host:

- `localhost:5433` (internamente container usa `5432`)

## 3) Credenciales de prueba backend

Usuario seed:

- email: `lopez@hospital.com.ar`
- password: `admin123`

Login endpoint:

- `POST /api/v1/auth/login`

## 4) Variables de entorno backend

Archivo: `backend/.env`

Valores base:

```env
APP_NAME=MedTrace API
APP_ENV=dev
API_V1_PREFIX=/api/v1
SECRET_KEY=change_this_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/medtrace
CORS_ORIGINS=http://localhost:3000
```

## 5) Comandos útiles backend

Desde `backend/`:

```bash
docker compose ps
docker compose logs api --tail 100
docker compose exec api alembic current
docker compose exec db psql -U postgres -d medtrace
docker compose down
```

## 6) Subir cambios a GitHub

```bash
git add .
git commit -m "mensaje"
git push
```

## Troubleshooting rápido

- Si `5432` está ocupado en tu máquina:
  en este proyecto PostgreSQL ya está mapeado a `5433`.
- Si API no responde:
  revisar logs con `docker compose logs api --tail 200`.
- Si `/docs` abre pero endpoints fallan:
  confirmar que el contenedor `db` esté en `Up` con `docker compose ps`.
