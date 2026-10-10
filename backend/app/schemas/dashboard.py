from __future__ import annotations

import datetime
import uuid
from typing import Any

from pydantic import BaseModel


class SuperAdminStudyItem(BaseModel):
    id: uuid.UUID
    study_code: str
    protocol_number: str
    title: str
    phase: str
    status: str
    sponsor_name: str | None = None
    cro_name: str | None = None
    participating_sites_count: int
    participant_count: int
    participant_status_distribution: dict[str, int]
    pending_milestones_count: int
    completed_milestones_count: int


class SuperAdminOrgItem(BaseModel):
    id: uuid.UUID
    name: str
    organization_type: str
    registration_number: str | None = None
    status: str
    city: str | None = None
    state: str | None = None
    studies_count: int


class SuperAdminOverviewResponse(BaseModel):
    is_read_only: bool = True
    total_sponsors: int
    total_cros: int
    total_studies: int
    sponsors: list[SuperAdminOrgItem]
    cros: list[SuperAdminOrgItem]
    studies: list[SuperAdminStudyItem]


class ResearchPIStudyItem(BaseModel):
    id: uuid.UUID
    study_code: str
    protocol_number: str
    title: str
    phase: str
    status: str
    active_sites_count: int
    enrolled_participants: int
    planned_sample_size: int | None = None
    pending_milestones: int


class ResearchPIDashboardResponse(BaseModel):
    studies: list[ResearchPIStudyItem]
    active_sites_count: int
    pending_team_invitations: int
    upcoming_milestones: list[dict[str, Any]]


class CROStudyItem(BaseModel):
    id: uuid.UUID
    study_code: str
    protocol_number: str
    title: str
    phase: str
    status: str
    sponsor_name: str | None = None
    active_sites_count: int
    enrolled_participants: int
    planned_sample_size: int | None = None


class CROSiteRequestItem(BaseModel):
    id: uuid.UUID
    study_id: uuid.UUID
    study_title: str
    site_id: uuid.UUID
    site_name: str
    site_code: str
    government_status: str
    site_status: str
    status: str
    created_at: datetime.datetime


class CRODashboardResponse(BaseModel):
    studies: list[CROStudyItem]
    eligible_sites_count: int
    pending_site_requests_count: int
    total_participants_in_scope: int
    recent_site_requests: list[CROSiteRequestItem]


class SiteIncomingRequestItem(BaseModel):
    id: uuid.UUID
    study_id: uuid.UUID
    study_title: str
    study_code: str
    requester_name: str
    government_status: str
    site_status: str
    status: str
    created_at: datetime.datetime


class SitePIDashboardResponse(BaseModel):
    site_id: uuid.UUID | None = None
    site_name: str | None = None
    site_code: str | None = None
    city: str | None = None
    active_studies_count: int
    pending_requests_count: int
    participants_count: int
    open_safety_events: int
    incoming_requests: list[SiteIncomingRequestItem]


class DashboardSummaryResponse(BaseModel):
    role: str  # "super_admin" | "research_pi" | "cro" | "site_pi" | "unassigned"
    super_admin: SuperAdminOverviewResponse | None = None
    research_pi: ResearchPIDashboardResponse | None = None
    cro: CRODashboardResponse | None = None
    site_pi: SitePIDashboardResponse | None = None
