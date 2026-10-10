from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.enums import (
    AccessRequestType,
    OnboardingRequestStatus,
    UserStatus,
)
from app.models.platform import (
    OnboardingRequest,
    SiteParticipationRequest,
    TeamMemberVerificationRequest,
)
from app.models.user import SuperAdminProfile, User
from app.schemas.dashboard import SuperAdminOverviewResponse
from app.schemas.participant import ParticipantRead
from app.schemas.platform import (
    ActivationRequest,
    ActivationResponse,
    ChangePasswordRequest,
    CROStaffRequestCreate,
    FirstLoginSetupRequest,
    OnboardingRequestCreate,
    OnboardingRequestRead,
    OnboardingRequestReview,
    ProvisionResult,
    ResearchPIRequestCreate,
    SiteParticipationDecisionReview,
    SiteParticipationRequestCreate,
    SiteParticipationRequestRead,
    SitePIRequestCreate,
    SuperAdminProfileRead,
    TeamMemberInviteCreate,
    TeamMemberVerificationRequestRead,
    TeamMemberVerificationReview,
    VerifierCreateRequest,
)
from app.services.platform import PlatformService

router = APIRouter(prefix="/platform", tags=["Platform & Super Admin"])


async def require_super_admin(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> User:
    is_super = await PlatformService.is_super_admin(current_user, db)
    if not is_super:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required"
        )
    return current_user


# =============================================================================
# PUBLIC ACCESS REQUEST ENTRY POINTS
# =============================================================================


