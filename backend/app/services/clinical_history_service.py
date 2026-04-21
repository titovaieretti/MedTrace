from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.clinical_record import ClinicalRecord
from app.schemas.patient import CentralizedClinicalHistoryRead, ClinicalHistoryCreate


CENTRALIZED_HISTORY_CATALOG: dict[str, dict[str, str]] = {
    "HC-2026-00123": {
        "source_reference": "HC-CENTRAL-000123",
        "source_label": "Repositorio Clinico Integrado",
        "motivo_ingreso": "Dolor postoperatorio y control de signos vitales.",
        "diagnostico_principal": "Recuperacion postquirurgica de colecistectomia laparoscopica.",
        "alergias": "Penicilina.",
        "medicacion_cronica": "Omeprazol 20 mg cada 24 h.",
        "antecedentes": "HTA controlada.",
        "notas": "Paciente con buena tolerancia oral. Requiere seguimiento de analgesia.",
    },
    "HC-2026-00456": {
        "source_reference": "HC-CENTRAL-000456",
        "source_label": "Repositorio Clinico Integrado",
        "motivo_ingreso": "Exacerbacion respiratoria con fiebre.",
        "diagnostico_principal": "Neumonia adquirida en la comunidad.",
        "alergias": "Sin alergias medicamentosas conocidas.",
        "medicacion_cronica": "Salbutamol a demanda.",
        "antecedentes": "Asma intermitente.",
        "notas": "Controlar saturacion y respuesta a antibioticoterapia.",
    },
    "HC-2026-00999": {
        "source_reference": "HC-CENTRAL-000999",
        "source_label": "Repositorio Clinico Integrado",
        "motivo_ingreso": "Descompensacion metabolica.",
        "diagnostico_principal": "Diabetes mellitus tipo 2 con hiperglucemia.",
        "alergias": "Metamizol.",
        "medicacion_cronica": "Metformina 850 mg cada 12 h.",
        "antecedentes": "Diabetes tipo 2, dislipemia.",
        "notas": "Requiere ajuste de esquema insulinico y educacion diabetologica.",
    },
}


def lookup_centralized_history(mrn: str) -> CentralizedClinicalHistoryRead:
    data = CENTRALIZED_HISTORY_CATALOG.get(mrn.strip().upper())
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontro una historia clinica centralizada para el MRN indicado",
        )

    return CentralizedClinicalHistoryRead(
        mrn=mrn.strip().upper(),
        source="centralizada",
        source_label=data["source_label"],
        source_reference=data["source_reference"],
        imported_at=datetime.now(UTC),
        motivo_ingreso=data["motivo_ingreso"],
        diagnostico_principal=data["diagnostico_principal"],
        alergias=data["alergias"],
        medicacion_cronica=data["medicacion_cronica"],
        antecedentes=data["antecedentes"],
        notas=data["notas"],
    )


def create_clinical_record(
    db: Session,
    *,
    patient_id: str,
    mrn: str,
    payload: ClinicalHistoryCreate | None,
) -> ClinicalRecord | None:
    if payload is None:
        return None

    if payload.source == "centralizada":
        imported = lookup_centralized_history(mrn)
        record = ClinicalRecord(
            patient_id=patient_id,
            source="centralizada",
            source_label=imported.source_label,
            source_reference=imported.source_reference,
            imported_at=imported.imported_at,
            motivo_ingreso=imported.motivo_ingreso,
            diagnostico_principal=imported.diagnostico_principal,
            alergias=imported.alergias,
            medicacion_cronica=imported.medicacion_cronica,
            antecedentes=imported.antecedentes,
            notas=imported.notas,
        )
    else:
        record = ClinicalRecord(
            patient_id=patient_id,
            source="local",
            source_label=payload.source_label or "Generada en MedTrace",
            source_reference=payload.source_reference,
            imported_at=None,
            motivo_ingreso=payload.motivo_ingreso,
            diagnostico_principal=payload.diagnostico_principal,
            alergias=payload.alergias,
            medicacion_cronica=payload.medicacion_cronica,
            antecedentes=payload.antecedentes,
            notas=payload.notas,
        )

    db.add(record)
    return record
