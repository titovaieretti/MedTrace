from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Patient(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "patients"

    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    mrn: Mapped[str] = mapped_column(String(60), nullable=False, unique=True, index=True)
    sala: Mapped[str] = mapped_column(String(80), nullable=False)
    cama: Mapped[str] = mapped_column(String(40), nullable=False)
