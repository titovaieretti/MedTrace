from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin
from app.models.enums import AlertaTipoEnum


class Alert(Base, UUIDMixin):
    __tablename__ = "alerts"

    tipo: Mapped[AlertaTipoEnum] = mapped_column(
        Enum(AlertaTipoEnum, name="alerta_tipo_enum"),
        nullable=False,
        index=True,
    )
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    unidad_id: Mapped[str | None] = mapped_column(ForeignKey("medication_units.id_unitario"), nullable=True)
