from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.batch import MedicationUnit
from app.schemas.batch import CustodyEventRead, MedicationUnitRead

router = APIRouter()


@router.get("/{unit_id}", response_model=MedicationUnitRead)
def get_unit(unit_id: str, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> MedicationUnit:
    unit = (
        db.query(MedicationUnit)
        .options(selectinload(MedicationUnit.eventos))
        .filter(MedicationUnit.id_unitario == unit_id)
        .first()
    )
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return unit


@router.get("/{unit_id}/timeline", response_model=list[CustodyEventRead])
def get_unit_timeline(
    unit_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list:
    unit = (
        db.query(MedicationUnit)
        .options(selectinload(MedicationUnit.eventos))
        .filter(MedicationUnit.id_unitario == unit_id)
        .first()
    )
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
    return sorted(unit.eventos, key=lambda x: x.fecha_hora, reverse=True)
