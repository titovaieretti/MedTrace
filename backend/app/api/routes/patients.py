from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.schemas.patient import PatientRead

router = APIRouter()


@router.get("", response_model=list[PatientRead])
def list_patients(
    search: str | None = Query(default=None),
    ward: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[Patient]:
    query = db.query(Patient)
    if search:
        like = f"%{search}%"
        query = query.filter((Patient.nombre.ilike(like)) | (Patient.mrn.ilike(like)))
    if ward:
        query = query.filter(Patient.sala == ward)
    return query.order_by(Patient.nombre.asc()).all()


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: str, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient
