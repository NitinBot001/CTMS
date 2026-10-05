# CRO / Sponsor Platform — Source Field Data Dictionary

> **Purpose:** Maps every source-defined field to its canonical database representation.
> Generated from the CRO Dashboard / Data-Structure specification (Sections 1–31).

---

## Legend

| Abbreviation | Meaning |
|---|---|
| PK | Primary Key |
| FK | Foreign Key |
| UQ | Unique Constraint |
| IDX | Indexed |
| DERIVED | Computed from canonical records, not stored |
| TECHNICAL | Required by system, not from business source |
| FUTURE | Extension point for later phases |

---

## 1. Portfolio / Study Overview

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Portfolio | Total Studies | — | — | integer | — | — | — | DERIVED — `COUNT(studies)` | — | Not a stored field |
| Portfolio | Active Studies | — | — | integer | — | — | — | DERIVED — `COUNT(studies WHERE status='active')` | — | Not a stored field |
| Portfolio | Planned Studies | — | — | integer | — | — | — | DERIVED — `COUNT(studies WHERE status='planned')` | — | Not a stored field |
| Portfolio | Completed Studies | — | — | integer | — | — | — | DERIVED — `COUNT(studies WHERE status='completed')` | — | Not a stored field |
| Portfolio | Site Count | — | — | integer | — | — | — | DERIVED — `COUNT(DISTINCT study_sites)` | — | Not a stored field |
| Portfolio | Participant Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants)` | — | Not a stored field |
| Portfolio | Enrollment Trend | — | — | timeseries | — | — | — | DERIVED — participant records by date | — | Not a stored field |
| Portfolio | Delayed Studies | — | — | integer | — | — | — | DERIVED — studies past planned end date still active | — | Not a stored field |

## 2. Organization Master Data

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Organization | ID | organizations | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Organization | Name | organizations | name | varchar(255) | Yes | No | Yes | No | non-empty, max 255 | |
| Organization | Organization Type | organizations | organization_type | enum (cro, sponsor, institution, site_affiliate) | Yes | No | No (immutable after approval) | No | must be valid enum | Controlled vocabulary |
| Organization | Status | organizations | status | enum (draft, pending, active, suspended, deactivated) | Yes | No | Via state machine | No | valid transitions only | Workflow-controlled |
| Organization | Registration Number | organizations | registration_number | varchar(100) | No | Yes | Yes | No | format validation | Regulatory ID |
| Organization | Website | organizations | website | varchar(500) | No | Yes | Yes | No | URL format | |
| Organization | Phone | organizations | phone | varchar(50) | No | Yes | Yes | No | phone format | |
| Organization | Email | organizations | email | varchar(255) | No | Yes | Yes | No | email format | |
| Organization | Address Line 1 | organizations | address_line1 | varchar(255) | No | Yes | Yes | No | — | |
| Organization | Address Line 2 | organizations | address_line2 | varchar(255) | No | Yes | Yes | No | — | |
| Organization | City | organizations | city | varchar(100) | No | Yes | Yes | No | — | |
| Organization | State/Province | organizations | state | varchar(100) | No | Yes | Yes | No | — | |
| Organization | Country | organizations | country | varchar(100) | No | Yes | Yes | No | — | |
| Organization | Postal Code | organizations | postal_code | varchar(20) | No | Yes | Yes | No | — | |
| Organization | Created At | organizations | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Organization | Updated At | organizations | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 3. Onboarding / Application

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Onboarding | ID | onboarding_applications | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Onboarding | Organization | onboarding_applications | organization_id (FK) | UUID | Yes | No | No | No | must exist | FK → organizations |
| Onboarding | Status | onboarding_applications | status | enum (draft, submitted, under_review, returned, rejected, approved) | Yes | No | Via state machine | No | valid transitions | Workflow-controlled |
| Onboarding | Submitted At | onboarding_applications | submitted_at | timestamp | No | Yes | Set on submit | No | — | Immutable after set |
| Onboarding | Reviewed At | onboarding_applications | reviewed_at | timestamp | No | Yes | Set on review | No | — | |
| Onboarding | Reviewed By | onboarding_applications | reviewed_by (FK) | UUID | No | Yes | Set on review | No | must exist | FK → users |
| Onboarding | Return/Rejection Reason | onboarding_applications | review_notes | text | No | Yes | Set on return/reject | No | — | |
| Onboarding | Created At | onboarding_applications | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Onboarding | Updated At | onboarding_applications | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 4. Study Master Data

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Study | Study ID | studies | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Study | Study Code | studies | study_code | varchar(50) (UQ, IDX) | Yes | No | No (immutable) | No | unique, format | Business identifier |
| Study | Protocol Number | studies | protocol_number | varchar(100) (UQ, IDX) | Yes | No | Controlled | No | unique | Immutable after approval |
| Study | Study Title | studies | title | varchar(500) | Yes | No | Yes | No | non-empty | |
| Study | Short Title | studies | short_title | varchar(200) | No | Yes | Yes | No | max 200 | |
| Study | Study Type | studies | study_type | enum (interventional, observational, expanded_access) | Yes | No | Controlled | No | valid enum | |
| Study | Phase | studies | phase | enum (phase_1, phase_1_2, phase_2, phase_2_3, phase_3, phase_3_4, phase_4, na) | Yes | No | Controlled | No | valid enum | |
| Study | Sponsor | studies | sponsor_org_id (FK, IDX) | UUID | Yes | No | Controlled | No | must exist | FK → organizations |
| Study | CRO | studies | cro_org_id (FK, IDX) | UUID | No | Yes | Controlled | No | must exist if set | FK → organizations |
| Study | Therapeutic Area | studies | therapeutic_area | varchar(200) | Yes | No | Yes | No | — | |
| Study | Intervention Type | studies | intervention_type | varchar(200) | No | Yes | Yes | No | — | Drug/Device/Biological etc. |
| Study | Study Design | studies | study_design | varchar(200) | No | Yes | Yes | No | — | Parallel/Crossover etc. |
| Study | Blinding | studies | blinding | enum (open_label, single_blind, double_blind, triple_blind) | No | Yes | Controlled | No | valid enum | |
| Study | Randomization | studies | randomization | boolean | No | Yes | Yes | No | — | |
| Study | Planned Sample Size | studies | planned_sample_size | integer | No | Yes | Yes | No | > 0 | |
| Study | Study Start Date | studies | start_date | date | No | Yes | Yes | No | — | |
| Study | Study End Date | studies | end_date | date | No | Yes | Yes | No | ≥ start_date | |
| Study | Recruitment Start Date | studies | recruitment_start_date | date | No | Yes | Yes | No | — | |
| Study | Recruitment End Date | studies | recruitment_end_date | date | No | Yes | Yes | No | ≥ recruitment_start | |
| Study | Study Status | studies | status | enum (draft, planned, active, suspended, completed, terminated, withdrawn) | Yes | No | Via state machine | No | valid transitions | Workflow-controlled |
| Study | CTRI Status | studies | ctri_status | enum (not_registered, pending, registered) | No | Yes | Controlled | No | valid enum | |
| Study | CTRI Number | studies | ctri_number | varchar(50) (IDX) | No | Yes | Controlled | No | format: CTRI/... | |
| Study | EC Approval Status | studies | ec_approval_status | enum (not_submitted, pending, approved, conditional, rejected) | No | Yes | Via state machine | No | valid enum | |
| Study | Regulatory Status | studies | regulatory_status | enum (not_submitted, pending, approved, conditional, rejected) | No | Yes | Via state machine | No | valid enum | |
| Study | Description | studies | description | text | No | Yes | Yes | No | — | |
| Study | Created At | studies | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Study | Updated At | studies | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Study | Principal Investigator | — | — | — | — | — | — | DERIVED — via study_team_members (role=PI) | — | Relationship, not a column |
| Study | Study Coordinator | — | — | — | — | — | — | DERIVED — via study_team_members (role=coordinator) | — | Relationship, not a column |

## 5. Site Master Data

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Site | Site ID | sites | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Site | Site Code | sites | site_code | varchar(50) (UQ, IDX) | Yes | No | No (immutable) | No | unique | Business identifier |
| Site | Hospital/Institute Name | sites | name | varchar(300) | Yes | No | Yes | No | non-empty | |
| Site | Site Type | sites | site_type | enum (hospital, clinic, research_center, academic, other) | Yes | No | Yes | No | valid enum | |
| Site | Address Line 1 | sites | address_line1 | varchar(255) | No | Yes | Yes | No | — | |
| Site | Address Line 2 | sites | address_line2 | varchar(255) | No | Yes | Yes | No | — | |
| Site | City | sites | city | varchar(100) | No | Yes | Yes | No | — | |
| Site | State/Province | sites | state | varchar(100) | No | Yes | Yes | No | — | |
| Site | Country | sites | country | varchar(100) | No | Yes | Yes | No | — | |
| Site | Postal Code | sites | postal_code | varchar(20) | No | Yes | Yes | No | — | |
| Site | Phone | sites | phone | varchar(50) | No | Yes | Yes | No | — | |
| Site | Email | sites | email | varchar(255) | No | Yes | Yes | No | email format | |
| Site | Organization Affiliation | sites | organization_id (FK) | UUID | No | Yes | Yes | No | must exist if set | FK → organizations |
| Site | Status | sites | status | enum (active, inactive) | Yes | No | Yes | No | valid enum | Global site status |
| Site | Created At | sites | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Site | Updated At | sites | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 6. Study-Site Relationship

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| StudySite | ID | study_sites | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| StudySite | Study | study_sites | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| StudySite | Site | study_sites | site_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → sites |
| StudySite | Activation Status | study_sites | activation_status | enum (planned, initiated, activated, suspended, closed) | Yes | No | Via state machine | No | valid transitions | Study-specific |
| StudySite | EC Status | study_sites | ec_status | enum (not_submitted, pending, approved, conditional, rejected) | No | Yes | Controlled | No | valid enum | Study-site level |
| StudySite | Contract Status | study_sites | contract_status | enum (not_started, negotiating, executed, terminated) | No | Yes | Controlled | No | valid enum | |
| StudySite | Recruitment Target | study_sites | recruitment_target | integer | No | Yes | Yes | No | ≥ 0 | Study-specific |
| StudySite | Monitoring Status | study_sites | monitoring_status | enum (not_started, ongoing, completed) | No | Yes | Yes | No | valid enum | |
| StudySite | Activation Date | study_sites | activation_date | date | No | Yes | Set on activate | No | — | |
| StudySite | Created At | study_sites | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| StudySite | Updated At | study_sites | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| StudySite | UQ Constraint | study_sites | — | — | — | — | — | — | UNIQUE(study_id, site_id) | Prevents duplicate assignments |

## 7. Study Team

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| StudyTeam | ID | study_team_members | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| StudyTeam | Study | study_team_members | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| StudyTeam | User | study_team_members | user_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → users |
| StudyTeam | Role | study_team_members | role_id (FK) | UUID | Yes | No | Yes | No | must exist | FK → roles |
| StudyTeam | Site (scope) | study_team_members | site_id (FK) | UUID | No | Yes | Yes | No | must exist if set | FK → sites; null = study-wide |
| StudyTeam | Assignment Status | study_team_members | assignment_status | enum (active, inactive, removed) | Yes | No | Yes | No | valid enum | |
| StudyTeam | Start Date | study_team_members | start_date | date | No | Yes | Yes | No | — | |
| StudyTeam | End Date | study_team_members | end_date | date | No | Yes | Yes | No | ≥ start_date | |
| StudyTeam | Created At | study_team_members | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| StudyTeam | Updated At | study_team_members | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 8. Participant / Enrollment

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Participant | ID | participants | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Participant | Participant Code | participants | participant_code | varchar(50) (UQ, IDX) | Yes | No | No (immutable) | No | unique per study | Business identifier |
| Participant | Study | participants | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Participant | Site | participants | site_id (FK, IDX) | UUID | No | Yes | Yes | No | must exist if set | FK → sites |
| Participant | Status | participants | status | enum (screened, eligible, screen_failed, randomized, enrolled, active, completed, withdrawn, discontinued) | Yes | No | Via state machine | No | valid transitions | Lifecycle-controlled |
| Participant | Screening Date | participants | screening_date | date | No | Yes | Yes | No | — | |
| Participant | Enrollment Date | participants | enrollment_date | date | No | Yes | Set on enroll | No | — | |
| Participant | Randomization Date | participants | randomization_date | date | No | Yes | Set on randomize | No | — | |
| Participant | Completion Date | participants | completion_date | date | No | Yes | Set on complete | No | — | |
| Participant | Withdrawal Date | participants | withdrawal_date | date | No | Yes | Set on withdraw | No | — | |
| Participant | Withdrawal Reason | participants | withdrawal_reason | text | No | Yes | Set on withdraw | No | — | |
| Participant | Created At | participants | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Participant | Updated At | participants | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Enrollment | Screened Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status IN ('screened',...))` | — | Not stored |
| Enrollment | Eligible Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='eligible')` | — | Not stored |
| Enrollment | Randomized Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='randomized')` | — | Not stored |
| Enrollment | Enrolled Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='enrolled')` | — | Not stored |
| Enrollment | Active Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='active')` | — | Not stored |
| Enrollment | Completed Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='completed')` | — | Not stored |
| Enrollment | Withdrawn Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='withdrawn')` | — | Not stored |
| Enrollment | Screen Failure Count | — | — | integer | — | — | — | DERIVED — `COUNT(participants WHERE status='screen_failed')` | — | Not stored |
| Enrollment | Enrollment by Site | — | — | aggregation | — | — | — | DERIVED — `GROUP BY site_id` | — | Not stored |
| Enrollment | Enrollment Trend | — | — | timeseries | — | — | — | DERIVED — participant enrollment_date histogram | — | Not stored |

