from __future__ import annotations

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    OnboardingStatus,
    OrganizationStatus,
    OrganizationType,
    StudyPhase,
    StudyStatus,
    StudyType,
)
from app.models.organization import OnboardingApplication, Organization
from app.schemas.organization import OrganizationCreate
from app.schemas.study import StudyCreate
from app.services.organization import OrganizationService
from app.services.study import StudyService

DUMMY_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.mark.asyncio
async def test_onboarding_lifecycle_valid_path(db_session: AsyncSession):
    service = OrganizationService(db_session)
    org_in = OrganizationCreate(
        name="Herbal Bio Labs",
        organization_type=OrganizationType.sponsor,
    )
    org = await service.create_organization(org_in, user_id=DUMMY_USER_ID)
    assert org.status == OrganizationStatus.draft

    app = OnboardingApplication(
        organization_id=org.id,
        status=OnboardingStatus.draft,
    )
    db_session.add(app)
    await db_session.commit()
    await db_session.refresh(app)

    # Transition 1: draft -> submitted
    app = await service.transition_onboarding(app.id, OnboardingStatus.submitted, DUMMY_USER_ID)
    assert app.status == OnboardingStatus.submitted

    # Transition 2: submitted -> under_review
    app = await service.transition_onboarding(app.id, OnboardingStatus.under_review, DUMMY_USER_ID)
    assert app.status == OnboardingStatus.under_review

    # Transition 3: under_review -> approved (auto-activates Organization)
    app = await service.transition_onboarding(
        app.id, OnboardingStatus.approved, DUMMY_USER_ID, notes="All GCP criteria verified"
    )
    assert app.status == OnboardingStatus.approved
    assert app.review_notes == "All GCP criteria verified"

    # Verify organization is now active
    updated_org = await service.get_organization(org.id)
    assert updated_org is not None
    assert updated_org.status == OrganizationStatus.active


@pytest.mark.asyncio
async def test_onboarding_lifecycle_invalid_transition(db_session: AsyncSession):
    service = OrganizationService(db_session)
    org_in = OrganizationCreate(
        name="FastTrack Pharma",
        organization_type=OrganizationType.cro,
    )
    org = await service.create_organization(org_in, user_id=DUMMY_USER_ID)

    app = OnboardingApplication(
        organization_id=org.id,
        status=OnboardingStatus.draft,
    )
    db_session.add(app)
    await db_session.commit()

    # Attempt invalid jump: draft -> approved without review
    with pytest.raises(ValueError, match="Invalid transition"):
        await service.transition_onboarding(app.id, OnboardingStatus.approved, DUMMY_USER_ID)


@pytest.mark.asyncio
async def test_study_lifecycle_valid_and_invalid(db_session: AsyncSession):
    org = Organization(
        name="Study Sponsor",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
    )
    db_session.add(org)
    await db_session.flush()

    study_service = StudyService(db_session)
    study_in = StudyCreate(
        study_code="STU-001",
        protocol_number="PRT-001",
        title="Valid Lifecycle Study",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        sponsor_org_id=org.id,
        therapeutic_area="Immunity",
    )
    study = await study_service.create_study(study_in, user_id=DUMMY_USER_ID)
    assert study.status == StudyStatus.draft

    # Valid step 1: draft -> planned
    study = await study_service.transition_status(study.id, StudyStatus.planned, DUMMY_USER_ID)
    assert study.status == StudyStatus.planned

    # Valid step 2: planned -> active
    study = await study_service.transition_status(study.id, StudyStatus.active, DUMMY_USER_ID)
    assert study.status == StudyStatus.active

    # Valid step 3: active -> suspended -> active
    study = await study_service.transition_status(study.id, StudyStatus.suspended, DUMMY_USER_ID)
    assert study.status == StudyStatus.suspended
    study = await study_service.transition_status(study.id, StudyStatus.active, DUMMY_USER_ID)
    assert study.status == StudyStatus.active

    # Valid step 4: active -> completed
    study = await study_service.transition_status(study.id, StudyStatus.completed, DUMMY_USER_ID)
    assert study.status == StudyStatus.completed

    # Invalid transition: completed -> active (no reopening permitted without protocol revision)
    with pytest.raises(ValueError, match="Invalid transition"):
        await study_service.transition_status(study.id, StudyStatus.active, DUMMY_USER_ID)
