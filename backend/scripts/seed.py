"""
Seed realistic demo/benchmark data for AyuCTMS CRO/Sponsor Backend
"""

import asyncio
import datetime
import os
import sys
import uuid

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal, init_db
from app.models.compliance import (
    EthicsApproval,
)
from app.models.document import Document
from app.models.enums import (
    AdverseEventType,
    AEStatus,
    AssignmentStatus,
    CTRIStatus,
    DocumentStatus,
    DocumentType,
    ECStatus,
    OnboardingStatus,
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
from app.models.organization import OnboardingApplication, Organization
from app.models.participant import Participant
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import Role, User
from app.services.audit import AuditService


async def seed_data():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select

        res = await db.execute(select(Organization))
        if res.scalars().first():
            print("Database already contains data, skipping seed.")
            return

        print("Seeding AyuCTMS database...")
        today = datetime.date.today()

        # 1. Users
        admin_user = User(
            id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            email="admin@ayuctms.gov.in",
            full_name="AyuCTMS System Administrator",
            status=UserStatus.active,
            hashed_password="demo_hashed_password",
        )
        pi_user = User(
            email="pi.rajesh@aiia.gov.in",
            full_name="Dr. Rajesh Sharma",
            phone="+91-9876543210",
            status=UserStatus.active,
            hashed_password="demo_hashed_password",
        )
        db.add_all([admin_user, pi_user])
        await db.flush()

        # 2. Roles & Permissions
        role_pi = Role(
            name="Principal Investigator",
            description="Responsible for the conduct of clinical investigation at study site",
            scope_level=ScopeLevel.study,
            is_system_role=True,
        )
        role_cro = Role(
            name="CRO Lead Monitor",
            description="Oversees study conduct across multi-centric sites",
            scope_level=ScopeLevel.organization,
            is_system_role=True,
        )
        db.add_all([role_pi, role_cro])
        await db.flush()

        # 3. Organizations (Sponsor + CRO)
        sponsor = Organization(
            name="All India Institute of Ayurveda (AIIA)",
            organization_type=OrganizationType.sponsor,
            status=OrganizationStatus.active,
            registration_number="AYUSH-INST-001",
            email="research@aiia.gov.in",
            city="New Delhi",
            state="Delhi",
            country="India",
        )
        cro = Organization(
            name="ClinVeda CRO Solutions Pvt Ltd",
            organization_type=OrganizationType.cro,
            status=OrganizationStatus.active,
            registration_number="CRO-IND-2025-098",
            email="trials@clinveda.com",
            city="Bengaluru",
            state="Karnataka",
            country="India",
        )
        db.add_all([sponsor, cro])
        await db.flush()

        # Onboarding application for sponsor
        onboarding = OnboardingApplication(
            organization_id=sponsor.id,
            status=OnboardingStatus.approved,
            submitted_at=datetime.datetime.now(datetime.UTC),
            reviewed_at=datetime.datetime.now(datetime.UTC),
            reviewed_by=admin_user.id,
            review_notes="Institutional review complete and approved by Ministry of Ayush CTMS board.",
        )
        db.add(onboarding)

        # 4. Studies
        study1 = Study(
            study_code="AYU-CT-2026-001",
            protocol_number="AIIA-ASHWA-COG-II",
            title="Multi-Center Randomized Trial on Ashwagandha Formulation for Cognitive Health",
            short_title="Ashwagandha Cognitive Trial",
            study_type=StudyType.interventional,
            phase=StudyPhase.phase_2,
            sponsor_org_id=sponsor.id,
            cro_org_id=cro.id,
            therapeutic_area="Neuro-Cognitive Health",
            planned_sample_size=120,
            start_date=today - datetime.timedelta(days=120),
            end_date=today + datetime.timedelta(days=240),
            recruitment_start_date=today - datetime.timedelta(days=90),
            recruitment_end_date=today + datetime.timedelta(days=90),
            status=StudyStatus.active,
            ctri_status=CTRIStatus.registered,
            ctri_number="CTRI/2026/04/067890",
            description="Evaluation of safety, tolerability and cognitive improvement in adults.",
        )
        study2 = Study(
            study_code="AYU-CT-2026-004",
            protocol_number="AIIA-CURC-MET-III",
            title="Standardized Curcumin Adjunct Therapy in Metabolic Syndrome",
            short_title="Curcumin Metabolic Study",
            study_type=StudyType.interventional,
            phase=StudyPhase.phase_3,
            sponsor_org_id=sponsor.id,
            cro_org_id=cro.id,
            therapeutic_area="Endocrinology & Metabolism",
            planned_sample_size=200,
            start_date=today - datetime.timedelta(days=60),
            end_date=today + datetime.timedelta(days=300),
            status=StudyStatus.active,
        )
        db.add_all([study1, study2])
        await db.flush()

        # 5. Sites & StudySites
        site1 = Site(
            site_code="SITE-DEL-01",
            name="All India Institute of Ayurveda Main Hospital",
            site_type=SiteType.hospital,
            city="New Delhi",
            state="Delhi",
            country="India",
            status=SiteStatus.active,
        )
        site2 = Site(
            site_code="SITE-JAI-02",
            name="National Institute of Ayurveda Hospital",
            site_type=SiteType.hospital,
            city="Jaipur",
            state="Rajasthan",
            country="India",
            status=SiteStatus.active,
        )
        db.add_all([site1, site2])
        await db.flush()

        ss1 = StudySite(
            study_id=study1.id,
            site_id=site1.id,
            activation_status=StudySiteActivationStatus.activated,
            recruitment_target=60,
            activation_date=today - datetime.timedelta(days=90),
        )
        ss2 = StudySite(
            study_id=study1.id,
            site_id=site2.id,
            activation_status=StudySiteActivationStatus.activated,
            recruitment_target=60,
            activation_date=today - datetime.timedelta(days=60),
        )
        db.add_all([ss1, ss2])

        # Study team
        team_member = StudyTeamMember(
            study_id=study1.id,
            user_id=pi_user.id,
            role_id=role_pi.id,
            site_id=site1.id,
            start_date=today - datetime.timedelta(days=120),
            assignment_status=AssignmentStatus.active,
        )
        db.add(team_member)

        # 6. Participants
        for i in range(1, 15):
            p = Participant(
                participant_code=f"ASH-DEL-{i:03d}",
                study_id=study1.id,
                site_id=site1.id,
                status=ParticipantStatus.active if i > 3 else ParticipantStatus.completed,
                screening_date=today - datetime.timedelta(days=80 - i),
                enrollment_date=today - datetime.timedelta(days=70 - i),
            )
            db.add(p)

        screen_fail = Participant(
            participant_code="ASH-DEL-SF01",
            study_id=study1.id,
            site_id=site1.id,
            status=ParticipantStatus.screen_failed,
            screening_date=today - datetime.timedelta(days=50),
        )
        db.add(screen_fail)
        await db.flush()

        # 7. Adverse Event
        first_pt_res = await db.execute(
            select(Participant).where(Participant.study_id == study1.id)
        )
        first_pt = first_pt_res.scalars().first()
        if first_pt:
            ae = AdverseEvent(
                study_id=study1.id,
                participant_id=first_pt.id,
                site_id=site1.id,
                event_type=AdverseEventType.ae,
                description="Mild headache following evening dosage",
                onset_date=today - datetime.timedelta(days=20),
                seriousness=Seriousness.non_serious,
                severity=Severity.mild,
                status=AEStatus.closed,
            )
            db.add(ae)

        # 8. Ethics Approval & Document
        ethics = EthicsApproval(
            study_id=study1.id,
            site_id=site1.id,
            committee_name="AIIA Institutional Ethics Committee",
            approval_number="AIIA/IEC/2026/012",
            status=ECStatus.approved,
            approval_date=today - datetime.timedelta(days=150),
            expiry_date=today + datetime.timedelta(days=215),
        )
        db.add(ethics)

        doc = Document(
            study_id=study1.id,
            document_type=DocumentType.protocol,
            title="AIIA Ashwagandha Cognitive Clinical Protocol Final",
            version="2.1",
            storage_key="s3://aiia-ctms/protocols/AIIA-ASHWA-COG-II-v2.1.pdf",
            file_name="AIIA-ASHWA-COG-II-v2.1.pdf",
            file_size=3456789,
            mime_type="application/pdf",
            status=DocumentStatus.approved,
            uploaded_by=admin_user.id,
        )
        db.add(doc)

        # 9. Audit event
        await AuditService.create_audit_log(
            db=db,
            user_id=admin_user.id,
            action="system.seed_initial_data",
            resource_type="database",
            resource_id=study1.id,
            changes={"status": "initial_seed_completed"},
        )

        await db.commit()
        print("Database seeded successfully with benchmark CRO/Sponsor clinical records!")


if __name__ == "__main__":
    asyncio.run(seed_data())
