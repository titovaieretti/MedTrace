from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.batch import CustodyEvent, LabelBatch, MedicationUnit
from app.models.enums import CustodiaEventoEnum
from app.schemas.dashboard import DashboardKPIRead


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_kpis(self) -> DashboardKPIRead:
        today = date.today()
        seven_days = today + timedelta(days=7)
        start_day = datetime.combine(today, datetime.min.time(), tzinfo=UTC)
        end_day = datetime.combine(today, datetime.max.time(), tzinfo=UTC)

        etiquetadas_hoy = self.db.scalar(
            select(func.count(CustodyEvent.id)).where(
                CustodyEvent.tipo == CustodiaEventoEnum.unitarizada,
                CustodyEvent.fecha_hora >= start_day,
                CustodyEvent.fecha_hora <= end_day,
            )
        )
        asignadas = self.db.scalar(
            select(func.count(MedicationUnit.id_unitario)).where(
                MedicationUnit.estado_actual == CustodiaEventoEnum.asignada
            )
        )
        entregadas = self.db.scalar(
            select(func.count(MedicationUnit.id_unitario)).where(
                MedicationUnit.estado_actual == CustodiaEventoEnum.entregada_a_sala
            )
        )
        devueltas = self.db.scalar(
            select(func.count(MedicationUnit.id_unitario)).where(
                MedicationUnit.estado_actual == CustodiaEventoEnum.devuelta
            )
        )
        descartadas = self.db.scalar(
            select(func.count(MedicationUnit.id_unitario)).where(
                MedicationUnit.estado_actual == CustodiaEventoEnum.descartada
            )
        )
        proximas_vencer = self.db.scalar(
            select(func.count(LabelBatch.id)).where(LabelBatch.vencimiento <= seven_days)
        )

        return DashboardKPIRead(
            etiquetadas_hoy=etiquetadas_hoy or 0,
            asignadas=asignadas or 0,
            entregadas=entregadas or 0,
            devueltas=devueltas or 0,
            descartadas=descartadas or 0,
            proximas_vencer=proximas_vencer or 0,
        )
