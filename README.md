# AIIA CTMS — Clinical Trial Management System
### Principal Investigator (PI) Operational Dashboard

[![Verification Status](https://img.shields.io/badge/Verification%20Ladder-PASS%20(123%2F123)-1F5C3F?style=flat-square)](file:///Users/siddhantsoni/ctms/CTMS/src/tests/services.test.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square)](file:///Users/siddhantsoni/ctms/CTMS/tsconfig.json)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square)](file:///Users/siddhantsoni/ctms/CTMS/package.json)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square)](file:///Users/siddhantsoni/ctms/CTMS/vite.config.ts)

A specialized, web-based Clinical Trial Management System (CTMS) designed for **Principal Investigators (PI)** and clinical trial staff at the **All India Institute of Ayurveda (AIIA)**. 

The system provides complete operational control, pharmacovigilance vigilance, protocol compliance tracking, staff delegation matrices, trial binder document management, and regulatory report exports with zero cloud egress or external data leaks.

---

## 🏛️ Clinical Domain Architecture

The platform is designed around strict **ICH-GCP E6 (R2)** and **ICH-GCP E2A** clinical standards, enforcing clear separations of concerns across trial domains:

```
┌────────────────────────────────────────────────────────┐
│               React 19 Presentation UI                 │
│        (Pages, Components, Badges, Modals)             │
└───────────────────────────┬────────────────────────────┘
                            │ (Typed DTOs & Contracts)
┌───────────────────────────▼────────────────────────────┐
│                    Service Layer                       │
│  (Validation, Business Rules, Permission Verification) │
└───────────────────────────┬────────────────────────────┘
                            │ (IRepository Interfaces)
┌───────────────────────────▼────────────────────────────┐
│                   Repository Layer                     │
│    (Scoped Queries, Isolation, Storage Adapters)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         Synthetic Seed & Mock Dataset Layer            │
│       (Deterministic, API-ready, Safe Offline)         │
└────────────────────────────────────────────────────────┘
```

* **Zero Second Source of Truth:** Reporting and analytical modules aggregate directly from core domain services rather than duplicating data.
* **Zero Raw Mock Imports in UI:** Components and pages interact exclusively with typed service interfaces, guaranteeing zero UI rewrites when connecting to future backend APIs.

---

## 🚀 Key Functional Modules

### 1. PI Overview & Control Center (`/pi/dashboard`)
* Active Study & Site context switcher with immediate scope isolation.
* Real-time KPI summary counters: Subject recruitment, scheduled visits, open safety events, protocol deviations, and pending action items.
* Recruitment milestone progress gauges and subject distribution breakdown.
* Recent operational audit metadata feed.

### 2. Participant Management (`/pi/patients`)
* Scoped operational subject directory with case-insensitive search (Subject ID, Screening ID, Initials).
* Multi-criteria composite filters (Enrollment Status, Sex, Coordinator, Attention Required).
* Detailed subject profile (`/pi/patients/:participantId`) featuring protocol visit history, safety event logs, and clinical milestones.

### 3. Visits & Clinical Activities (`/pi/visits`)
* Site-level clinical visit calendar and milestone scheduler.
* Protocol window compliance engine evaluating target offsets and allowable windows ($\pm\text{days}$).
* Deterministic status evaluation (`SCHEDULED`, `DUE`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `MISSED`, `CANCELLED`).
* Procedural activity checklist with interactive staff completion tracking.

### 4. Safety & Pharmacovigilance (`/pi/safety`)
* Adverse Event (AE) and Serious Adverse Event (SAE) registry.
* **ICH-GCP E2A Compliance:** Full decoupling of **Severity** (intensity: *Mild/Moderate/Severe*), **Seriousness** (regulatory outcome: *Hospitalization/Death/Life-Threatening/etc.*), and **Causality** (*Unlikely/Possible/Probable/Definite*).
* Clinical narrative record, investigator assessment, and interactive PI review sign-off workflow.

### 5. Protocol Compliance & Deviations (`/pi/compliance`)
* Protocol deviation tracking categorized across Participant, Site, and Study scopes.
* Deviation classification (*Minor, Major, Critical*) measuring protocol integrity impact without conflating clinical safety severity.
* Independent CAPA (Corrective and Preventive Action) lifecycle tracking (*Not Required, Pending, In Progress, Completed, Overdue*).
* Enforced state transition map preventing illegal lifecycle status jumps.

### 6. Team & Custom Delegations (`/pi/team`)
* Clinical staff directory strictly scoped to the active Study and Site.
* **Decoupled Permissions and Scopes:** Controlled 24-permission catalog across 9 functional modules; roles determine *what* an investigator can do, while Scope determines *where* actions apply.
* System role templates (*Principal Investigator, Sub-Investigator, Clinical Coordinator, Pharmacist, Data Manager*) and site-level custom role authoring.
* Dynamically computed effective permissions matrix.

### 7. Task Management & Approvals (`/pi/tasks`)
* Operational workflow engine for clinical activities, document sign-offs, and compliance actions.
* Guarded lifecycle stepper (`DRAFT -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> COMPLETED`) with a formal revision loop.
* Formal PI approval gates and audit logs cross-linked to underlying clinical entities (Visits, Deviations, Safety Events).

### 8. Document Control & Expiry Tracking (`/pi/documents`)
* Centralized trial master file and site binder register.
* Deterministic expiry engine tracking validity against operational horizons (Active, Expiring Soon $\le30\text{d}$, Expired, No Expiry).
* Drag-and-drop local file upload zone with automatic MIME/size metadata extraction, tab previews, and secure local file downloads.
* Immutable historical document versioning (*Current vs Superseded*).

### 9. Reports & Regulatory Exports (`/pi/reports`)
* 7 Operational report catalogs:
  1. **Participant Status Report** (`PARTICIPANT`)
  2. **Visit Activity Report** (`VISIT`)
  3. **Safety & AE Summary** (`SAFETY`)
  4. **Protocol Deviations Report** (`COMPLIANCE`)
  5. **Task & Approval Report** (`TASK`)
  6. **Document Expiry Report** (`DOCUMENT`)
  7. **Site Operational Summary** (`OPERATIONAL`)
* **Export to Excel (`.xls`):** Generates structured spreadsheets embedding institutional headers, protocol provenance, active filter parameters, formatted gridlines, summary metrics, and an Authorised Signatory verification footer.
* **Export to PDF & Print Dossier:** Clean print view optimization via `@media print` that isolates `#ctms-printable-report` and hides all web navigation chrome, rendering a pristine printable sheet with formal PI signature and institutional seal blocks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vite.dev/) with Fast Refresh & SSR Test Pipeline |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + Custom Print Media Rules |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Routing** | [React Router DOM 7](https://reactrouter.com/) |
| **Testing** | Node.js Test Runner via Vite SSR Bundle (123 automated test suites) |

---

## 💻 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/NitinBot001/CTMS.git
cd CTMS

# Install dependencies
npm install
```

### Development Server
```bash
# Start local development server (port 5173 by default)
npm run dev
```

### Automated Testing
```bash
# Execute comprehensive 123-point unit and regression test suite
npm test
```

### Type Checking & Production Build
```bash
# Verify TypeScript strict typings
npm run typecheck

# Build minified production bundle
npm run build

# Run the complete verification ladder (typecheck && test && build)
npm run verify
```

---

## 🔒 Security & Data Governance

* **Zero Cloud Egress:** All data processing, reporting, and file previews occur entirely within the browser sandbox; no external telemetry, unvetted analytics, or third-party servers are contacted.
* **Scoped Access Isolation:** Site and study boundary queries return strictly isolated records; cross-site contamination returns zero records.
* **Allowlisted Exports:** Export engines exclude private fields (e.g. system credentials, tokens, internal keys).
* **Operational Disclaimers:** All exports and printable dossiers embed mandatory regulatory notices indicating data is derived from operational site records.

---

## 📄 License & Attribution

Developed for the **All India Institute of Ayurveda (AIIA)**.  
*Confidential — Clinical Trial Management System Project.*
