# ==============================================================================
# AyuCTMS Backend — Internal Server Runtime Dockerfile
# ==============================================================================
# Runs the FastAPI backend internally. Accessible ONLY via internal network
# (e.g. from the Frontend Nginx reverse proxy). NOT exposed to the host.
# ==============================================================================

FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt /build/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Backend Server — Private Internal Runtime"

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

COPY --chown=ctms:ctms alembic.ini /app/backend/alembic.ini
COPY --chown=ctms:ctms alembic/ /app/backend/alembic/
COPY --chown=ctms:ctms app/ /app/backend/app/
COPY --chown=ctms:ctms scripts/ /app/backend/scripts/
COPY --chown=ctms:ctms docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

VOLUME ["/app/data"]

USER ctms

# Internal port only (communicated via private Docker network)
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
