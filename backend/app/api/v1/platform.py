from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.enums import OnboardingRequestStatus, UserStatus
from app.models.platform import OnboardingRequest
from app.models.user import User
from app.schemas.platform import (
    ActivationRequest,
    ActivationResponse,
    ChangePasswordRequest,
    OnboardingRequestCreate,
    OnboardingRequestRead,
    OnboardingRequestReview,
    ProvisionResult,
    SuperAdminProfileRead,
)
from app.services.platform import PlatformService

router = APIRouter(prefix="/platform", tags=["Platform & Super Admin"])

async def require_super_admin(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
) -> User:
    is_super = await PlatformService.is_super_admin(current_user, db)
    if not is_super:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required")
    return current_user


@router.post("/onboarding-requests", response_model=OnboardingRequestRead, status_code=status.HTTP_201_CREATED)
async def submit_onboarding_request(
    request_data: OnboardingRequestCreate,
    db: AsyncSession = Depends(get_db)
) -> OnboardingRequestRead:
    new_request = OnboardingRequest(**request_data.model_dump())
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return OnboardingRequestRead.model_validate(new_request)


@router.get("/onboarding-requests", response_model=list[OnboardingRequestRead])
async def list_onboarding_requests(
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
) -> list[OnboardingRequestRead]:
    stmt = select(OnboardingRequest).order_by(OnboardingRequest.created_at.desc())
    res = await db.execute(stmt)
    return [OnboardingRequestRead.model_validate(r) for r in res.scalars().all()]


@router.get("/onboarding-requests/{request_id}", response_model=OnboardingRequestRead)
async def get_onboarding_request(
    request_id: uuid.UUID,
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
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
            OnboardingRequestStatus.changes_requested
        ],
        OnboardingRequestStatus.changes_requested: [
            OnboardingRequestStatus.under_review,
            OnboardingRequestStatus.rejected
        ]
    }
    
    if review_data.status not in valid_transitions.get(request.status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {request.status} to {review_data.status}"
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
    settings: Settings = Depends(get_settings)
) -> ProvisionResult:
    # First do a fast check before transaction
    stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id)
    res = await db.execute(stmt)
    request = res.scalars().first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if request.status == OnboardingRequestStatus.approved:
        if not request.provisioned_organization_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request marked approved but provisioned_organization_id is missing",
            )
        # Already approved, idempotent response
        return ProvisionResult(
            organization_id=request.provisioned_organization_id,
            user_email=request.email,
            invitation_sent=False,
            raw_token=None,
        )
        
    if request.status != OnboardingRequestStatus.under_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request must be under_review to be approved"
        )
        
    try:
        result = await PlatformService.provision_organization_from_request(
            request_id=request_id,
            reviewer_user=current_admin,
            db=db,
            settings=settings
        )
        await db.commit()
        return ProvisionResult(**result)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/activate", response_model=ActivationResponse)
async def activate_account(
    activation_data: ActivationRequest,
    db: AsyncSession = Depends(get_db)
) -> ActivationResponse:
    token_record = await PlatformService.verify_and_consume_invitation_token(activation_data.token, db)
    if not token_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
        
    # Find user
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
    
    return ActivationResponse(
        message="Account activated successfully",
        email=user.email
    )


@router.get("/super-admin/me", response_model=SuperAdminProfileRead)
async def get_super_admin_profile(
    current_admin: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
) -> SuperAdminProfileRead:
    from app.models.user import SuperAdminProfile
    
    stmt = select(SuperAdminProfile).options(selectinload(SuperAdminProfile.user)).where(SuperAdminProfile.user_id == current_admin.id)
    res = await db.execute(stmt)
    profile = res.scalars().first()
    
    return SuperAdminProfileRead.model_validate(profile)


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        
    current_user.hashed_password = hash_password(password_data.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.datetime.now(datetime.UTC)
    
    await db.commit()
    
    return {"message": "Password changed successfully"}
