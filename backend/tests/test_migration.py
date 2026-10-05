from __future__ import annotations

import os
import tempfile

import sqlalchemy as sa
from alembic.config import Config

from alembic import command

EXPECTED_CANONICAL_TABLES = {
    "organizations",
    "onboarding_applications",
    "users",
    "roles",
    "permissions",
    "role_permissions",
    "organization_members",
    "studies",
    "sites",
    "study_sites",
    "study_team_members",
    "participants",
    "study_milestones",
    "adverse_events",
    "ethics_approvals",
    "regulatory_submissions",
    "protocol_deviations",
    "capa_records",
    "documents",
    "audit_logs",
}


def test_alembic_migration_reproducibility():
    """
    Verifies that Alembic migration alone can:
    1. Reproduce the full canonical schema on an empty database (upgrade head).
    2. Completely revert the schema without orphans (downgrade base).
    3. Recreate the schema cleanly again (upgrade head).
    """
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        db_url = f"sqlite:///{db_path}"
        cfg_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "alembic.ini")
        alembic_cfg = Config(cfg_path)
        alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{db_path}")

        # 1. Upgrade to head on empty database
        command.upgrade(alembic_cfg, "head")

        engine = sa.create_engine(db_url)
        inspector = sa.inspect(engine)
        tables = set(inspector.get_table_names())

        assert EXPECTED_CANONICAL_TABLES.issubset(tables), f"Missing tables: {EXPECTED_CANONICAL_TABLES - tables}"

        # 2. Downgrade to base
        command.downgrade(alembic_cfg, "base")

        engine = sa.create_engine(db_url)
        inspector = sa.inspect(engine)
        remaining = set(inspector.get_table_names()) - {"alembic_version"}
        assert len(remaining) == 0, f"Tables remained after downgrade: {remaining}"

        # 3. Upgrade to head again
        command.upgrade(alembic_cfg, "head")

        engine = sa.create_engine(db_url)
        inspector = sa.inspect(engine)
        recreated = set(inspector.get_table_names())
        assert EXPECTED_CANONICAL_TABLES.issubset(recreated)

    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