## 9. Study Progress

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Milestone | ID | study_milestones | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Milestone | Study | study_milestones | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Milestone | Title | study_milestones | title | varchar(300) | Yes | No | Yes | No | non-empty | |
| Milestone | Description | study_milestones | description | text | No | Yes | Yes | No | — | |
| Milestone | Planned Date | study_milestones | planned_date | date | No | Yes | Yes | No | — | |
| Milestone | Actual Date | study_milestones | actual_date | date | No | Yes | Yes | No | — | |
| Milestone | Status | study_milestones | status | enum (pending, in_progress, completed, delayed, cancelled) | Yes | No | Yes | No | valid enum | |
| Milestone | Created At | study_milestones | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Milestone | Updated At | study_milestones | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Progress | Recruitment Progress | — | — | percentage | — | — | — | DERIVED — enrolled / planned_sample_size | — | Not stored |
| Progress | Visit Completion | — | — | percentage | — | — | — | DERIVED — from visit records | — | FUTURE |
| Progress | Data Completeness | — | — | percentage | — | — | — | DERIVED — from data entry records | — | FUTURE |
| Progress | Delays | — | — | count | — | — | — | DERIVED — milestones past planned_date | — | Not stored |

## 10. Safety / Pharmacovigilance

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Safety | ID | adverse_events | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Safety | Study | adverse_events | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Safety | Participant | adverse_events | participant_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → participants |
| Safety | Site | adverse_events | site_id (FK, IDX) | UUID | No | Yes | No | No | must exist if set | FK → sites |
| Safety | Event Type | adverse_events | event_type | enum (ae, sae, susar) | Yes | No | Controlled | No | valid enum | |
| Safety | Description | adverse_events | description | text | Yes | No | Yes | No | non-empty | |
| Safety | Onset Date | adverse_events | onset_date | date | Yes | No | Yes | No | — | |
| Safety | Resolution Date | adverse_events | resolution_date | date | No | Yes | Yes | No | ≥ onset_date | |
| Safety | Seriousness | adverse_events | seriousness | enum (non_serious, serious) | Yes | No | Controlled | No | valid enum | |
| Safety | Severity | adverse_events | severity | enum (mild, moderate, severe, life_threatening, fatal) | Yes | No | Yes | No | valid enum | |
| Safety | Causality | adverse_events | causality | enum (unrelated, unlikely, possible, probable, definite) | No | Yes | Yes | No | valid enum | |
| Safety | Expectedness | adverse_events | expectedness | enum (expected, unexpected) | No | Yes | Yes | No | valid enum | |
| Safety | Action Taken | adverse_events | action_taken | varchar(500) | No | Yes | Yes | No | — | |
| Safety | Outcome | adverse_events | outcome | enum (recovered, recovering, not_recovered, fatal, unknown) | No | Yes | Yes | No | valid enum | |
| Safety | Reporting Deadline | adverse_events | reporting_deadline | date | No | Yes | Yes | No | — | |
| Safety | Status | adverse_events | status | enum (open, under_review, closed) | Yes | No | Via state machine | No | valid transitions | |
| Safety | Reported By | adverse_events | reported_by (FK) | UUID | No | Yes | No | No | must exist if set | FK → users |
| Safety | Created At | adverse_events | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Safety | Updated At | adverse_events | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Safety | Open Cases | — | — | integer | — | — | — | DERIVED — `COUNT(adverse_events WHERE status='open')` | — | Not stored |
| Safety | Closed Cases | — | — | integer | — | — | — | DERIVED — `COUNT(adverse_events WHERE status='closed')` | — | Not stored |
| Safety | Site-wise Trends | — | — | aggregation | — | — | — | DERIVED — `GROUP BY site_id` | — | Not stored |

