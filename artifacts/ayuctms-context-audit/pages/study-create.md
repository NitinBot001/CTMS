# New Clinical Study Protocol Creation Page

- **Route:** `/studies/new`
- **Target Role(s):** Sponsor PI / Research Administrator
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`study-create.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/study-create.html)

---

## 1. Page Overview & Functional Purpose
Multi-section form for registering a new Ayurvedic clinical trial protocol with regulatory classification, CTRI metadata, and sample size targets.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `POST /api/v1/studies (Body: StudyCreate -> Returns: StudyRead)`

---

## 3. Discovered Interactive Controls & Forms
- Study Code & Protocol Number inputs
- Title & Short Title inputs
- Study Type (`interventional`, `observational`)
- Clinical Trial Phase dropdown
- Therapeutic Area & Intervention Type inputs
- Planned Sample Size numeric input
- Start Date and End Date datepickers
- CTRI Registration Number input
- Sponsor & CRO Organization selector
- Submit Protocol button

---

## 4. State Handling & Edge States
Client validation blocks submission if protocol number is missing or planned sample size is non-positive.

---

## 5. Security & UI Defect Observations
CTRI number format regex is not strictly validated against official CTRI/YYYY/MM/NNNN format.
