from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import EstadoMedicamentoEnum, FormaFarmaceuticaEnum, TipoUbicacionEnum
from app.models.location import Location
from app.models.medication import Medication
from app.models.patient import Patient


def seed_catalog_data(db: Session) -> None:
    med_exists = db.scalar(select(Medication.id).limit(1))
    if not med_exists:
        meds = [
            Medication(
                nombre="Paracetamol",
                concentracion="500 mg",
                forma=FormaFarmaceuticaEnum.comprimido,
                codigo_interno="PAR500",
                gtin="7790001000010",
                estado=EstadoMedicamentoEnum.activo,
            ),
            Medication(
                nombre="Ibuprofeno",
                concentracion="400 mg",
                forma=FormaFarmaceuticaEnum.comprimido,
                codigo_interno="IBU400",
                gtin="7790001000027",
                estado=EstadoMedicamentoEnum.activo,
            ),
        ]
        db.add_all(meds)

    patient_exists = db.scalar(select(Patient.id).limit(1))
    if not patient_exists:
        db.add_all(
            [
                Patient(nombre="Maria Garcia Lopez", mrn="HC-2026-00123", sala="Sala A", cama="101-A"),
                Patient(nombre="Juan Carlos Martinez", mrn="HC-2026-00456", sala="Sala A", cama="102-B"),
            ]
        )

    location_exists = db.scalar(select(Location.id).limit(1))
    if not location_exists:
        db.add_all(
            [
                Location(nombre="Farmacia Central", tipo=TipoUbicacionEnum.farmacia),
                Location(nombre="Sala A", tipo=TipoUbicacionEnum.sala),
                Location(nombre="Sala B", tipo=TipoUbicacionEnum.sala),
            ]
        )
    db.commit()