## 11. Compliance & Regulatory

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Ethics | ID | ethics_approvals | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Ethics | Study | ethics_approvals | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Ethics | Site | ethics_approvals | site_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → sites |
| Ethics | Committee Name | ethics_approvals | committee_name | varchar(300) | Yes | No | Yes | No | non-empty | |
| Ethics | Approval Number | ethics_approvals | approval_number | varchar(100) | No | Yes | Yes | No | — | |
| Ethics | Status | ethics_approvals | status | enum (not_submitted, pending, approved, conditional, rejected, expired) | Yes | No | Controlled | No | valid enum | |
| Ethics | Submission Date | ethics_approvals | submission_date | date | No | Yes | Yes | No | — | |
| Ethics | Approval Date | ethics_approvals | approval_date | date | No | Yes | Yes | No | — | |
| Ethics | Expiry Date | ethics_approvals | expiry_date | date | No | Yes | Yes | No | — | IDX for expiring alerts |
| Ethics | Created At | ethics_approvals | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Ethics | Updated At | ethics_approvals | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Regulatory | ID | regulatory_submissions | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Regulatory | Study | regulatory_submissions | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Regulatory | Submission Type | regulatory_submissions | submission_type | varchar(200) | Yes | No | Yes | No | non-empty | |
| Regulatory | Authority | regulatory_submissions | authority | varchar(300) | Yes | No | Yes | No | — | |
| Regulatory | Reference Number | regulatory_submissions | reference_number | varchar(100) | No | Yes | Yes | No | — | |
| Regulatory | Status | regulatory_submissions | status | enum (draft, submitted, under_review, approved, rejected) | Yes | No | Controlled | No | valid enum | |
| Regulatory | Submission Date | regulatory_submissions | submission_date | date | No | Yes | Yes | No | — | |
| Regulatory | Approval Date | regulatory_submissions | approval_date | date | No | Yes | Yes | No | — | |
| Regulatory | Created At | regulatory_submissions | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Regulatory | Updated At | regulatory_submissions | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| Deviation | ID | protocol_deviations | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Deviation | Study | protocol_deviations | study_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → studies |
| Deviation | Site | protocol_deviations | site_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → sites |
| Deviation | Participant | protocol_deviations | participant_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → participants |
| Deviation | Category | protocol_deviations | category | varchar(200) | Yes | No | Yes | No | non-empty | |
| Deviation | Description | protocol_deviations | description | text | Yes | No | Yes | No | non-empty | |
| Deviation | Severity | protocol_deviations | severity | enum (minor, major, critical) | Yes | No | Yes | No | valid enum | |
| Deviation | Status | protocol_deviations | status | enum (identified, reported, resolved) | Yes | No | Controlled | No | valid enum | |
| Deviation | Identified Date | protocol_deviations | identified_date | date | Yes | No | Yes | No | — | |
| Deviation | Resolution Date | protocol_deviations | resolution_date | date | No | Yes | Yes | No | — | |
| Deviation | Created At | protocol_deviations | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Deviation | Updated At | protocol_deviations | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| CAPA | ID | capa_records | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| CAPA | Study | capa_records | study_id (FK, IDX) | UUID | No | Yes | No | No | must exist if set | FK → studies |
| CAPA | Organization | capa_records | organization_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → organizations |
| CAPA | Related Deviation | capa_records | deviation_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → protocol_deviations |
| CAPA | Type | capa_records | capa_type | enum (corrective, preventive) | Yes | No | Yes | No | valid enum | |
| CAPA | Description | capa_records | description | text | Yes | No | Yes | No | non-empty | |
| CAPA | Status | capa_records | status | enum (open, in_progress, completed, verified) | Yes | No | Controlled | No | valid enum | |
| CAPA | Due Date | capa_records | due_date | date | No | Yes | Yes | No | — | |
| CAPA | Completed Date | capa_records | completed_date | date | No | Yes | Yes | No | — | |
| CAPA | Assigned To | capa_records | assigned_to (FK) | UUID | No | Yes | Yes | No | must exist if set | FK → users |
| CAPA | Created At | capa_records | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| CAPA | Updated At | capa_records | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 12. Documents

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Document | ID | documents | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Document | Organization | documents | organization_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → organizations |
| Document | Study | documents | study_id (FK, IDX) | UUID | No | Yes | No | No | must exist if set | FK → studies |
| Document | Site | documents | site_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → sites |
| Document | Document Type | documents | document_type | enum (protocol, investigator_brochure, icf, ec_document, regulatory, contract, training, essential, other) | Yes | No | Yes | No | valid enum | Controlled vocabulary |
| Document | Title | documents | title | varchar(500) | Yes | No | Yes | No | non-empty | |
| Document | Version | documents | version | varchar(50) | Yes | No | No (new version = new record) | No | — | Versioned |
| Document | Status | documents | status | enum (draft, under_review, approved, superseded, expired, archived) | Yes | No | Controlled | No | valid enum | |
| Document | Expiry Date | documents | expiry_date | date | No | Yes | Yes | No | — | IDX for expiring alerts |
| Document | Storage Key | documents | storage_key | varchar(1000) | Yes | No | No | No | non-empty | Object storage ref |
| Document | File Name | documents | file_name | varchar(500) | Yes | No | No | No | non-empty | Original filename |
| Document | File Size | documents | file_size | bigint | No | Yes | No | No | ≥ 0 | Bytes |
| Document | MIME Type | documents | mime_type | varchar(100) | No | Yes | No | No | — | |
| Document | Checksum | documents | checksum | varchar(128) | No | Yes | No | No | — | SHA-256 |
| Document | Uploaded By | documents | uploaded_by (FK) | UUID | Yes | No | No | No | must exist | FK → users |
| Document | Approved By | documents | approved_by (FK) | UUID | No | Yes | Set on approve | No | must exist if set | FK → users |
| Document | Approved At | documents | approved_at | timestamp | No | Yes | Set on approve | No | — | |
| Document | Created At | documents | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Document | Updated At | documents | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |

