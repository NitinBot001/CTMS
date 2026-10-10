# AyuCTMS Multi-Role Runtime Network Interaction Log

This log captures real HTTP interactions performed against the live backend (`http://127.0.0.1:8000`) across all five test accounts discovered in `ctms.db`.

---
## Account: `admin@ayuctms.gov.in` (AyuCTMS System Administrator)

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
| `/health` | `GET` | **200** | Count: 1 |
| `/dashboard/summary` | `GET` | **200** | Count: 1 |
| `/organizations` | `GET` | **200** | Count: 6 |
| `/studies` | `GET` | **200** | Count: 0 |
| `/sites` | `GET` | **200** | Count: 3 |
| `/participants` | `GET` | **200** | Count: 0 |
| `/safety` | `GET` | <span style='color:red'>404</span> | {"detail":"Not Found"} |
| `/compliance/capa` | `GET` | **200** | Count: 0 |
| `/documents` | `GET` | **200** | Count: 1 |
| `/audit/logs` | `GET` | **200** | Count: 9 |
| `/users` | `GET` | **200** | Count: 5 |
| `/platform/onboarding-requests` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |
| `/platform/super-admin/me` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |

---

## Account: `pi.rajesh@aiia.gov.in` (Dr. Rajesh Sharma)

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
| `/health` | `GET` | **200** | Count: 1 |
| `/dashboard/summary` | `GET` | **200** | Count: 1 |
| `/organizations` | `GET` | **200** | Count: 6 |
| `/studies` | `GET` | **200** | Count: 1 |
| `/sites` | `GET` | **200** | Count: 3 |
| `/participants` | `GET` | **200** | Count: 15 |
| `/safety` | `GET` | <span style='color:red'>404</span> | {"detail":"Not Found"} |
| `/compliance/capa` | `GET` | **200** | Count: 0 |
| `/documents` | `GET` | **200** | Count: 1 |
| `/audit/logs` | `GET` | **200** | Count: 9 |
| `/users` | `GET` | **200** | Count: 5 |
| `/platform/onboarding-requests` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |
| `/platform/super-admin/me` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |

---

## Account: `admin@ayuctms.example` (Nitin Bhujwa)

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
| `/health` | `GET` | **200** | Count: 1 |
| `/dashboard/summary` | `GET` | **200** | Count: 1 |
| `/organizations` | `GET` | **200** | Count: 6 |
| `/studies` | `GET` | **200** | Count: 2 |
| `/sites` | `GET` | **200** | Count: 3 |
| `/participants` | `GET` | **200** | Count: 15 |
| `/safety` | `GET` | <span style='color:red'>404</span> | {"detail":"Not Found"} |
| `/compliance/capa` | `GET` | **200** | Count: 0 |
| `/documents` | `GET` | **200** | Count: 1 |
| `/audit/logs` | `GET` | **200** | Count: 9 |
| `/users` | `GET` | **200** | Count: 5 |
| `/platform/onboarding-requests` | `GET` | **200** | Count: 1 |
| `/platform/super-admin/me` | `GET` | **200** | Count: 1 |

---

## Account: `nitinbhujwa@gmail.com` (Nitin Bhujwa)

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
| `/health` | `GET` | **200** | Count: 1 |
| `/dashboard/summary` | `GET` | **200** | Count: 1 |
| `/organizations` | `GET` | **200** | Count: 6 |
| `/studies` | `GET` | **200** | Count: 0 |
| `/sites` | `GET` | **200** | Count: 3 |
| `/participants` | `GET` | **200** | Count: 0 |
| `/safety` | `GET` | <span style='color:red'>404</span> | {"detail":"Not Found"} |
| `/compliance/capa` | `GET` | **200** | Count: 0 |
| `/documents` | `GET` | **200** | Count: 1 |
| `/audit/logs` | `GET` | **200** | Count: 9 |
| `/users` | `GET` | **200** | Count: 5 |
| `/platform/onboarding-requests` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |
| `/platform/super-admin/me` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |

---

## Account: `dr.patel.dbg@gah.edu.in` (Dr. Patel)

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
| `/health` | `GET` | **200** | Count: 1 |
| `/dashboard/summary` | `GET` | **200** | Count: 1 |
| `/organizations` | `GET` | **200** | Count: 6 |
| `/studies` | `GET` | **200** | Count: 0 |
| `/sites` | `GET` | **200** | Count: 3 |
| `/participants` | `GET` | **200** | Count: 0 |
| `/safety` | `GET` | <span style='color:red'>404</span> | {"detail":"Not Found"} |
| `/compliance/capa` | `GET` | **200** | Count: 0 |
| `/documents` | `GET` | **200** | Count: 1 |
| `/audit/logs` | `GET` | **200** | Count: 9 |
| `/users` | `GET` | **200** | Count: 5 |
| `/platform/onboarding-requests` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |
| `/platform/super-admin/me` | `GET` | <span style='color:red'>403</span> | {"detail":"Super Admin access required"} |

---

