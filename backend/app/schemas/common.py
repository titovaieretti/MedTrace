from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Message(BaseModel):
    message: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class DateRangeQuery(BaseModel):
    from_date: date | None = None
    to_date: date | None = None


class AuditEventRead(ORMBase):
    id: str
    timestamp: datetime
    usuario: str
    rol: str
    accion: str
