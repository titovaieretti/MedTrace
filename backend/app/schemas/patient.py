from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class PatientCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    mrn: str = Field(min_length=1, max_length=60)
    sala: str = Field(min_length=1, max_length=80)
    cama: str = Field(min_length=1, max_length=40)


class PatientRead(ORMBase):
    id: str
    nombre: str
    mrn: str
    sala: str
    cama: str
