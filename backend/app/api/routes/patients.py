from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.patient import Patient
from app.schemas.patient import CentralizedClinicalHistoryRead, PatientCreate, PatientRead
from app.services.clinical_history_service import create_clinical_record, lookup_centralized_history

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


@router.get("/centralized-history/lookup", response_model=CentralizedClinicalHistoryRead)
def get_centralized_history(
    mrn: str = Query(..., min_length=1),
    _: object = Depends(get_current_user),
) -> CentralizedClinicalHistoryRead:
    return lookup_centralized_history(mrn)


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Patient:
    existing = db.query(Patient).filter(Patient.mrn == payload.mrn).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un paciente con ese MRN")

    patient = Patient(
        nombre=payload.nombre,
        mrn=payload.mrn,
        sala=payload.sala,
        cama=payload.cama,
    )
    db.add(patient)
    db.flush()

    create_clinical_record(db, patient_id=patient.id, mrn=patient.mrn, payload=payload.historia_clinica)

    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: str, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient
