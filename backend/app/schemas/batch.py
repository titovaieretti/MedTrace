from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import CustodiaEventoEnum, EstadoLoteEnum
from app.schemas.common import ORMBase


class CustodyEventRead(ORMBase):
    id: str
    tipo: CustodiaEventoEnum
    fecha_hora: datetime
    ubicacion_nombre: str
    actor_nombre: str
    rol: str
    notas: str
    pendiente_sincronizacion: bool


class MedicationUnitRead(ORMBase):
    id_unitario: str
    medicamento_id: str
    lote: str
    vencimiento: date
    estado_actual: CustodiaEventoEnum
    paciente_asignado_id: str | None
    eventos: list[CustodyEventRead] = []


class LabelBatchCreate(BaseModel):
    medicamento_id: str
    lote: str = Field(min_length=1, max_length=80)
    vencimiento: date
    cantidad: int = Field(ge=1, le=100)


class LabelBatchRead(ORMBase):
    id: str
    medicamento_id: str
    lote: str
    vencimiento: date
    cantidad: int
    fecha_creacion: date
    estado: EstadoLoteEnum
    unidades: list[MedicationUnitRead] = []


class LabelBatchStatusRead(ORMBase):
    id: str
    estado: EstadoLoteEnum
