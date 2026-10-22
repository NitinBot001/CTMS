#!/usr/bin/env bash
# ==============================================================================
# AyuCTMS Unified Server Runtime Entrypoint (No Nginx)
# ==============================================================================
# Architecture:
#   1. Sets up persistent SQLite data directory (/app/data).
#   2. Runs Alembic migrations and database seed (demo users & compliance records).
#   3. Starts FastAPI backend bound strictly to 127.0.0.1 (private loopback, unexposed).
#   4. Awaits internal backend readiness via /health.
#   5. Starts Node.js Vite preview server on 0.0.0.0:${PORT:-5173} to serve frontend
#      and proxy /api requests internally to 127.0.0.1:8000.
# ==============================================================================
set -e

cleanup() {
    echo "⚠️ Shutting down AyuCTMS background processes..."
    kill $(jobs -p) 2>/dev/null || true
    wait 2>/dev/null || true
}
trap cleanup EXIT SIGINT SIGTERM

DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR" 2>/dev/null || true

cd /app/backend

# Verify schema and apply any pending migrations
if [ -f "alembic.ini" ]; then
    echo "▶ Running database migrations (alembic upgrade head)..."
    alembic upgrade head || {
        echo "⚠️ Alembic migration notice: continuing startup..."
    }
fi

# Seed benchmark data and demo accounts
echo "▶ Running database seed verification..."
python scripts/seed.py || echo "⚠️ Seeding skipped or completed."

if [ "$1" = "server" ]; then
    BACKEND_PORT="${BACKEND_PORT:-8000}"
    FRONTEND_PORT="${PORT:-5173}"

    echo "=================================================="
    echo "  🏥 AyuCTMS Unified Server Startup"
    echo "  Internal Backend: http://127.0.0.1:${BACKEND_PORT}"
    echo "  Exposed Frontend: http://0.0.0.0:${FRONTEND_PORT}"
    echo "  Workers:          ${WORKERS:-2}"
    echo "=================================================="

    # Start FastAPI backend bound ONLY to private loopback 127.0.0.1
    uvicorn app.main:app \
        --host 127.0.0.1 \
        --port "$BACKEND_PORT" \
        --workers "${WORKERS:-2}" \
        --proxy-headers \
        --forwarded-allow-ips "*" &
    BACKEND_PID=$!

    # Await internal backend readiness
    echo "▶ Awaiting internal backend readiness on 127.0.0.1:${BACKEND_PORT}..."
    READY=0
    for i in $(seq 1 30); do
        if curl -s -f "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
            echo "✅ Internal FastAPI backend is ready and accepting requests!"
            READY=1
            break
        fi
        sleep 1
    done

    if [ "$READY" -ne 1 ]; then
        echo "❌ Internal backend failed to report healthy within 30 seconds."
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi

    # Switch to frontend directory and run Vite Preview
    cd /app/frontend
    export BACKEND_URL="http://127.0.0.1:${BACKEND_PORT}"

    echo "▶ Starting Vite preview proxy server on port ${FRONTEND_PORT}..."
    npm run preview -- --host 0.0.0.0 --port "${FRONTEND_PORT}" &
    FRONTEND_PID=$!

    # Monitor processes: exit if either terminates
    wait -n $BACKEND_PID $FRONTEND_PID
    EXIT_CODE=$?
    echo "⚠️ Process exited with code ${EXIT_CODE}. Shutting down container."
    exit $EXIT_CODE
fi

exec "$@"
