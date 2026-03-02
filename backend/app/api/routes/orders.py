from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.order import MedicationOrder
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.schemas.order import (
    MedicationOrderCreate,
    MedicationOrderRead,
    OrderScanRequest,
    OrderScanResponse,
    OrderStatusUpdate,
)
from app.services.order_service import OrderService

router = APIRouter()


def serialize_order(order: MedicationOrder) -> MedicationOrderRead:
    scanned = [item.unidad_asignada_id for item in order.items if item.unidad_asignada_id]
    return MedicationOrderRead(
        id=order.id,
        paciente_id=order.paciente_id,
        fecha=order.fecha,
        estado=order.estado,
        items=order.items,
        historial=order.historial,
        unidades_escaneadas=scanned,
    )


@router.get("", response_model=list[MedicationOrderRead])
def list_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    patient_id: str | None = Query(default=None, alias="patient_id"),
    date: str | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[MedicationOrderRead]:
    repo = OrderRepository(db)
    orders = repo.list(status=status_filter, patient_id=patient_id, date=date)
    return [serialize_order(order) for order in orders]


@router.post("", response_model=MedicationOrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: MedicationOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MedicationOrderRead:
    service = OrderService(db)
    order = service.create_order(payload, actor=current_user)
    return serialize_order(order)


@router.get("/{order_id}", response_model=MedicationOrderRead)
def get_order(order_id: str, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> MedicationOrderRead:
    repo = OrderRepository(db)
    order = repo.get(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return serialize_order(order)


@router.patch("/{order_id}/status", response_model=MedicationOrderRead)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MedicationOrderRead:
    service = OrderService(db)
    order = service.update_order_status(order_id, payload.status, actor=current_user)
    return serialize_order(order)


@router.post("/{order_id}/scan", response_model=OrderScanResponse)
def scan_order_unit(
    order_id: str,
    payload: OrderScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderScanResponse:
    service = OrderService(db)
    ok, error, item_id = service.scan_unit(order_id, payload.unit_id, actor=current_user)
    if not ok:
        return OrderScanResponse(ok=False, error=error)
    return OrderScanResponse(ok=True, item_id=item_id)
