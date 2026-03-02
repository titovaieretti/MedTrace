from datetime import datetime

from pydantic import BaseModel

from app.models.enums import CustodiaEventoEnum


class CustodyEventCreate(BaseModel):
    unit_id: str
    tipo: CustodiaEventoEnum
    location_id: str | None = None
    location_name: str | None = None
    notas: str = ""


class CustodySyncItem(BaseModel):
    client_event_id: str
    unit_id: str
    tipo: CustodiaEventoEnum
    location_id: str | None = None
    location_name: str | None = None
    notas: str = ""
    occurred_at: datetime


class CustodySyncRequest(BaseModel):
    events: list[CustodySyncItem]


class CustodySyncRejected(BaseModel):
    client_event_id: str
    error: str


class CustodySyncResponse(BaseModel):
    accepted: list[str]
    rejected: list[CustodySyncRejected]
