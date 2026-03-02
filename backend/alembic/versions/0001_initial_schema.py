"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-02-25 16:34:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


role_enum = sa.Enum("farmaceutico", "tecnico", "enfermero", "auditor", name="role_enum")
forma_farmaceutica_enum = sa.Enum(
    "comprimido", "ampolla", "capsula", "jarabe", "crema", "supositorio", "inyectable", "gotas",
    name="forma_farmaceutica_enum",
)
estado_medicamento_enum = sa.Enum("activo", "inactivo", name="estado_medicamento_enum")
tipo_ubicacion_enum = sa.Enum("farmacia", "sala", "carro", "deposito", name="tipo_ubicacion_enum")
estado_lote_enum = sa.Enum("borrador", "impreso", name="estado_lote_enum")
custodia_evento_enum = sa.Enum(
    "unitarizada", "asignada", "entregada_a_sala", "devuelta", "descartada",
    name="custodia_evento_enum",
)
estado_pedido_enum = sa.Enum("borrador", "en_preparacion", "entregado", name="estado_pedido_enum")
alerta_tipo_enum = sa.Enum(
    "vencimiento", "faltante", "duplicado", "asignacion_incorrecta",
    name="alerta_tipo_enum",
)


def upgrade() -> None:
    bind = op.get_bind()
    role_enum.create(bind, checkfirst=True)
    forma_farmaceutica_enum.create(bind, checkfirst=True)
    estado_medicamento_enum.create(bind, checkfirst=True)
    tipo_ubicacion_enum.create(bind, checkfirst=True)
    estado_lote_enum.create(bind, checkfirst=True)
    custodia_evento_enum.create(bind, checkfirst=True)
    estado_pedido_enum.create(bind, checkfirst=True)
    alerta_tipo_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "medications",
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("concentracion", sa.String(length=80), nullable=False),
        sa.Column("forma", forma_farmaceutica_enum, nullable=False),
        sa.Column("codigo_interno", sa.String(length=40), nullable=False),
        sa.Column("gtin", sa.String(length=20), nullable=True),
        sa.Column("estado", estado_medicamento_enum, nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo_interno"),
    )
    op.create_index(op.f("ix_medications_codigo_interno"), "medications", ["codigo_interno"], unique=False)
    op.create_index(op.f("ix_medications_estado"), "medications", ["estado"], unique=False)
    op.create_index(op.f("ix_medications_gtin"), "medications", ["gtin"], unique=False)
    op.create_index(op.f("ix_medications_nombre"), "medications", ["nombre"], unique=False)

    op.create_table(
        "patients",
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("mrn", sa.String(length=60), nullable=False),
        sa.Column("sala", sa.String(length=80), nullable=False),
        sa.Column("cama", sa.String(length=40), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("mrn"),
    )
    op.create_index(op.f("ix_patients_mrn"), "patients", ["mrn"], unique=False)
    op.create_index(op.f("ix_patients_nombre"), "patients", ["nombre"], unique=False)

    op.create_table(
        "locations",
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column("tipo", tipo_ubicacion_enum, nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )
    op.create_index(op.f("ix_locations_nombre"), "locations", ["nombre"], unique=False)

    op.create_table(
        "refresh_tokens",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti"),
    )
    op.create_index(op.f("ix_refresh_tokens_jti"), "refresh_tokens", ["jti"], unique=False)
    op.create_index(op.f("ix_refresh_tokens_user_id"), "refresh_tokens", ["user_id"], unique=False)

    op.create_table(
        "label_batches",
        sa.Column("medicamento_id", sa.String(length=36), nullable=False),
        sa.Column("lote", sa.String(length=80), nullable=False),
        sa.Column("vencimiento", sa.Date(), nullable=False),
        sa.Column("cantidad", sa.Integer(), nullable=False),
        sa.Column("fecha_creacion", sa.Date(), nullable=False),
        sa.Column("estado", estado_lote_enum, nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["medicamento_id"], ["medications.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_label_batches_lote"), "label_batches", ["lote"], unique=False)
    op.create_index(op.f("ix_label_batches_medicamento_id"), "label_batches", ["medicamento_id"], unique=False)

    op.create_table(
        "medication_orders",
        sa.Column("paciente_id", sa.String(length=36), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("estado", estado_pedido_enum, nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["paciente_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medication_orders_estado"), "medication_orders", ["estado"], unique=False)
    op.create_index(op.f("ix_medication_orders_fecha"), "medication_orders", ["fecha"], unique=False)
    op.create_index(op.f("ix_medication_orders_paciente_id"), "medication_orders", ["paciente_id"], unique=False)

    op.create_table(
        "medication_units",
        sa.Column("id_unitario", sa.String(length=32), nullable=False),
        sa.Column("batch_id", sa.String(length=36), nullable=False),
        sa.Column("medicamento_id", sa.String(length=36), nullable=False),
        sa.Column("lote", sa.String(length=80), nullable=False),
        sa.Column("vencimiento", sa.Date(), nullable=False),
        sa.Column("estado_actual", custodia_evento_enum, nullable=False),
        sa.Column("paciente_asignado_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["label_batches.id"]),
        sa.ForeignKeyConstraint(["medicamento_id"], ["medications.id"]),
        sa.ForeignKeyConstraint(["paciente_asignado_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id_unitario"),
    )
    op.create_index(op.f("ix_medication_units_batch_id"), "medication_units", ["batch_id"], unique=False)
    op.create_index(op.f("ix_medication_units_estado_actual"), "medication_units", ["estado_actual"], unique=False)
    op.create_index(op.f("ix_medication_units_lote"), "medication_units", ["lote"], unique=False)
    op.create_index(op.f("ix_medication_units_medicamento_id"), "medication_units", ["medicamento_id"], unique=False)
    op.create_index(op.f("ix_medication_units_paciente_asignado_id"), "medication_units", ["paciente_asignado_id"], unique=False)

    op.create_table(
        "medication_order_items",
        sa.Column("pedido_id", sa.String(length=36), nullable=False),
        sa.Column("medicamento_id", sa.String(length=36), nullable=False),
        sa.Column("dosis", sa.String(length=120), nullable=False),
        sa.Column("ventana_horaria", sa.String(length=120), nullable=False),
        sa.Column("notas", sa.Text(), nullable=False),
        sa.Column("unidad_asignada_id", sa.String(length=32), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["medicamento_id"], ["medications.id"]),
        sa.ForeignKeyConstraint(["pedido_id"], ["medication_orders.id"]),
        sa.ForeignKeyConstraint(["unidad_asignada_id"], ["medication_units.id_unitario"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medication_order_items_medicamento_id"), "medication_order_items", ["medicamento_id"], unique=False)
    op.create_index(op.f("ix_medication_order_items_pedido_id"), "medication_order_items", ["pedido_id"], unique=False)
    op.create_index(op.f("ix_medication_order_items_unidad_asignada_id"), "medication_order_items", ["unidad_asignada_id"], unique=False)

    op.create_table(
        "order_events",
        sa.Column("pedido_id", sa.String(length=36), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("usuario_id", sa.String(length=36), nullable=True),
        sa.Column("usuario", sa.String(length=120), nullable=False),
        sa.Column("rol", sa.String(length=80), nullable=False),
        sa.Column("accion", sa.String(length=240), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["pedido_id"], ["medication_orders.id"]),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_events_pedido_id"), "order_events", ["pedido_id"], unique=False)
    op.create_index(op.f("ix_order_events_timestamp"), "order_events", ["timestamp"], unique=False)

    op.create_table(
        "custody_events",
        sa.Column("unidad_id", sa.String(length=32), nullable=False),
        sa.Column("tipo", custodia_evento_enum, nullable=False),
        sa.Column("fecha_hora", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ubicacion_id", sa.String(length=36), nullable=True),
        sa.Column("ubicacion_nombre", sa.String(length=120), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("actor_nombre", sa.String(length=120), nullable=False),
        sa.Column("rol", sa.String(length=80), nullable=False),
        sa.Column("notas", sa.Text(), nullable=False),
        sa.Column("pendiente_sincronizacion", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["ubicacion_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["unidad_id"], ["medication_units.id_unitario"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_custody_events_fecha_hora"), "custody_events", ["fecha_hora"], unique=False)
    op.create_index(op.f("ix_custody_events_tipo"), "custody_events", ["tipo"], unique=False)
    op.create_index(op.f("ix_custody_events_unidad_id"), "custody_events", ["unidad_id"], unique=False)
    op.create_index(op.f("ix_custody_events_ubicacion_id"), "custody_events", ["ubicacion_id"], unique=False)
    op.create_index(op.f("ix_custody_events_actor_user_id"), "custody_events", ["actor_user_id"], unique=False)

    op.create_table(
        "alerts",
        sa.Column("tipo", alerta_tipo_enum, nullable=False),
        sa.Column("mensaje", sa.Text(), nullable=False),
        sa.Column("fecha_hora", sa.DateTime(timezone=True), nullable=False),
        sa.Column("unidad_id", sa.String(length=32), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["unidad_id"], ["medication_units.id_unitario"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alerts_fecha_hora"), "alerts", ["fecha_hora"], unique=False)
    op.create_index(op.f("ix_alerts_tipo"), "alerts", ["tipo"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_alerts_tipo"), table_name="alerts")
    op.drop_index(op.f("ix_alerts_fecha_hora"), table_name="alerts")
    op.drop_table("alerts")
    op.drop_index(op.f("ix_custody_events_actor_user_id"), table_name="custody_events")
    op.drop_index(op.f("ix_custody_events_ubicacion_id"), table_name="custody_events")
    op.drop_index(op.f("ix_custody_events_unidad_id"), table_name="custody_events")
    op.drop_index(op.f("ix_custody_events_tipo"), table_name="custody_events")
    op.drop_index(op.f("ix_custody_events_fecha_hora"), table_name="custody_events")
    op.drop_table("custody_events")
    op.drop_index(op.f("ix_order_events_timestamp"), table_name="order_events")
    op.drop_index(op.f("ix_order_events_pedido_id"), table_name="order_events")
    op.drop_table("order_events")
    op.drop_index(op.f("ix_medication_order_items_unidad_asignada_id"), table_name="medication_order_items")
    op.drop_index(op.f("ix_medication_order_items_pedido_id"), table_name="medication_order_items")
    op.drop_index(op.f("ix_medication_order_items_medicamento_id"), table_name="medication_order_items")
    op.drop_table("medication_order_items")
    op.drop_index(op.f("ix_medication_units_paciente_asignado_id"), table_name="medication_units")
    op.drop_index(op.f("ix_medication_units_medicamento_id"), table_name="medication_units")
    op.drop_index(op.f("ix_medication_units_lote"), table_name="medication_units")
    op.drop_index(op.f("ix_medication_units_estado_actual"), table_name="medication_units")
    op.drop_index(op.f("ix_medication_units_batch_id"), table_name="medication_units")
    op.drop_table("medication_units")
    op.drop_index(op.f("ix_medication_orders_paciente_id"), table_name="medication_orders")
    op.drop_index(op.f("ix_medication_orders_fecha"), table_name="medication_orders")
    op.drop_index(op.f("ix_medication_orders_estado"), table_name="medication_orders")
    op.drop_table("medication_orders")
    op.drop_index(op.f("ix_label_batches_medicamento_id"), table_name="label_batches")
    op.drop_index(op.f("ix_label_batches_lote"), table_name="label_batches")
    op.drop_table("label_batches")
    op.drop_index(op.f("ix_refresh_tokens_user_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_jti"), table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
    op.drop_index(op.f("ix_locations_nombre"), table_name="locations")
    op.drop_table("locations")
    op.drop_index(op.f("ix_patients_nombre"), table_name="patients")
    op.drop_index(op.f("ix_patients_mrn"), table_name="patients")
    op.drop_table("patients")
    op.drop_index(op.f("ix_medications_nombre"), table_name="medications")
    op.drop_index(op.f("ix_medications_gtin"), table_name="medications")
    op.drop_index(op.f("ix_medications_estado"), table_name="medications")
    op.drop_index(op.f("ix_medications_codigo_interno"), table_name="medications")
    op.drop_table("medications")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    alerta_tipo_enum.drop(bind, checkfirst=True)
    estado_pedido_enum.drop(bind, checkfirst=True)
    custodia_evento_enum.drop(bind, checkfirst=True)
    estado_lote_enum.drop(bind, checkfirst=True)
    tipo_ubicacion_enum.drop(bind, checkfirst=True)
    estado_medicamento_enum.drop(bind, checkfirst=True)
    forma_farmaceutica_enum.drop(bind, checkfirst=True)
    role_enum.drop(bind, checkfirst=True)
