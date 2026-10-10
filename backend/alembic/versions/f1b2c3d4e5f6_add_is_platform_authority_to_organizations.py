"""add is_platform_authority to organizations

Revision ID: f1b2c3d4e5f6
Revises: e4a1b2c3d5e6
Create Date: 2026-10-10 17:15:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f1b2c3d4e5f6'
down_revision: str | None = 'e4a1b2c3d5e6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.add_column(sa.Column(
            'is_platform_authority',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ))


def downgrade() -> None:
    with op.batch_alter_table('organizations') as batch_op:
        batch_op.drop_column('is_platform_authority')
