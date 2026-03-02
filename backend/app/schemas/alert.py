from datetime import datetime

from app.models.enums import AlertaTipoEnum
from app.schemas.common import ORMBase


class AlertRead(ORMBase):
    id: str
    tipo: AlertaTipoEnum
    mensaje: str
    fecha_hora: datetime
    unidad_id: str | None
