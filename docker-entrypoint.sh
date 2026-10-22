#!/usr/bin/env bash
# ==============================================================================
# AyuCTMS Single-Dockerfile Universal Deployment Entrypoint
# ==============================================================================
# Supports separated deployments or unified mode via ENV or arguments:
#
#   1. BACKEND Mode:
#      - Triggered by: SERVICE=backend (or APP_MODE=backend, MODE=backend, DEPLOY_TARGET=backend)
#      - Executes: Database migrations, seed data, and Uvicorn on 0.0.0.0:${PORT:-8000}
#
#   2. FRONTEND Mode (DEFAULT):
#      - Triggered by: Default when no ENV is set, or SERVICE=frontend
#      - Loads backend endpoint from environment (BACKEND_URL / VITE_API_URL / VITE_API_BASE_URL)
#      - Injects runtime window.__ENV__ and starts Vite preview on 0.0.0.0:${PORT:-5173}
#
#   3. MONOLITH / BOTH Mode:
#      - Triggered by: SERVICE=both or SERVICE=all
#      - Starts internal FastAPI on 127.0.0.1:8000 and Vite preview on 0.0.0.0:${PORT:-5173}
# ==============================================================================
set -e

# Detect target service from ENV (case-insensitive) or first argument
RAW_SERVICE="${SERVICE:-${APP_MODE:-${MODE:-${DEPLOY_TARGET:-${1:-frontend}}}}}"
TARGET_SERVICE=$(echo "$RAW_SERVICE" | tr '[:upper:]' '[:lower:]')

# If $1 was a standard mode keyword or "server", shift it out so exec "$@" works for custom commands
if [ "$1" = "server" ] || [ "$1" = "frontend" ] || [ "$1" = "backend" ] || [ "$1" = "both" ]; then
    shift
fi

# ==============================================================================
# 1. BACKEND SERVICE MODE
# ==============================================================================
if [ "$TARGET_SERVICE" = "backend" ]; then
    PORT="${PORT:-8000}"
    WORKERS="${WORKERS:-2}"
    DATA_DIR="${DATA_DIR:-/app/data}"

    echo "=================================================="
    echo "  🏥 AyuCTMS BACKEND Service Mode"
    echo "  Port:      0.0.0.0:${PORT}"
    echo "  Workers:   ${WORKERS}"
    echo "  Database:  ${DATABASE_URL:-SQLite (/app/data/ctms.db)}"
    echo "=================================================="

    mkdir -p "$DATA_DIR" 2>/dev/null || true
    cd /app/backend

    if [ -f "alembic.ini" ]; then
        echo "▶ Running database migrations (alembic upgrade head)..."
        alembic upgrade head || echo "⚠️ Alembic notice: continuing startup..."
    fi

    echo "▶ Verifying database benchmark seed data..."
    python scripts/seed.py || echo "⚠️ Seeding skipped or completed."

    echo "▶ Launching FastAPI Uvicorn server on port ${PORT}..."
    exec uvicorn app.main:app \
        --host 0.0.0.0 \
        --port "$PORT" \
        --workers "$WORKERS" \
        --proxy-headers \
        --forwarded-allow-ips "*"
fi

# ==============================================================================
# 2. BOTH / MONOLITH MODE (Runs both internal backend + frontend preview)
# ==============================================================================
if [ "$TARGET_SERVICE" = "both" ] || [ "$TARGET_SERVICE" = "all" ] || [ "$TARGET_SERVICE" = "monolith" ]; then
    BACKEND_PORT="${BACKEND_PORT:-8000}"
    FRONTEND_PORT="${PORT:-5173}"

    echo "=================================================="
    echo "  🏥 AyuCTMS MONOLITH Service Mode (Both Services)"
    echo "  Internal Backend: http://127.0.0.1:${BACKEND_PORT}"
    echo "  Exposed Frontend: http://0.0.0.0:${FRONTEND_PORT}"
    echo "=================================================="

    cleanup() {
        echo "⚠️ Shutting down background processes..."
        kill $(jobs -p) 2>/dev/null || true
        wait 2>/dev/null || true
    }
    trap cleanup EXIT SIGINT SIGTERM

    mkdir -p "${DATA_DIR:-/app/data}" 2>/dev/null || true
    cd /app/backend

    if [ -f "alembic.ini" ]; then
        alembic upgrade head || true
    fi
    python scripts/seed.py || true

    uvicorn app.main:app \
        --host 127.0.0.1 \
        --port "$BACKEND_PORT" \
        --workers "${WORKERS:-2}" \
        --proxy-headers \
        --forwarded-allow-ips "*" &
    BACKEND_PID=$!

    for i in $(seq 1 30); do
        if curl -s -f "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    cd /app/frontend
    export BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"
    npm run preview -- --host 0.0.0.0 --port "${FRONTEND_PORT}" &
    FRONTEND_PID=$!

    wait -n $BACKEND_PID $FRONTEND_PID
    EXIT_CODE=$?
    exit $EXIT_CODE
fi

# ==============================================================================
# 3. FRONTEND SERVICE MODE (DEFAULT when nothing or frontend is set)
# ==============================================================================
if [ "$TARGET_SERVICE" = "frontend" ] || [ -z "$TARGET_SERVICE" ]; then
    PORT="${PORT:-5173}"
    # Resolve backend URL from environment variables
    BACKEND_URL="${BACKEND_URL:-${VITE_API_URL:-${API_URL:-${API_BASE_URL:-http://127.0.0.1:8000}}}}"
    VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api/v1}"

    echo "=================================================="
    echo "  🏥 AyuCTMS FRONTEND Service Mode (Default)"
    echo "  Port:        0.0.0.0:${PORT}"
    echo "  Backend URL: ${BACKEND_URL}"
    echo "  API Base:    ${VITE_API_BASE_URL}"
    echo "=================================================="

    cd /app/frontend

    # Inject runtime virtual env configuration into dist/env-config.js for client-side loading
    if [ -d "dist" ]; then
        echo "▶ Injecting runtime environment into dist/env-config.js..."
        cat <<EOF > dist/env-config.js
// Generated at container startup from deployment environment
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  BACKEND_URL: "${BACKEND_URL}"
};
EOF
    fi

    export BACKEND_URL
    export VITE_API_BASE_URL

    echo "▶ Launching Node.js Vite preview server on port ${PORT}..."
    exec npm run preview -- --host 0.0.0.0 --port "$PORT"
fi

# Fallback: execute any custom command
exec "$@"
