from pydantic import BaseModel, Field

from app.models.enums import TipoUbicacionEnum
from app.schemas.common import ORMBase


class LocationCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    tipo: TipoUbicacionEnum


class LocationRead(ORMBase):
    id: str
    nombre: str
    tipo: TipoUbicacionEnum
