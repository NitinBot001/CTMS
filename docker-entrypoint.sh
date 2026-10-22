#!/usr/bin/env bash
# ==============================================================================
# AyuCTMS Container Runtime Entrypoint (No Nginx)
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

# Start uvicorn server in production mode
if [ "$1" = "server" ]; then
    echo "=================================================="
    echo "  🏥 Starting AyuCTMS Backend Server"
    echo "  Port:    ${PORT:-8000}"
    echo "  Workers: ${WORKERS:-2}"
    echo "=================================================="
    exec uvicorn app.main:app \
        --host "${HOST:-0.0.0.0}" \
        --port "${PORT:-8000}" \
        --workers "${WORKERS:-2}" \
        --proxy-headers \
        --forwarded-allow-ips "*"
fi

exec "$@"
