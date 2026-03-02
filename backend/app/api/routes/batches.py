from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.batch import CustodyEvent, LabelBatch, MedicationUnit
from app.models.enums import CustodiaEventoEnum, EstadoLoteEnum
from app.models.user import User
from app.schemas.batch import LabelBatchCreate, LabelBatchRead, LabelBatchStatusRead

router = APIRouter()


@router.get("", response_model=list[LabelBatchRead])
def list_batches(
    status_filter: EstadoLoteEnum | None = Query(default=None, alias="status"),
    medication_id: str | None = None,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[LabelBatch]:
    query = db.query(LabelBatch).options(selectinload(LabelBatch.unidades))
    if status_filter:
        query = query.filter(LabelBatch.estado == status_filter)
    if medication_id:
        query = query.filter(LabelBatch.medicamento_id == medication_id)
    return query.order_by(LabelBatch.fecha_creacion.desc()).all()


@router.post("", response_model=LabelBatchRead, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: LabelBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LabelBatch:
    batch = LabelBatch(
        medicamento_id=payload.medicamento_id,
        lote=payload.lote,
        vencimiento=payload.vencimiento,
        cantidad=payload.cantidad,
        fecha_creacion=datetime.now(UTC).date(),
        estado=EstadoLoteEnum.borrador,
    )
    db.add(batch)
    db.flush()

    for i in range(payload.cantidad):
        unit_id = f"U-{datetime.now(UTC).year}-{str(i + 1).zfill(6)}-{batch.id[:4]}"
        unit = MedicationUnit(
            id_unitario=unit_id,
            batch_id=batch.id,
            medicamento_id=payload.medicamento_id,
            lote=payload.lote,
            vencimiento=payload.vencimiento,
            estado_actual=CustodiaEventoEnum.unitarizada,
        )
        db.add(unit)
        db.add(
            CustodyEvent(
                unidad_id=unit_id,
                tipo=CustodiaEventoEnum.unitarizada,
                fecha_hora=datetime.now(UTC),
                ubicacion_nombre="Farmacia Central",
                actor_user_id=current_user.id,
                actor_nombre=current_user.name,
                rol=current_user.role.value,
                notas="Generado automaticamente",
            )
        )

    db.commit()
    db.refresh(batch)
    return db.query(LabelBatch).options(selectinload(LabelBatch.unidades)).filter(LabelBatch.id == batch.id).one()


@router.get("/{batch_id}", response_model=LabelBatchRead)
def get_batch(batch_id: str, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> LabelBatch:
    batch = (
        db.query(LabelBatch)
        .options(selectinload(LabelBatch.unidades).selectinload(MedicationUnit.eventos))
        .filter(LabelBatch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return batch


@router.patch("/{batch_id}/print", response_model=LabelBatchStatusRead)
def mark_batch_printed(
    batch_id: str,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> LabelBatch:
    batch = db.get(LabelBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    batch.estado = EstadoLoteEnum.impreso
    db.commit()
    db.refresh(batch)
    return batch
