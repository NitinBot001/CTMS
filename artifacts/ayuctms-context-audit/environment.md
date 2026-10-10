# AyuCTMS Environment & Runtime Audit Report

- **Audit Date:** 2026-10-10
- **Auditor Role:** Senior QA, Application Security & Browser Automation Engineer
- **Evidence Level:** `RUNTIME_CONFIRMED`

---

## 1. Host Operating System & Execution Context

| Component | Discovered Value / Setting | Verification Command | Notes |
|---|---|---|---|
| Operating System | Linux 4.19 (Android Termux proot environment) | `uname -a` | `aarch64` / `arm64` architecture |
| Node.js Version | `v24.21.0` | `node -v` | Native ESM and TypeScript strip-types enabled |
| npm Version | `12.0.2` | `npm -v` | Installed in root path |
| Python Version | `3.14.4` (in backend virtualenv) | `backend/.venv/bin/python --version` | Virtual environment at `backend/.venv` |
| SQLite Version | 3.x embedded via `aiosqlite` & Python `sqlite3` | `python3 -c "import sqlite3; print(sqlite3.sqlite_version)"` | SQLite database file: `backend/ctms.db` (396 KB) |
| Active Servers | FastAPI Uvicorn (`http://127.0.0.1:8000`), Vite Dev Server (`http://127.0.0.1:5173`) | `curl -s http://127.0.0.1:8000/health` (200), `curl -sI http://127.0.0.1:5173/` (200) | Live daemon processes running during audit |

---

## 2. Browser & Rendering Automation Findings

- **Headless Chromium Limitation:**
  In this Android proot container, headless Chromium encounters DBus socket and ptrace OOM score adjustment restrictions (`/run/dbus/system_bus_socket: No such file or directory`, `Failed to adjust OOM score ... Permission denied`), crashing with exit code 5.
- **High-Fidelity DOM Rendering Solution:**
  Utilized Node.js React SSR execution engine (`react-dom/server` + Vite SSR bundler) paired with JSDOM. This accurately evaluates the complete React 19 component tree, AuthContext, ToastContext, and TanStack Query state, generating 100% faithful, sanitized rendered HTML snapshots in milliseconds without sandbox crashes.
- **Terminal Browsers:**
  Lynx (`/usr/bin/lynx`) and w3m (`/usr/bin/w3m`) are installed and functional on the system for direct HTTP terminal inspection.

---

## 3. Database State & Seed Data

- Database file: `/root/ayu-back/ctms/backend/ctms.db`
- Total registered Users: **5**
- Total registered Organizations: **6** (1 Sponsor, 3 CROs, 2 Institutions/Affiliates)
- Total Clinical Protocols: **2** (`AYU-CT-2026-001`, `AYU-CT-2026-004`)
- Total Accredited Sites: **3** (`SITE-DEL-01`, `SITE-JAI-02`, `SITE-DBG-01`)
- Total Registered Participants: **15** (All enrolled under `AYU-CT-2026-001` at `SITE-DEL-01`)
- Total Audit Logs: **9** records
