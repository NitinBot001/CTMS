from __future__ import annotations

import enum


class OrganizationType(str, enum.Enum):
    cro = "cro"
    sponsor = "sponsor"
    institution = "institution"
    site_affiliate = "site_affiliate"


class OrganizationStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    active = "active"
    suspended = "suspended"
    deactivated = "deactivated"


class OnboardingStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    returned = "returned"
    rejected = "rejected"
    approved = "approved"


class StudyType(str, enum.Enum):
    interventional = "interventional"
    observational = "observational"
    expanded_access = "expanded_access"


class StudyPhase(str, enum.Enum):
    phase_1 = "phase_1"
    phase_1_2 = "phase_1_2"
    phase_2 = "phase_2"
    phase_2_3 = "phase_2_3"
    phase_3 = "phase_3"
    phase_3_4 = "phase_3_4"
    phase_4 = "phase_4"
    na = "na"


class StudyStatus(str, enum.Enum):
    draft = "draft"
    planned = "planned"
    active = "active"
    suspended = "suspended"
    completed = "completed"
    terminated = "terminated"
    withdrawn = "withdrawn"


class BlindingType(str, enum.Enum):
    open_label = "open_label"
    single_blind = "single_blind"
    double_blind = "double_blind"
    triple_blind = "triple_blind"


class CTRIStatus(str, enum.Enum):
    not_registered = "not_registered"
    pending = "pending"
    registered = "registered"


class ApprovalStatus(str, enum.Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    approved = "approved"
    conditional = "conditional"
    rejected = "rejected"


class RegulatoryStatus(str, enum.Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    approved = "approved"
    conditional = "conditional"
    rejected = "rejected"


class SiteType(str, enum.Enum):
    hospital = "hospital"
    clinic = "clinic"
    research_center = "research_center"
    academic = "academic"
    other = "other"


class SiteStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class StudySiteActivationStatus(str, enum.Enum):
    planned = "planned"
    initiated = "initiated"
    activated = "activated"
    suspended = "suspended"
    closed = "closed"


class ContractStatus(str, enum.Enum):
    not_started = "not_started"
    negotiating = "negotiating"
    executed = "executed"
    terminated = "terminated"


class MonitoringStatus(str, enum.Enum):
    not_started = "not_started"
    ongoing = "ongoing"
    completed = "completed"


class ECStatus(str, enum.Enum):
    not_submitted = "not_submitted"
    pending = "pending"
    approved = "approved"
    conditional = "conditional"
    rejected = "rejected"
    expired = "expired"


class AssignmentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    removed = "removed"


class ParticipantStatus(str, enum.Enum):
    screened = "screened"
    eligible = "eligible"
    screen_failed = "screen_failed"
    randomized = "randomized"
    enrolled = "enrolled"
    active = "active"
    completed = "completed"
    withdrawn = "withdrawn"
    discontinued = "discontinued"


class MilestoneStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    delayed = "delayed"
    cancelled = "cancelled"


class AdverseEventType(str, enum.Enum):
    ae = "ae"
    sae = "sae"
    susar = "susar"


class Seriousness(str, enum.Enum):
    non_serious = "non_serious"
    serious = "serious"


class Severity(str, enum.Enum):
    mild = "mild"
    moderate = "moderate"
    severe = "severe"
    life_threatening = "life_threatening"
    fatal = "fatal"


class Causality(str, enum.Enum):
    unrelated = "unrelated"
    unlikely = "unlikely"
    possible = "possible"
    probable = "probable"
    definite = "definite"


class Expectedness(str, enum.Enum):
    expected = "expected"
    unexpected = "unexpected"


class AEOutcome(str, enum.Enum):
    recovered = "recovered"
    recovering = "recovering"
    not_recovered = "not_recovered"
    fatal = "fatal"
    unknown = "unknown"


class AEStatus(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    closed = "closed"


class DeviationSeverity(str, enum.Enum):
    minor = "minor"
    major = "major"
    critical = "critical"


class DeviationStatus(str, enum.Enum):
    identified = "identified"
    reported = "reported"
    resolved = "resolved"


class CAPAType(str, enum.Enum):
    corrective = "corrective"
    preventive = "preventive"


class CAPAStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    verified = "verified"


class DocumentType(str, enum.Enum):
    protocol = "protocol"
    investigator_brochure = "investigator_brochure"
    icf = "icf"
    ec_document = "ec_document"
    regulatory = "regulatory"
    contract = "contract"
    training = "training"
    essential = "essential"
    other = "other"


class DocumentStatus(str, enum.Enum):
    draft = "draft"
    under_review = "under_review"
    approved = "approved"
    superseded = "superseded"
    expired = "expired"
    archived = "archived"


class UserStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class ScopeLevel(str, enum.Enum):
    system = "system"
    organization = "organization"
    study = "study"
    site = "site"
