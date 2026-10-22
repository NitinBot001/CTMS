#!/usr/bin/env bash
# ==============================================================================
# AyuCTMS Unified Container Runtime Entrypoint
# Starts Backend internally on 127.0.0.1:8000 and Nginx on Port 80 (Exposed).
# ==============================================================================
set -e

if [ -n "$DATA_DIR" ] && [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR" 2>/dev/null || true
fi

# Run database schema migrations
if [ -f "alembic.ini" ]; then
    echo "▶ Running database migrations (alembic upgrade head)..."
    alembic upgrade head || {
        echo "⚠️  Alembic migration warning: continuing startup (tables will be verified by app lifespan)..."
    }
fi

# Optional seed
if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
    echo "▶ Seeding database with benchmark data..."
    python scripts/seed.py || echo "⚠️ Seeding skipped or data already exists."
fi

# Start unified production server (Frontend exposed on port 80, Backend internal on 127.0.0.1:8000)
if [ "$1" = "server" ]; then
    echo "=================================================="
    echo "  🏥 Starting AyuCTMS Production Server"
    echo "  Frontend Port: 80 (Exposed to outside)"
    echo "  Backend Port:  8000 (Internal loopback 127.0.0.1)"
    echo "=================================================="

    # Start FastAPI backend internally on 127.0.0.1:8000 (NOT accessible from outside)
    uvicorn app.main:app \
        --host 127.0.0.1 \
        --port 8000 \
        --workers "${WORKERS:-2}" \
        --proxy-headers \
        --forwarded-allow-ips "*" &
    BACKEND_PID=$!

    # Wait for backend to report healthy on internal port
    for i in $(seq 1 30); do
        if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
            echo "✅ Backend initialized on internal loopback (127.0.0.1:8000)."
            break
        fi
        sleep 0.5
    done

    # Trap termination signals to stop both processes gracefully
    trap "echo 'Shutting down server...'; kill -TERM $BACKEND_PID 2>/dev/null || true; nginx -s quit 2>/dev/null || true; exit 0" SIGINT SIGTERM

    # Start Nginx in foreground on port 80 (the only exposed port)
    nginx -g "daemon off;" &
    NGINX_PID=$!

    # Wait for either process to terminate
    wait -n $BACKEND_PID $NGINX_PID 2>/dev/null || wait $BACKEND_PID $NGINX_PID 2>/dev/null
    exit 0
fi

exec "$@"
