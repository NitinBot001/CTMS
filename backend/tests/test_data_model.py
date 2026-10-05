from __future__ import annotations

import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    AdverseEventType,
    AEStatus,
    OrganizationStatus,
    OrganizationType,
    ParticipantStatus,
    ScopeLevel,
    Seriousness,
    Severity,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
    UserStatus,
)
from app.models.organization import Organization
from app.models.participant import Participant
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import Permission, Role, RolePermission, User


@pytest.mark.asyncio
async def test_organization_and_study_relationship(db_session: AsyncSession):
    # 1. Sponsor organization
    sponsor = Organization(
        name="AIIA Research Foundation",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
        registration_number="REG-AIIA-2026",
    )
    db_session.add(sponsor)
    await db_session.flush()

    # 2. CRO organization
    cro = Organization(
        name="ClinMetrics CRO India",
        organization_type=OrganizationType.cro,
        status=OrganizationStatus.active,
    )
    db_session.add(cro)
    await db_session.flush()

    # 3. Study referencing both organizations via FK
    study = Study(
        study_code="AYU-CT-2026-001",
        protocol_number="PROT-ASHWA-001",
        title="Randomized Clinical Study on Ashwagandha in Sleep Disorders",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        sponsor_org_id=sponsor.id,
        cro_org_id=cro.id,
        therapeutic_area="Neurology",
        status=StudyStatus.draft,
        planned_sample_size=100,
    )
    db_session.add(study)
    await db_session.commit()

    # Verify query
    fetched_study = await db_session.get(Study, study.id)
    assert fetched_study is not None
    assert fetched_study.sponsor_org_id == sponsor.id
    assert fetched_study.cro_org_id == cro.id
    assert fetched_study.title.startswith("Randomized Clinical")


@pytest.mark.asyncio
async def test_study_site_unique_constraint(db_session: AsyncSession):
    org = Organization(
        name="Apex Pharma",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
    )
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="AYU-CT-2026-002",
        protocol_number="PROT-CURC-002",
        title="Curcumin Bioavailability Study",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        sponsor_org_id=org.id,
        therapeutic_area="Pharmacology",
        status=StudyStatus.planned,
    )
    db_session.add(study)

    site = Site(
        site_code="SITE-DEL-01",
        name="AIIA Central Hospital Delhi",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
    )
    db_session.add(site)
    await db_session.flush()

    # First assignment
    ss1 = StudySite(
        study_id=study.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.planned,
    )
    db_session.add(ss1)
    await db_session.commit()

    # Duplicate assignment must fail unique constraint
    ss2 = StudySite(
        study_id=study.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.planned,
    )
    db_session.add(ss2)
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_rbac_and_study_team_models(db_session: AsyncSession):
    user = User(
        email="pi.sharma@aiia.gov.in",
        full_name="Dr. Rajesh Sharma",
        status=UserStatus.active,
        hashed_password="dummyhashedpassword",
    )
    db_session.add(user)

    role = Role(
        name="Principal Investigator",
        scope_level=ScopeLevel.study,
        is_system_role=True,
    )
    db_session.add(role)

    perm = Permission(
        codename="study.sign_protocol",
        resource="study",
        action="sign",
    )
    db_session.add(perm)
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    db_session.add(rp)
    await db_session.commit()

    # Verify role permissions
    result = await db_session.execute(
        select(RolePermission).where(RolePermission.role_id == role.id)
    )
    assert len(result.scalars().all()) == 1


@pytest.mark.asyncio
async def test_participant_and_safety_models(db_session: AsyncSession):
    org = Organization(
        name="Ayush Research Corp",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
    )
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="AYU-CT-2026-003",
        protocol_number="PROT-003",
        title="Safety Study",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        sponsor_org_id=org.id,
        therapeutic_area="Ayurveda",
        status=StudyStatus.active,
    )
    db_session.add(study)
    await db_session.flush()

    participant = Participant(
        participant_code="SUBJ-001",
        study_id=study.id,
        status=ParticipantStatus.enrolled,
        enrollment_date=datetime.date.today(),
    )
    db_session.add(participant)
    await db_session.flush()

    ae = AdverseEvent(
        study_id=study.id,
        participant_id=participant.id,
        event_type=AdverseEventType.ae,
        description="Mild transient nausea",
        onset_date=datetime.date.today(),
        seriousness=Seriousness.non_serious,
        severity=Severity.mild,
        status=AEStatus.open,
    )
    db_session.add(ae)
    await db_session.commit()

    fetched_ae = await db_session.get(AdverseEvent, ae.id)
    assert fetched_ae is not None
    assert fetched_ae.participant_id == participant.id
    assert fetched_ae.seriousness == Seriousness.non_serious
