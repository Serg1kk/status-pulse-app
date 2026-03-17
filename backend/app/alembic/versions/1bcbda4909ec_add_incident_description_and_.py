"""add incident description and incidentupdate table

Revision ID: 1bcbda4909ec
Revises: bed9ca68309f
Create Date: 2026-03-17 20:23:19.474962

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1bcbda4909ec'
down_revision = 'bed9ca68309f'
branch_labels = None
depends_on = None

# Use existing enum type — do NOT create it again
incidentstatus_enum = postgresql.ENUM(
    'investigating', 'identified', 'monitoring', 'resolved',
    name='incidentstatus',
    create_type=False,
)


def upgrade():
    op.create_table(
        'incidentupdate',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('incident_id', sa.Uuid(), nullable=False),
        sa.Column('status', incidentstatus_enum, nullable=False),
        sa.Column('message', sqlmodel.sql.sqltypes.AutoString(length=2000), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['incident_id'], ['incident.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column(
        'incident',
        sa.Column(
            'description',
            sqlmodel.sql.sqltypes.AutoString(length=2000),
            nullable=False,
            server_default='',
        ),
    )


def downgrade():
    op.drop_column('incident', 'description')
    op.drop_table('incidentupdate')
