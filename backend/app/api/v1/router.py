from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.audit import router as audit_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.documents import router as documents_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.participants import router as participants_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.safety import router as safety_router
from app.api.v1.sites import router as sites_router
from app.api.v1.studies import router as studies_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(organizations_router)
api_router.include_router(studies_router)
api_router.include_router(sites_router)
api_router.include_router(participants_router)
api_router.include_router(safety_router)
api_router.include_router(compliance_router)
api_router.include_router(documents_router)
api_router.include_router(portfolio_router)
api_router.include_router(audit_router)
api_router.include_router(users_router)
