from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.base import Base
from app.core.database import engine
from app import models  # noqa: F401
from app.services.auth_service import AuthService
from app.services.seed_service import seed_catalog_data

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # This keeps local dev and tests simple. Production should run Alembic migrations.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        AuthService(db).seed_default_user()
        seed_catalog_data(db)
    finally:
        db.close()


app.include_router(api_router, prefix=settings.api_v1_prefix)
