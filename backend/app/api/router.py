from fastapi import APIRouter

from app.api.routes import alerts, auth, batches, custody, dashboard, health, locations, medications, orders, patients, units

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(medications.router, prefix="/medications", tags=["medications"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(batches.router, prefix="/label-batches", tags=["label-batches"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(units.router, prefix="/units", tags=["units"])
api_router.include_router(custody.router, prefix="/custody-events", tags=["custody-events"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
