from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import MedicationOrder


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        status: str | None = None,
        patient_id: str | None = None,
        date: str | None = None,
    ) -> list[MedicationOrder]:
        stmt = (
            select(MedicationOrder)
            .options(
                selectinload(MedicationOrder.items),
                selectinload(MedicationOrder.historial),
            )
            .order_by(MedicationOrder.fecha.desc())
        )
        if status:
            stmt = stmt.where(MedicationOrder.estado == status)
        if patient_id:
            stmt = stmt.where(MedicationOrder.paciente_id == patient_id)
        if date:
            stmt = stmt.where(MedicationOrder.fecha == date_type.fromisoformat(date))
        return list(self.db.scalars(stmt))

    def get(self, order_id: str) -> MedicationOrder | None:
        stmt = (
            select(MedicationOrder)
            .where(MedicationOrder.id == order_id)
            .options(
                selectinload(MedicationOrder.items),
                selectinload(MedicationOrder.historial),
            )
        )
        return self.db.scalar(stmt)
from datetime import date as date_type
