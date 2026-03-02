from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.batch import MedicationUnit
from app.models.enums import CustodiaEventoEnum, EstadoPedidoEnum
from app.models.order import MedicationOrder, MedicationOrderItem, OrderEvent
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.unit_repository import UnitRepository
from app.schemas.order import MedicationOrderCreate


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.unit_repo = UnitRepository(db)

    def create_order(self, payload: MedicationOrderCreate, actor: User) -> MedicationOrder:
        if not payload.items:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Order without items")

        order = MedicationOrder(
            paciente_id=payload.paciente_id,
            fecha=payload.fecha,
            estado=payload.estado_inicial,
        )
        self.db.add(order)
        self.db.flush()

        for item in payload.items:
            self.db.add(
                MedicationOrderItem(
                    pedido_id=order.id,
                    medicamento_id=item.medicamento_id,
                    dosis=item.dosis,
                    ventana_horaria=item.ventana_horaria,
                    notas=item.notas,
                )
            )

        action = "Pedido creado como borrador" if order.estado == EstadoPedidoEnum.borrador else "Pedido creado"
        self.db.add(
            OrderEvent(
                pedido_id=order.id,
                timestamp=datetime.now(UTC),
                usuario_id=actor.id,
                usuario=actor.name,
                rol=actor.role.value,
                accion=action,
            )
        )
        self.db.commit()
        return self.order_repo.get(order.id)  # type: ignore[return-value]

    def update_order_status(self, order_id: str, new_status: EstadoPedidoEnum, actor: User) -> MedicationOrder:
        order = self.order_repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        allowed = {
            EstadoPedidoEnum.borrador: {EstadoPedidoEnum.en_preparacion},
            EstadoPedidoEnum.en_preparacion: {EstadoPedidoEnum.entregado},
            EstadoPedidoEnum.entregado: set(),
        }
        if new_status not in allowed[order.estado]:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid status transition")

        order.estado = new_status
        label = {
            EstadoPedidoEnum.en_preparacion: "Enviado a preparacion",
            EstadoPedidoEnum.entregado: "Marcado como entregado",
        }.get(new_status, f"Estado cambiado a {new_status.value}")
        self.db.add(
            OrderEvent(
                pedido_id=order.id,
                timestamp=datetime.now(UTC),
                usuario_id=actor.id,
                usuario=actor.name,
                rol=actor.role.value,
                accion=label,
            )
        )
        self.db.commit()
        return self.order_repo.get(order_id)  # type: ignore[return-value]

    def scan_unit(self, order_id: str, unit_id: str, actor: User) -> tuple[bool, str | None, str | None]:
        order = self.order_repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if any(item.unidad_asignada_id == unit_id for item in order.items):
            return False, "Unidad ya escaneada", None

        unit: MedicationUnit | None = self.unit_repo.get(unit_id)
        if not unit:
            return False, "Unidad no encontrada", None

        if unit.paciente_asignado_id and unit.paciente_asignado_id != order.paciente_id:
            return False, "Unidad asignada a otro paciente", None

        item_match = next(
            (item for item in order.items if item.medicamento_id == unit.medicamento_id and not item.unidad_asignada_id),
            None,
        )
        if not item_match:
            return False, "Medicamento no coincide con lo esperado en el pedido", None

        item_match.unidad_asignada_id = unit_id
        unit.paciente_asignado_id = order.paciente_id
        unit.estado_actual = CustodiaEventoEnum.asignada
        self.db.add(
            OrderEvent(
                pedido_id=order.id,
                timestamp=datetime.now(UTC),
                usuario_id=actor.id,
                usuario=actor.name,
                rol=actor.role.value,
                accion=f"Unidad {unit_id} escaneada y asignada",
            )
        )
        self.db.commit()
        return True, None, item_match.id
