from __future__ import annotations

from pydantic import BaseModel


class PortfolioStudiesSummary(BaseModel):
    total: int
    active: int
    planned: int
    completed: int
    delayed: int


class PortfolioSitesSummary(BaseModel):
    total_registered: int
    currently_activated: int


class PortfolioParticipantsSummary(BaseModel):
    total_screened: int
    actual_enrolled: int
    active_in_treatment: int
    screen_failures: int


class PortfolioSafetySummary(BaseModel):
    open_cases: int
    open_serious_cases: int


class PortfolioOverviewResponse(BaseModel):
    as_of_date: str
    studies: PortfolioStudiesSummary
    sites: PortfolioSitesSummary
    participants: PortfolioParticipantsSummary
    safety: PortfolioSafetySummary


class PortfolioHealthIndicators(BaseModel):
    delayed_studies: int
    open_serious_adverse_events: int
    critical_unresolved_deviations: int
    expired_ethics_approvals: int


class PortfolioHealthResponse(BaseModel):
    status: str
    risk_level: str
    as_of_date: str
    indicators: PortfolioHealthIndicators
    summary: str


class PortfolioAlertItem(BaseModel):
    type: str
    severity: str
    title: str
    description: str
    study_id: str
    due_date: str | None = None


class UpcomingMilestoneItem(BaseModel):
    id: str
    study_id: str
    study_code: str | None = None
    title: str
    description: str | None = None
    status: str
    planned_date: str | None = None
    actual_date: str | None = None


class EnrollmentTrendPoint(BaseModel):
    date: str | None = None
    enrolled_count: int
    cumulative_count: int


class SiteEnrollmentItem(BaseModel):
    site_id: str
    site_code: str | None = None
    site_name: str | None = None
    recruitment_target: int
    actual_enrolled: int
    recruitment_percentage: float
    activation_status: str


class StudyRecruitmentMetrics(BaseModel):
    planned_sample_size: int
    actual_enrolled: int
    recruitment_percentage: float
    status_breakdown: dict[str, int]


class StudySitesMetrics(BaseModel):
    total_assigned: int
    activated: int


class StudySafetyMetrics(BaseModel):
    total_adverse_events: int
    serious_adverse_events: int


class StudyComplianceMetrics(BaseModel):
    total_deviations: int


class StudyMetricsResponse(BaseModel):
    study_id: str
    study_code: str
    title: str
    phase: str
    status: str
    is_delayed: bool
    recruitment: StudyRecruitmentMetrics
    sites: StudySitesMetrics
    safety: StudySafetyMetrics
    compliance: StudyComplianceMetrics
