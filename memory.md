# memory.md

## 1. Current State
- **Project**: CTMS (Clinical Trial Management System)
- **Stack**: FastAPI (Backend) + React (Frontend with Vite/TypeScript)
- **Design System**: Defined in `DESIGN.md` (institutional clinical theme: Maroon `#7A2A12`, Dark Maroon `#5C1F0D`, Green `#1F5C3F`, Gold `#B8862E`, Soft background `#F8F6F2`, Merriweather serif headings, Source Sans 3 sans-serif body, thin borders, restrained radius)
- **Workspace**: `/root/ayu-back/ctms` (isolated, strictly no external instruction files read)
- **Status**: Initialized project baseline for FastAPI + React architecture.

---

## 2. Decisions
- **Stack Transition**: Standardized on FastAPI (Python) backend + React (TypeScript/Vite) frontend instead of Next.js.
- **Design Token Integration**: Apply all visual tokens and principles from `DESIGN.md` directly into React modular components and global CSS variables.
- **Workspace Scope**: Self-contained strictly within `/root/ayu-back/ctms`.

---

## 3. Task Log

### 2026-10-03 05:50
- **What**: Initialized `memory.md` and locked in project stack and scope boundaries.
- **Why**: User confirmed the stack is FastAPI + React and instructed strictly not to read any instruction files outside `/root/ayu-back/ctms`.
- **How**: Reviewed `AGENTS.md` and `DESIGN.md` in `/root/ayu-back/ctms`, adapted architecture rules to FastAPI + React, created `memory.md`.
- **Result**: Clean workspace state ready for FastAPI + React implementation.
- **Verified by**: Workspace inspection and file creation in `/root/ayu-back/ctms`.
- **Not verified**: Application code not yet scaffolded.
- **Follow-ups**: Scaffold FastAPI backend and React frontend following vertical slice architecture when requested.
