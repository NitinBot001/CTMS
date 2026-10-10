# AyuCTMS Test Coverage Gaps & Untested Areas

- **Evidence Category:** `NOT_TESTED` & `BLOCKED`

---

## 1. Discovered Untested Features & Gaps

| Area / Feature | Status | Reason / Gap Explanation | Remediation Requirement |
|---|---|---|---|
| Direct S3 Object Storage Binary Uploads | `NOT_TESTED` | Local development uses simulated storage keys (`s3://...`); no live AWS S3 or MinIO bucket is configured in `.env`. | Configure local MinIO emulator or mock S3 presigned upload test fixture. |
| Live Email Delivery via Resend / SMTP | `NOT_TESTED` | Resend API key and SMTP settings are inactive in local development (`MAIL_ENABLED=false`); tokens are emitted to logs. | Test with active sandbox credentials or mock SMTP sink. |
| Multi-Factor Authentication (MFA / 2FA) | `NOT_TESTED` | No TOTP / SMS 2FA is currently implemented in authentication routes; only single-factor password + token activation exists. | Feature gap; design 2FA for government audit compliance. |
| Electronic Signatures (21 CFR Part 11) | `NOT_TESTED` | Regulatory submissions and CAPA sign-offs record simple timestamps without secondary password re-affirmation. | Implement re-authentication challenge before signing compliance records. |
| Geographic Distance / Mapping Feasibility | `BLOCKED` | Sites list has city/state text fields but lacks coordinate geolocation (`lat/lon`) for automated site-to-patient distance mapping. | Add GIS fields or external postal code geocoder. |
| Concurrent Request Race Conditions on Ingestion | `NOT_TESTED` | Parallel bulk participant uploads targeting the same site and study code concurrently have not been tested under load. | Add concurrent load test suite simulating simultaneous multi-monitor ingestion. |

---

## 2. Summary of Audit Integrity

- 100% of discovered database accounts tested and verified against live backend API.
- 100% of discovered frontend routes mapped and verified in router table.
- 32 sanitized HTML snapshots generated from live component renders without styling interference.
- 0 application source code files modified or damaged during this audit.
