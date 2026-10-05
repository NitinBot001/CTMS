# memory.md

## 1. Current State
- **Project**: CTMS (Clinical Trial Management System)
- **Stack**: FastAPI (Backend) + React 19 (Frontend with Vite 8 / TypeScript 6 / Tailwind CSS v4)
- **Frontend Location**: `frontend/` directory (`/root/ayu-back/ctms/frontend`)
- **Design System**: Fully aligned with `DESIGN.md` (institutional clinical tokens: Maroon `#7A2A12`, Dark Maroon `#5C1F0D`, Green `#1F5C3F`, Gold `#B8862E`, Soft background `#F8F6F2`, Merriweather serif headings, Source Sans 3 sans-serif body, thin borders, restrained radius)
- **Workspace**: `/root/ayu-back/ctms` (isolated, strictly no external instruction files read)
- **Status**: Frontend scaffolded and verified (`npm run verify` passing, HTTP 200 smoke test verified).

---

## 2. Decisions
- **Frontend Placement**: React app placed inside `frontend/` directory to maintain clean separation for upcoming `backend/` FastAPI service.
- **Styling Architecture**: Tailwind CSS v4 with `@tailwindcss/vite` plugin and centralized institutional clinical theme tokens configured in `index.css`.
- **Iconography**: `lucide-react` for simple, professional, line-based clinical UI icons per `DESIGN.md`.
- **Stack Transition**: Standardized on FastAPI (Python) backend + React (TypeScript/Vite) frontend instead of Next.js.
- **Workspace Scope**: Self-contained strictly within `/root/ayu-back/ctms`.

---

## 3. Task Log

### 2026-10-05 14:52
- **What**: Scaffolded React app with Tailwind CSS inside `frontend/` directory and implemented institutional CTMS starter template.
- **Why**: User requested a basic React app template with Tailwind CSS placed inside the `frontend` folder.
- **How**: Ran `create-vite` with `react-ts` template inside `frontend/`, installed `tailwindcss`, `@tailwindcss/vite`, and `lucide-react`. Configured `vite.config.ts`, added Google Fonts (`Merriweather` and `Source Sans 3`) to `index.html`, set up design tokens in `src/index.css`, built institutional clinical trial dashboard in `src/App.tsx`, and added `"verify"` script to `package.json`.
- **Result**: Fully functioning, production-built React 19 + Tailwind CSS v4 template with clinical trial registry UI, search/filtering, metric cards, and responsive design.
- **Verified by**: `npm run verify` (`oxlint` 0 warnings/errors, TypeScript compile, Vite build to `dist/`), static HTTP server smoke test returning status 200, and initial git commit `4451297`.
- **Not verified**: Visual browser rendering inspected via headless/dev server HTTP output; UI visually checked via token and DOM hierarchy mapping.
- **Follow-ups**: Scaffold FastAPI backend in `backend/` and connect API endpoints to frontend.

### 2026-10-03 05:50
- **What**: Initialized `memory.md` and locked in project stack and scope boundaries.
- **Why**: User confirmed the stack is FastAPI + React and instructed strictly not to read any instruction files outside `/root/ayu-back/ctms`.
- **How**: Reviewed `AGENTS.md` and `DESIGN.md` in `/root/ayu-back/ctms`, adapted architecture rules to FastAPI + React, created `memory.md`.
- **Result**: Clean workspace state ready for FastAPI + React implementation.
- **Verified by**: Workspace inspection and file creation in `/root/ayu-back/ctms`.
- **Not verified**: Application code not yet scaffolded.
- **Follow-ups**: Scaffold FastAPI backend and React frontend following vertical slice architecture when requested.
