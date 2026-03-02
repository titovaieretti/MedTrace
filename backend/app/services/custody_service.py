from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.batch import CustodyEvent, MedicationUnit
from app.models.location import Location
from app.models.user import User
from app.schemas.custody import CustodyEventCreate, CustodySyncRequest, CustodySyncResponse


class CustodyService:
    def __init__(self, db: Session):
        self.db = db

    def create_event(self, payload: CustodyEventCreate, actor: User, pending_sync: bool = False) -> CustodyEvent:
        unit = self.db.get(MedicationUnit, payload.unit_id)
        if not unit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidad no encontrada")

        location_name = payload.location_name
        if payload.location_id:
            location = self.db.get(Location, payload.location_id)
            if not location:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ubicacion no encontrada")
            location_name = location.nombre
        if not location_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="location_id or location_name required")

        event = CustodyEvent(
            unidad_id=unit.id_unitario,
            tipo=payload.tipo,
            fecha_hora=datetime.now(UTC),
            ubicacion_id=payload.location_id,
            ubicacion_nombre=location_name,
            actor_user_id=actor.id,
            actor_nombre=actor.name,
            rol=actor.role.value,
            notas=payload.notas,
            pendiente_sincronizacion=pending_sync,
        )
        unit.estado_actual = payload.tipo
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def sync_events(self, payload: CustodySyncRequest, actor: User) -> CustodySyncResponse:
        accepted: list[str] = []
        rejected = []
        for item in payload.events:
            try:
                self.create_event(
                    CustodyEventCreate(
                        unit_id=item.unit_id,
                        tipo=item.tipo,
                        location_id=item.location_id,
                        location_name=item.location_name,
                        notas=item.notas,
                    ),
                    actor=actor,
                    pending_sync=False,
                )
                accepted.append(item.client_event_id)
            except HTTPException as exc:
                rejected.append({"client_event_id": item.client_event_id, "error": exc.detail})
        return CustodySyncResponse(accepted=accepted, rejected=rejected)

    def list_unit_events(self, unit_id: str) -> list[CustodyEvent]:
        stmt = (
            select(CustodyEvent)
            .where(CustodyEvent.unidad_id == unit_id)
            .order_by(CustodyEvent.fecha_hora.desc())
        )
        return list(self.db.scalars(stmt))
