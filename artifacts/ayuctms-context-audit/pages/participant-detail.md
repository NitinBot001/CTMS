# Participant Clinical Subject Detail Page

- **Route:** `/participants/:id`
- **Target Role(s):** Authorized Site Investigators and Clinical Monitors
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`participant-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/participant-detail.html)

---

## 1. Page Overview & Functional Purpose
Individual participant tracking record detailing milestone progression, trial randomization status, study visits, and adverse event linkages.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/participants/{id} (Returns: ParticipantRead)`
- `POST /api/v1/participants/{id}/transition (Status Mutation)`
- `GET /api/v1/safety/adverse-events?participant_id={id} (AE link)`

---

## 3. Discovered Interactive Controls & Forms
- Subject Header with Participant Code and Lifecycle Status Badge
- Key Milestone Timestamps (Screening Date, Enrollment Date, Randomization Date, Completion Date)
- Lifecycle State Transition Buttons (e.g. 'Randomize', 'Complete Trial', 'Withdraw Subject')
- Withdrawal Reason input modal if transitioning to `withdrawn`

---

## 4. State Handling & Edge States
State machine enforces legal lifecycle transitions. Invalid skips (e.g. screening -> completed) trigger HTTP 400 Bad Request.

---

## 5. Security & UI Defect Observations
Transition dialog lacks confirmation checkbox verifying informed consent re-affirmation.
