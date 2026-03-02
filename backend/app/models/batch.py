from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import CustodiaEventoEnum, EstadoLoteEnum


class LabelBatch(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "label_batches"

    medicamento_id: Mapped[str] = mapped_column(ForeignKey("medications.id"), nullable=False, index=True)
    lote: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_creacion: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[EstadoLoteEnum] = mapped_column(
        Enum(EstadoLoteEnum, name="estado_lote_enum"),
        nullable=False,
        default=EstadoLoteEnum.borrador,
    )

    unidades = relationship("MedicationUnit", back_populates="batch", cascade="all, delete-orphan")


class MedicationUnit(Base):
    __tablename__ = "medication_units"

    id_unitario: Mapped[str] = mapped_column(String(32), primary_key=True)
    batch_id: Mapped[str] = mapped_column(ForeignKey("label_batches.id"), nullable=False, index=True)
    medicamento_id: Mapped[str] = mapped_column(ForeignKey("medications.id"), nullable=False, index=True)
    lote: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    estado_actual: Mapped[CustodiaEventoEnum] = mapped_column(
        Enum(CustodiaEventoEnum, name="custodia_evento_enum"),
        nullable=False,
        default=CustodiaEventoEnum.unitarizada,
        index=True,
    )
    paciente_asignado_id: Mapped[str | None] = mapped_column(
        ForeignKey("patients.id"),
        nullable=True,
        index=True,
    )

    batch = relationship("LabelBatch", back_populates="unidades")
    eventos = relationship("CustodyEvent", back_populates="unidad", cascade="all, delete-orphan")


class CustodyEvent(Base, UUIDMixin):
    __tablename__ = "custody_events"

    unidad_id: Mapped[str] = mapped_column(ForeignKey("medication_units.id_unitario"), nullable=False, index=True)
    tipo: Mapped[CustodiaEventoEnum] = mapped_column(
        Enum(CustodiaEventoEnum, name="custodia_evento_enum"),
        nullable=False,
        index=True,
    )
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ubicacion_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"), nullable=True, index=True)
    ubicacion_nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    actor_nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[str] = mapped_column(String(80), nullable=False)
    notas: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pendiente_sincronizacion: Mapped[bool] = mapped_column(nullable=False, default=False)

    unidad = relationship("MedicationUnit", back_populates="eventos")
