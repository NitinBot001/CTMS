"""add government verification and site participation

Revision ID: e4a1b2c3d5e6
Revises: dd212c6996cd
Create Date: 2026-10-09 17:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4a1b2c3d5e6'
down_revision: Union[str, None] = 'dd212c6996cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to onboarding_requests
    with op.batch_alter_table('onboarding_requests') as batch_op:
        batch_op.add_column(sa.Column(
            'request_type',
            sa.Enum('research_pi', 'cro_staff', 'site_pi', name='access_request_type'),
            nullable=False,
            server_default='research_pi'
        ))
        batch_op.add_column(sa.Column('designation', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('qualifications', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('requested_role', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('declaration_accepted', sa.Boolean(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('proposed_site_name', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('site_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('organization_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('provisioned_site_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_onboarding_requests_site_id', 'sites', ['site_id'], ['id'])
        batch_op.create_foreign_key('fk_onboarding_requests_org_id', 'organizations', ['organization_id'], ['id'])
        batch_op.create_foreign_key('fk_onboarding_requests_prov_site_id', 'sites', ['provisioned_site_id'], ['id'])

    # 2. Create site_participation_requests table
    op.create_table(
        'site_participation_requests',
        sa.Column('study_id', sa.Uuid(), nullable=False),
        sa.Column('site_id', sa.Uuid(), nullable=False),
        sa.Column('requested_by_id', sa.Uuid(), nullable=False),
        sa.Column(
            'government_status',
            sa.Enum('pending', 'approved', 'rejected', name='participation_decision_status'),
            nullable=False,
            server_default='pending'
        ),
        sa.Column('government_reviewer_id', sa.Uuid(), nullable=True),
        sa.Column('government_reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('government_notes', sa.Text(), nullable=True),
        sa.Column(
            'site_status',
            sa.Enum('pending', 'approved', 'rejected', name='participation_decision_status'),
            nullable=False,
            server_default='pending'
        ),
        sa.Column('site_reviewer_id', sa.Uuid(), nullable=True),
        sa.Column('site_reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('site_notes', sa.Text(), nullable=True),
        sa.Column(
            'status',
            sa.Enum(
                'requested',
                'pending_government_verification',
                'pending_site_confirmation',
                'approved',
                'rejected',
                'withdrawn',
                name='site_participation_status'
            ),
            nullable=False,
            server_default='requested'
        ),
        sa.Column('study_site_id', sa.Uuid(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['study_id'], ['studies.id']),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id']),
        sa.ForeignKeyConstraint(['requested_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['government_reviewer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['site_reviewer_id'], ['users.id']),
        sa.ForeignKeyConstraint(['study_site_id'], ['study_sites.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_site_participation_requests_study_id'), 'site_participation_requests', ['study_id'], unique=False)
    op.create_index(op.f('ix_site_participation_requests_site_id'), 'site_participation_requests', ['site_id'], unique=False)

    # 3. Create team_member_verification_requests table
    op.create_table(
        'team_member_verification_requests',
        sa.Column('invited_by_id', sa.Uuid(), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('designation', sa.String(length=100), nullable=True),
        sa.Column('organization_id', sa.Uuid(), nullable=True),
        sa.Column('study_id', sa.Uuid(), nullable=True),
        sa.Column('site_id', sa.Uuid(), nullable=True),
        sa.Column('requested_role', sa.String(length=100), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'pending',
                'under_review',
                'approved',
                'rejected',
                'changes_requested',
                name='onboarding_request_status'
            ),
            nullable=False,
            server_default='pending'
        ),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Uuid(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('provisioned_user_id', sa.Uuid(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['invited_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['study_id'], ['studies.id']),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.ForeignKeyConstraint(['provisioned_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_team_member_verification_requests_email'), 'team_member_verification_requests', ['email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_team_member_verification_requests_email'), table_name='team_member_verification_requests')
    op.drop_table('team_member_verification_requests')
    op.drop_index(op.f('ix_site_participation_requests_site_id'), table_name='site_participation_requests')
    op.drop_index(op.f('ix_site_participation_requests_study_id'), table_name='site_participation_requests')
    op.drop_table('site_participation_requests')

    with op.batch_alter_table('onboarding_requests') as batch_op:
        batch_op.drop_constraint('fk_onboarding_requests_prov_site_id', type_='foreignkey')
        batch_op.drop_constraint('fk_onboarding_requests_org_id', type_='foreignkey')
        batch_op.drop_constraint('fk_onboarding_requests_site_id', type_='foreignkey')
        batch_op.drop_column('provisioned_site_id')
        batch_op.drop_column('organization_id')
        batch_op.drop_column('site_id')
        batch_op.drop_column('proposed_site_name')
        batch_op.drop_column('declaration_accepted')
        batch_op.drop_column('requested_role')
        batch_op.drop_column('qualifications')
        batch_op.drop_column('designation')
        batch_op.drop_column('request_type')
