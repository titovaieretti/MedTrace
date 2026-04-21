from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class ClinicalRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clinical_records"

    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False, unique=True, index=True)
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    source_label: Mapped[str] = mapped_column(String(120), nullable=False)
    source_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    imported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    motivo_ingreso: Mapped[str] = mapped_column(Text, nullable=False, default="")
    diagnostico_principal: Mapped[str] = mapped_column(Text, nullable=False, default="")
    alergias: Mapped[str] = mapped_column(Text, nullable=False, default="")
    medicacion_cronica: Mapped[str] = mapped_column(Text, nullable=False, default="")
    antecedentes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    notas: Mapped[str] = mapped_column(Text, nullable=False, default="")

    patient = relationship("Patient", back_populates="historia_clinica")
