from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.alert import Alert
from app.models.enums import AlertaTipoEnum
from app.schemas.alert import AlertRead

router = APIRouter()


@router.get("", response_model=list[AlertRead])
def list_alerts(
    alert_type: AlertaTipoEnum | None = Query(default=None, alias="type"),
    since: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[Alert]:
    query = db.query(Alert)
    if alert_type:
        query = query.filter(Alert.tipo == alert_type)
    if since:
        query = query.filter(Alert.fecha_hora >= since)
    return query.order_by(Alert.fecha_hora.desc()).all()