## 13. Users & RBAC

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| User | ID | users | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| User | Email | users | email | varchar(255) (UQ) | Yes | No | Yes | No | email, unique | Login identifier |
| User | Full Name | users | full_name | varchar(200) | Yes | No | Yes | No | non-empty | |
| User | Phone | users | phone | varchar(50) | No | Yes | Yes | No | — | |
| User | Status | users | status | enum (active, inactive, suspended) | Yes | No | Yes | No | valid enum | |
| User | Hashed Password | users | hashed_password | varchar(255) | Yes | No | Yes | No | — | argon2id/bcrypt |
| User | Created At | users | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| User | Updated At | users | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| OrgMember | ID | organization_members | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| OrgMember | User | organization_members | user_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → users |
| OrgMember | Organization | organization_members | organization_id (FK, IDX) | UUID | Yes | No | No | No | must exist | FK → organizations |
| OrgMember | Role | organization_members | role_id (FK) | UUID | Yes | No | Yes | No | must exist | FK → roles |
| OrgMember | Status | organization_members | status | enum (active, inactive) | Yes | No | Yes | No | valid enum | |
| OrgMember | Joined At | organization_members | joined_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| OrgMember | Created At | organization_members | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| OrgMember | Updated At | organization_members | updated_at | timestamp | Yes | No | Auto | No | auto-set | TECHNICAL |
| OrgMember | UQ Constraint | organization_members | — | — | — | — | — | — | UNIQUE(user_id, organization_id) | One membership per org |
| Role | ID | roles | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Role | Name | roles | name | varchar(100) (UQ) | Yes | No | Yes | No | non-empty, unique | |
| Role | Description | roles | description | text | No | Yes | Yes | No | — | |
| Role | Scope Level | roles | scope_level | enum (system, organization, study, site) | Yes | No | No | No | valid enum | Immutable |
| Role | Is System Role | roles | is_system_role | boolean | Yes | No | No | No | — | Prevents deletion |
| Role | Created At | roles | created_at | timestamp | Yes | No | No | No | auto-set | TECHNICAL |
| Permission | ID | permissions | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Permission | Codename | permissions | codename | varchar(100) (UQ) | Yes | No | No | No | unique, snake_case | e.g. study.create |
| Permission | Description | permissions | description | text | No | Yes | Yes | No | — | |
| Permission | Resource | permissions | resource | varchar(100) | Yes | No | No | No | — | e.g. study, site |
| Permission | Action | permissions | action | varchar(50) | Yes | No | No | No | — | e.g. create, read |
| RolePerm | Role | role_permissions | role_id (FK) | UUID | Yes | No | No | No | must exist | FK → roles |
| RolePerm | Permission | role_permissions | permission_id (FK) | UUID | Yes | No | No | No | must exist | FK → permissions |
| RolePerm | PK | role_permissions | — | — | — | — | — | — | PRIMARY KEY(role_id, permission_id) | Composite PK |

