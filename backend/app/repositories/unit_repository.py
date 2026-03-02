from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.batch import MedicationUnit


class UnitRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, unit_id: str) -> MedicationUnit | None:
        stmt = (
            select(MedicationUnit)
            .where(MedicationUnit.id_unitario == unit_id)
            .options(selectinload(MedicationUnit.eventos))
        )
        return self.db.scalar(stmt)
