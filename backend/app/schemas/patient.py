from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ClinicalHistoryBase(BaseModel):
    motivo_ingreso: str = Field(default="", max_length=5000)
    diagnostico_principal: str = Field(default="", max_length=5000)
    alergias: str = Field(default="", max_length=5000)
    medicacion_cronica: str = Field(default="", max_length=5000)
    antecedentes: str = Field(default="", max_length=5000)
    notas: str = Field(default="", max_length=5000)


class ClinicalHistoryCreate(ClinicalHistoryBase):
    source: Literal["local", "centralizada"]
    source_label: str | None = Field(default=None, max_length=120)
    source_reference: str | None = Field(default=None, max_length=120)


class ClinicalHistoryRead(ORMBase, ClinicalHistoryBase):
    id: str
    patient_id: str
    source: str
    source_label: str
    source_reference: str | None
    imported_at: datetime | None


class CentralizedClinicalHistoryRead(ClinicalHistoryBase):
    mrn: str
    source: Literal["centralizada"]
    source_label: str
    source_reference: str
    imported_at: datetime


class PatientCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    mrn: str = Field(min_length=1, max_length=60)
    sala: str = Field(min_length=1, max_length=80)
    cama: str = Field(min_length=1, max_length=40)
    historia_clinica: ClinicalHistoryCreate | None = None


class PatientRead(ORMBase):
    id: str
    nombre: str
    mrn: str
    sala: str
    cama: str
    historia_clinica: ClinicalHistoryRead | None
