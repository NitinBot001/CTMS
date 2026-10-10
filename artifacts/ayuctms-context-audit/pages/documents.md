# Trial Master File (eTMF) & Document Governance Page

- **Route:** `/documents`
- **Target Role(s):** CRA, Investigator, TMF Specialist, Document Manager
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`documents.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/documents.html)

---

## 1. Page Overview & Functional Purpose
Electronic Trial Master File repository managing essential trial documents (protocols, investigator brochures, informed consents, approvals, monitor reports).

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/documents (Returns: list[DocumentRead])`
- `POST /api/v1/documents (Upload Metadata & Storage Key Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Document Type Filter (`protocol`, `ib`, `icf`, `ec_approval`, `monitoring_report`, `cv`)
- Button: 'Upload Document' -> opens document submission dialog
- Documents Table with Title, Category, Version, Uploaded Date, File Size, Storage Hash
- Download Link (`s3://...` or secure presigned URL)

---

## 4. State Handling & Edge States
Tracks document versioning. Replaced documents retain full historic audit record.

---

## 5. Security & UI Defect Observations
Binary file uploads are simulated using S3 storage key metadata; direct client-to-storage presigned upload flow is not yet wired to a live S3 bucket.
