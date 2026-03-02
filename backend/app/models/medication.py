from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import EstadoMedicamentoEnum, FormaFarmaceuticaEnum


class Medication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "medications"

    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    concentracion: Mapped[str] = mapped_column(String(80), nullable=False)
    forma: Mapped[FormaFarmaceuticaEnum] = mapped_column(
        Enum(FormaFarmaceuticaEnum, name="forma_farmaceutica_enum"),
        nullable=False,
    )
    codigo_interno: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    gtin: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    estado: Mapped[EstadoMedicamentoEnum] = mapped_column(
        Enum(EstadoMedicamentoEnum, name="estado_medicamento_enum"),
        nullable=False,
        default=EstadoMedicamentoEnum.activo,
    )
