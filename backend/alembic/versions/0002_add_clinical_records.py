"""add clinical records

Revision ID: 0002_add_clinical_records
Revises: 0001_initial_schema
Create Date: 2026-04-21 15:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_add_clinical_records"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clinical_records",
        sa.Column("patient_id", sa.String(length=36), nullable=False),
        sa.Column("source", sa.String(length=30), nullable=False),
        sa.Column("source_label", sa.String(length=120), nullable=False),
        sa.Column("source_reference", sa.String(length=120), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("motivo_ingreso", sa.Text(), nullable=False, server_default=""),
        sa.Column("diagnostico_principal", sa.Text(), nullable=False, server_default=""),
        sa.Column("alergias", sa.Text(), nullable=False, server_default=""),
        sa.Column("medicacion_cronica", sa.Text(), nullable=False, server_default=""),
        sa.Column("antecedentes", sa.Text(), nullable=False, server_default=""),
        sa.Column("notas", sa.Text(), nullable=False, server_default=""),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("patient_id"),
    )
    op.create_index(op.f("ix_clinical_records_patient_id"), "clinical_records", ["patient_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_clinical_records_patient_id"), table_name="clinical_records")
    op.drop_table("clinical_records")