@router.post(
    "/onboarding-requests",
    response_model=OnboardingRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_onboarding_request(
    request_data: OnboardingRequestCreate, db: AsyncSession = Depends(get_db)
) -> OnboardingRequestRead:
    new_request = OnboardingRequest(**request_data.model_dump())
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return OnboardingRequestRead.model_validate(new_request)


@router.post(
    "/requests/research-pi",
    response_model=OnboardingRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_research_pi_request(
    data: ResearchPIRequestCreate, db: AsyncSession = Depends(get_db)
) -> OnboardingRequestRead:
    dump = data.model_dump()
    dump["request_type"] = AccessRequestType.research_pi
    new_req = OnboardingRequest(**dump)
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return OnboardingRequestRead.model_validate(new_req)


@router.post(
    "/requests/cro-staff",
    response_model=OnboardingRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_cro_staff_request(
    data: CROStaffRequestCreate, db: AsyncSession = Depends(get_db)
) -> OnboardingRequestRead:
    dump = data.model_dump()
    dump["request_type"] = AccessRequestType.cro_staff
    new_req = OnboardingRequest(**dump)
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return OnboardingRequestRead.model_validate(new_req)


@router.post(
    "/requests/site-pi",
    response_model=OnboardingRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_site_pi_request(
    data: SitePIRequestCreate, db: AsyncSession = Depends(get_db)
) -> OnboardingRequestRead:
    dump = data.model_dump()
    dump["request_type"] = AccessRequestType.site_pi
    new_req = OnboardingRequest(**dump)
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return OnboardingRequestRead.model_validate(new_req)


# =============================================================================
# GOVERNMENT REVIEW QUEUE & DECISION ACTIONS
# =============================================================================


@router.get("/onboarding-requests", response_model=list[OnboardingRequestRead])
async def list_onboarding_requests(
    request_type: AccessRequestType | None = Query(None),
    status_filter: OnboardingRequestStatus | None = Query(None, alias="status"),
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> list[OnboardingRequestRead]:
    stmt = select(OnboardingRequest).order_by(OnboardingRequest.created_at.desc())
    if request_type:
        stmt = stmt.where(OnboardingRequest.request_type == request_type)
    if status_filter:
        stmt = stmt.where(OnboardingRequest.status == status_filter)

    res = await db.execute(stmt)
    return [OnboardingRequestRead.model_validate(r) for r in res.scalars().all()]


@router.get("/onboarding-requests/{request_id}", response_model=OnboardingRequestRead)
async def get_onboarding_request(
    request_id: uuid.UUID,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> OnboardingRequestRead:
    stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    res = await db.execute(stmt)
    request = res.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return OnboardingRequestRead.model_validate(request)


@router.patch("/onboarding-requests/{request_id}/review", response_model=OnboardingRequestRead)
async def review_onboarding_request(
    request_id: uuid.UUID,
    review_data: OnboardingRequestReview,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> OnboardingRequestRead:
    stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    res = await db.execute(stmt)
    request = res.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    valid_transitions = {
        OnboardingRequestStatus.pending: [OnboardingRequestStatus.under_review],
        OnboardingRequestStatus.under_review: [
            OnboardingRequestStatus.approved,
            OnboardingRequestStatus.rejected,
            OnboardingRequestStatus.changes_requested,
        ],
        OnboardingRequestStatus.changes_requested: [
            OnboardingRequestStatus.under_review,
            OnboardingRequestStatus.rejected,
        ],
    }

    if review_data.status not in valid_transitions.get(request.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {request.status} to {review_data.status}",
        )

    request.status = review_data.status
    if review_data.review_notes:
        request.review_notes = review_data.review_notes

    request.reviewed_by = current_admin.id
    request.reviewed_at = datetime.datetime.now(datetime.UTC)

    await db.commit()
    await db.refresh(request)
    return OnboardingRequestRead.model_validate(request)


@router.post("/onboarding-requests/{request_id}/approve", response_model=ProvisionResult)
async def approve_onboarding_request(
    request_id: uuid.UUID,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ProvisionResult:
    stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    res = await db.execute(stmt)
    request = res.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    # Reviewer cannot approve their own access request
    if request.email.lower() == current_admin.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reviewers cannot approve their own access requests",
        )

    if request.status == OnboardingRequestStatus.approved:
        if not request.provisioned_organization_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request marked approved but provisioned_organization_id is missing",
            )
        return ProvisionResult(
            organization_id=request.provisioned_organization_id,
            user_email=request.email,
            invitation_sent=False,
            raw_token=None,
        )

    if request.status != OnboardingRequestStatus.under_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request must be under_review to be approved",
        )

    try:
        result = await PlatformService.provision_organization_from_request(
            request_id=request_id,
            reviewer_user=current_admin,
            db=db,
            settings=settings,
        )
        await db.commit()
        return ProvisionResult(**result)
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# =============================================================================
# ACCOUNT ACTIVATION & FIRST-LOGIN SETUP
# =============================================================================


@router.post("/activate", response_model=ActivationResponse)
async def activate_account(
    activation_data: ActivationRequest, db: AsyncSession = Depends(get_db)
) -> ActivationResponse:
    token_record = await PlatformService.verify_and_consume_invitation_token(
        activation_data.token, db
    )
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    stmt = select(User).where(User.id == token_record.user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(activation_data.new_password)
    user.must_change_password = False
    user.password_changed_at = datetime.datetime.now(datetime.UTC)
    user.status = UserStatus.active

    await db.commit()

    return ActivationResponse(message="Account activated successfully", email=user.email)


@router.get("/super-admin/me", response_model=SuperAdminProfileRead)
async def get_super_admin_profile(
    current_admin: User = Depends(require_super_admin), db: AsyncSession = Depends(get_db)
) -> SuperAdminProfileRead:
    stmt = (
        select(SuperAdminProfile)
        .options(selectinload(SuperAdminProfile.user))
        .where(SuperAdminProfile.user_id == current_admin.id)
    )
    res = await db.execute(stmt)
    profile = res.scalars().first()
    return SuperAdminProfileRead.model_validate(profile)


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password"
        )

    current_user.hashed_password = hash_password(password_data.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.datetime.now(datetime.UTC)

    await db.commit()
    return {"message": "Password changed successfully"}


@router.post("/first-login-setup")
async def complete_first_login_setup(
    setup_data: FirstLoginSetupRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await PlatformService.complete_first_login_setup(
            user=current_user,
            current_password=setup_data.current_password,
            new_password=setup_data.new_password,
            full_name=setup_data.full_name,
            phone=setup_data.phone,
            db=db,
        )
        await db.commit()
        return {"message": "First login setup completed successfully"}
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# =============================================================================
# DUAL-APPROVAL CLINICAL SITE STUDY PARTICIPATION
# =============================================================================


@router.post(
    "/site-participation/request",
    response_model=SiteParticipationRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def request_site_participation(
    req_data: SiteParticipationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> SiteParticipationRequestRead:
    try:
        participation = await PlatformService.create_site_participation_request(
            study_id=req_data.study_id,
            site_id=req_data.site_id,
            requester=current_user,
            db=db,
            settings=settings,
        )
        await db.commit()
        await db.refresh(participation)
        return SiteParticipationRequestRead.model_validate(participation)
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.get("/site-participation", response_model=list[SiteParticipationRequestRead])
async def list_site_participation_requests(
    current_admin: User = Depends(require_super_admin), db: AsyncSession = Depends(get_db)
) -> list[SiteParticipationRequestRead]:
    stmt = select(SiteParticipationRequest).order_by(SiteParticipationRequest.created_at.desc())
    res = await db.execute(stmt)
    return [SiteParticipationRequestRead.model_validate(r) for r in res.scalars().all()]


@router.get(
    "/site-participation/by-study/{study_id}", response_model=list[SiteParticipationRequestRead]
)
async def list_study_site_participations(
    study_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SiteParticipationRequestRead]:
    stmt = (
        select(SiteParticipationRequest)
        .where(SiteParticipationRequest.study_id == study_id)
        .order_by(SiteParticipationRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return [SiteParticipationRequestRead.model_validate(r) for r in res.scalars().all()]


@router.get(
    "/site-participation/by-site/{site_id}", response_model=list[SiteParticipationRequestRead]
)
async def list_site_incoming_participations(
    site_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SiteParticipationRequestRead]:
    stmt = (
        select(SiteParticipationRequest)
        .where(SiteParticipationRequest.site_id == site_id)
        .order_by(SiteParticipationRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return [SiteParticipationRequestRead.model_validate(r) for r in res.scalars().all()]


@router.post(
    "/site-participation/{request_id}/government-review",
    response_model=SiteParticipationRequestRead,
)
async def review_site_participation_government(
    request_id: uuid.UUID,
    review_data: SiteParticipationDecisionReview,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> SiteParticipationRequestRead:
    try:
        req = await PlatformService.review_site_participation_government(
            request_id=request_id,
            reviewer_user=current_admin,
            decision=review_data.decision,
            notes=review_data.notes,
            db=db,
        )
        await db.commit()
        await db.refresh(req)
        return SiteParticipationRequestRead.model_validate(req)
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post(
    "/site-participation/{request_id}/site-response",
    response_model=SiteParticipationRequestRead,
)
async def respond_site_participation_site(
    request_id: uuid.UUID,
    response_data: SiteParticipationDecisionReview,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SiteParticipationRequestRead:
    try:
        req = await PlatformService.respond_site_participation_site(
            request_id=request_id,
            site_user=current_user,
            decision=response_data.decision,
            notes=response_data.notes,
            db=db,
        )
        await db.commit()
        await db.refresh(req)
        return SiteParticipationRequestRead.model_validate(req)
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# =============================================================================
# TEAM MEMBER INVITATIONS & INDIVIDUAL GOVERNMENT VERIFICATION
# =============================================================================


@router.post(
    "/team-invitations",
    response_model=TeamMemberVerificationRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_team_invitation(
    data: TeamMemberInviteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberVerificationRequestRead:
    inv = await PlatformService.create_team_invitation(
        invited_by=current_user,
        full_name=data.full_name,
        email=data.email,
        requested_role=data.requested_role,
        phone=data.phone,
        designation=data.designation,
        organization_id=data.organization_id,
        study_id=data.study_id,
        site_id=data.site_id,
        db=db,
    )
    await db.commit()
    await db.refresh(inv)
    return TeamMemberVerificationRequestRead.model_validate(inv)


@router.get("/team-verifications", response_model=list[TeamMemberVerificationRequestRead])
async def list_team_verifications(
    current_admin: User = Depends(require_super_admin), db: AsyncSession = Depends(get_db)
) -> list[TeamMemberVerificationRequestRead]:
    stmt = select(TeamMemberVerificationRequest).order_by(
        TeamMemberVerificationRequest.created_at.desc()
    )
    res = await db.execute(stmt)
    return [TeamMemberVerificationRequestRead.model_validate(r) for r in res.scalars().all()]


@router.post(
    "/team-verifications/{request_id}/review",
    response_model=TeamMemberVerificationRequestRead,
)
async def review_team_verification(
    request_id: uuid.UUID,
    review_data: TeamMemberVerificationReview,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TeamMemberVerificationRequestRead:
    try:
        req = await PlatformService.review_team_verification(
            request_id=request_id,
            reviewer_user=current_admin,
            status=review_data.status,
            review_notes=review_data.review_notes,
            db=db,
            settings=settings,
        )
        await db.commit()
        await db.refresh(req)
        return TeamMemberVerificationRequestRead.model_validate(req)
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# =============================================================================
# PLATFORM VERIFIER PROVISIONING
# =============================================================================


@router.post("/super-admin/verifiers")
async def provision_new_verifier(
    data: VerifierCreateRequest,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    user, raw_token = await PlatformService.provision_verifier(
        admin_user=current_admin,
        email=data.email,
        full_name=data.full_name,
        db=db,
        settings=settings,
    )
    await db.commit()
    return {
        "user_id": user.id,
        "email": user.email,
        "invitation_sent": bool(settings.RESEND_API_KEY or settings.MAIL_ENABLED),
        "raw_token": raw_token
        if (not settings.RESEND_API_KEY and not settings.MAIL_ENABLED)
        else None,
    }


@router.get("/super-admin/verifiers", response_model=list[SuperAdminProfileRead])
async def list_verifiers(
    current_admin: User = Depends(require_super_admin), db: AsyncSession = Depends(get_db)
) -> list[SuperAdminProfileRead]:
    stmt = (
        select(SuperAdminProfile)
        .options(selectinload(SuperAdminProfile.user))
        .order_by(SuperAdminProfile.created_at.desc())
    )
    res = await db.execute(stmt)
    return [SuperAdminProfileRead.model_validate(p) for p in res.scalars().all()]


@router.get("/super-admin/overview", response_model=SuperAdminOverviewResponse)
async def get_super_admin_overview(
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> SuperAdminOverviewResponse:
    """Global read-only platform operations overview for Super Admin."""
    from app.api.v1.dashboard import _build_super_admin_overview

    return await _build_super_admin_overview(db)


@router.get("/super-admin/studies/{study_id}/participants", response_model=list[ParticipantRead])
async def inspect_study_participants(
    study_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> list[ParticipantRead]:
    """Read-only study-scoped participant inspection for Super Admin."""
    from app.models.participant import Participant

    stmt = (
        select(Participant)
        .where(Participant.study_id == study_id)
        .offset(skip)
        .limit(limit)
    )
    res = await db.execute(stmt)
    return [ParticipantRead.model_validate(p) for p in res.scalars().all()]