## 14. Audit Trail

| Domain | Field | Entity | DB Column / Relation | Data Type | Required | Nullable | Editable | Derived? | Validation | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Audit | ID | audit_logs | id | UUID (PK) | Yes | No | No | No | auto-generated | TECHNICAL |
| Audit | Timestamp | audit_logs | timestamp | timestamp | Yes | No | No | No | auto-set | |
| Audit | User | audit_logs | user_id (FK) | UUID | No | Yes | No | No | must exist if set | FK → users; null = system |
| Audit | Action | audit_logs | action | varchar(100) | Yes | No | No | No | non-empty | e.g. study.created |
| Audit | Resource Type | audit_logs | resource_type | varchar(100) | Yes | No | No | No | non-empty | e.g. study |
| Audit | Resource ID | audit_logs | resource_id | UUID | Yes | No | No | No | — | ID of affected entity |
| Audit | Changes | audit_logs | changes | JSONB | No | Yes | No | No | — | {field: {old, new}} |
| Audit | IP Address | audit_logs | ip_address | varchar(45) | No | Yes | No | No | — | TECHNICAL |
| Audit | Previous Hash | audit_logs | previous_hash | varchar(64) | No | Yes | No | No | — | Hash-chaining |
| Audit | Entry Hash | audit_logs | entry_hash | varchar(64) | Yes | No | No | No | SHA-256 | Tamper detection |

---

## 15. Reports & Analytics

All report/analytics fields (study performance, site performance, enrollment metrics, safety trends, deviation counts, compliance status, document status) are **DERIVED** from the canonical entities listed above. No dedicated storage tables are required at this phase.

Dedicated `scheduled_reports` table: **FUTURE** — will be added when scheduled export functionality is implemented.
