from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.medication import Medication
from app.schemas.medication import (
    MedicationCreate,
    MedicationRead,
    MedicationStatusUpdate,
    MedicationUpdate,
)

router = APIRouter()


@router.get("", response_model=list[MedicationRead])
def list_medications(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[Medication]:
    query = db.query(Medication)
    if search:
        like = f"%{search}%"
        query = query.filter((Medication.nombre.ilike(like)) | (Medication.codigo_interno.ilike(like)))
    if status_filter:
        query = query.filter(Medication.estado == status_filter)
    return query.order_by(Medication.nombre.asc()).all()


@router.post("", response_model=MedicationRead, status_code=status.HTTP_201_CREATED)
def create_medication(
    payload: MedicationCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Medication:
    med = Medication(**payload.model_dump())
    db.add(med)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="codigo_interno already exists") from exc
    db.refresh(med)
    return med


@router.get("/{medication_id}", response_model=MedicationRead)
def get_medication(
    medication_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Medication:
    med = db.get(Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return med


@router.put("/{medication_id}", response_model=MedicationRead)
def update_medication(
    medication_id: str,
    payload: MedicationUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Medication:
    med = db.get(Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    for field, value in payload.model_dump().items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return med


@router.patch("/{medication_id}/status", response_model=MedicationRead)
def update_medication_status(
    medication_id: str,
    payload: MedicationStatusUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Medication:
    med = db.get(Medication, medication_id)
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    med.estado = payload.status
    db.commit()
    db.refresh(med)
    return med
