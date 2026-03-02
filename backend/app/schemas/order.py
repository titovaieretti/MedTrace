from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import EstadoPedidoEnum
from app.schemas.common import ORMBase


class MedicationOrderItemCreate(BaseModel):
    medicamento_id: str
    dosis: str = Field(min_length=1, max_length=120)
    ventana_horaria: str = Field(min_length=1, max_length=120)
    notas: str = ""


class MedicationOrderCreate(BaseModel):
    paciente_id: str
    fecha: date
    estado_inicial: EstadoPedidoEnum = EstadoPedidoEnum.borrador
    items: list[MedicationOrderItemCreate]


class MedicationOrderItemRead(ORMBase):
    id: str
    medicamento_id: str
    dosis: str
    ventana_horaria: str
    notas: str
    unidad_asignada_id: str | None


class OrderEventRead(ORMBase):
    id: str
    timestamp: datetime
    usuario: str
    rol: str
    accion: str


class MedicationOrderRead(ORMBase):
    id: str
    paciente_id: str
    fecha: date
    estado: EstadoPedidoEnum
    items: list[MedicationOrderItemRead]
    historial: list[OrderEventRead]
    unidades_escaneadas: list[str] = []


class OrderStatusUpdate(BaseModel):
    status: EstadoPedidoEnum


class OrderScanRequest(BaseModel):
    unit_id: str


class OrderScanResponse(BaseModel):
    ok: bool
    error: str | None = None
    item_id: str | None = None
