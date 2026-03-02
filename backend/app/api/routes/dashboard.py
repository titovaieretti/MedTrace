from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.dashboard import DashboardKPIRead
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/kpis", response_model=DashboardKPIRead)
def get_kpis(db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> DashboardKPIRead:
    return DashboardService(db).get_kpis()
