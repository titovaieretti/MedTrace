from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import EstadoPedidoEnum


class MedicationOrder(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "medication_orders"

    paciente_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    estado: Mapped[EstadoPedidoEnum] = mapped_column(
        Enum(EstadoPedidoEnum, name="estado_pedido_enum"),
        nullable=False,
        default=EstadoPedidoEnum.borrador,
        index=True,
    )

    items = relationship("MedicationOrderItem", back_populates="pedido", cascade="all, delete-orphan")
    historial = relationship("OrderEvent", back_populates="pedido", cascade="all, delete-orphan")


class MedicationOrderItem(Base, UUIDMixin):
    __tablename__ = "medication_order_items"

    pedido_id: Mapped[str] = mapped_column(ForeignKey("medication_orders.id"), nullable=False, index=True)
    medicamento_id: Mapped[str] = mapped_column(ForeignKey("medications.id"), nullable=False, index=True)
    dosis: Mapped[str] = mapped_column(String(120), nullable=False)
    ventana_horaria: Mapped[str] = mapped_column(String(120), nullable=False)
    notas: Mapped[str] = mapped_column(Text, nullable=False, default="")
    unidad_asignada_id: Mapped[str | None] = mapped_column(
        ForeignKey("medication_units.id_unitario"),
        nullable=True,
        index=True,
    )

    pedido = relationship("MedicationOrder", back_populates="items")


class OrderEvent(Base, UUIDMixin):
    __tablename__ = "order_events"

    pedido_id: Mapped[str] = mapped_column(ForeignKey("medication_orders.id"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    usuario_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    usuario: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[str] = mapped_column(String(80), nullable=False)
    accion: Mapped[str] = mapped_column(String(240), nullable=False)

    pedido = relationship("MedicationOrder", back_populates="historial")
