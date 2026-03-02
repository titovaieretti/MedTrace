from pydantic import BaseModel, Field

from app.models.enums import EstadoMedicamentoEnum, FormaFarmaceuticaEnum
from app.schemas.common import ORMBase


class MedicationBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    concentracion: str = Field(min_length=1, max_length=80)
    forma: FormaFarmaceuticaEnum
    codigo_interno: str = Field(min_length=1, max_length=40)
    gtin: str | None = Field(default=None, max_length=20)


class MedicationCreate(MedicationBase):
    estado: EstadoMedicamentoEnum = EstadoMedicamentoEnum.activo


class MedicationUpdate(MedicationBase):
    estado: EstadoMedicamentoEnum


class MedicationStatusUpdate(BaseModel):
    status: EstadoMedicamentoEnum


class MedicationRead(ORMBase):
    id: str
    nombre: str
    concentracion: str
    forma: FormaFarmaceuticaEnum
    codigo_interno: str
    gtin: str | None
    estado: EstadoMedicamentoEnum
