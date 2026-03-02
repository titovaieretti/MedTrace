from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.medication import Medication


class MedicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, search: str | None = None, status: str | None = None) -> list[Medication]:
        stmt = select(Medication)
        if search:
            term = f"%{search.lower()}%"
            stmt = stmt.where(
                (Medication.nombre.ilike(term)) | (Medication.codigo_interno.ilike(term))
            )
        if status:
            stmt = stmt.where(Medication.estado == status)
        stmt = stmt.order_by(Medication.nombre.asc())
        return list(self.db.scalars(stmt))

    def get(self, medication_id: str) -> Medication | None:
        return self.db.get(Medication, medication_id)

    def get_by_codigo_interno(self, codigo_interno: str) -> Medication | None:
        stmt = select(Medication).where(Medication.codigo_interno == codigo_interno)
        return self.db.scalar(stmt)

    def create(self, medication: Medication) -> Medication:
        self.db.add(medication)
        self.db.flush()
        self.db.refresh(medication)
        return medication
