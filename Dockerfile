# ==============================================================================
# AyuCTMS Backend Server — Container Runtime Dockerfile (No Nginx)
# ==============================================================================
# Multi-stage, secure, unprivileged non-root container for the FastAPI backend.
# In production, this service is internal and accessed via the frontend proxy.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt /build/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


# ------------------------------------------------------------------------------
# Stage 2: Runtime Environment
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Backend Server Runtime (Internal Service — No Nginx)"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=8000 \
    HOST=0.0.0.0 \
    WORKERS=2 \
    DATA_DIR=/app/data \
    DATABASE_URL=sqlite+aiosqlite:////app/data/ctms.db \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN groupadd -g 10001 ctms && \
    useradd -u 10001 -g ctms -s /bin/bash -m ctms && \
    mkdir -p /app/backend /app/data && \
    chown -R ctms:ctms /app

WORKDIR /app/backend

COPY --chown=ctms:ctms backend/alembic.ini /app/backend/alembic.ini
COPY --chown=ctms:ctms backend/alembic/ /app/backend/alembic/
COPY --chown=ctms:ctms backend/app/ /app/backend/app/
COPY --chown=ctms:ctms backend/scripts/ /app/backend/scripts/
COPY --chown=ctms:ctms .env.example /app/.env.example
COPY --chown=ctms:ctms docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

VOLUME ["/app/data"]

USER ctms

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
