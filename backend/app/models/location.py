from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import TipoUbicacionEnum


class Location(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "locations"

    nombre: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    tipo: Mapped[TipoUbicacionEnum] = mapped_column(
        Enum(TipoUbicacionEnum, name="tipo_ubicacion_enum"),
        nullable=False,
    )
