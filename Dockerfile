# ==============================================================================
# AyuCTMS Unified Server — Production Runtime Dockerfile (No Nginx)
# ==============================================================================
# Architecture:
#   - Exposes ONLY Frontend on $PORT (defaults to 5173 via Node.js Vite Preview)
#   - Backend runs INTERNALLY on private loopback (127.0.0.1:8000) and is NOT exposed
#   - Vite Preview proxies /api, /docs, /redoc, /health to internal FastAPI backend
#   - Pure Node.js + Python 3.12 stack — Zero Nginx dependencies
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ------------------------------------------------------------------------------
# Stage 2: Build Backend Dependencies
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS backend-builder

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
# Stage 3: Production Server Runtime (Frontend Exposed, Backend Internal — No Nginx)
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Production Server — Frontend Exposed, Backend Internal (No Nginx)"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=5173 \
    BACKEND_PORT=8000 \
    WORKERS=2 \
    DATA_DIR=/app/data \
    DATABASE_URL=sqlite+aiosqlite:////app/data/ctms.db \
    BACKEND_URL=http://127.0.0.1:8000 \
    PATH="/opt/venv/bin:$PATH"

# Install minimal runtime libraries (curl for healthchecks, libpq5 for PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Node.js binary and npm from node:22-bookworm-slim
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Copy pre-built Python virtualenv
COPY --from=backend-builder /opt/venv /opt/venv

# Create unprivileged system user
RUN groupadd -g 10001 ctms && \
    useradd -u 10001 -g ctms -s /bin/bash -m ctms && \
    mkdir -p /app/backend /app/frontend /app/data && \
    chown -R ctms:ctms /app

# Copy Frontend compiled assets and config for Vite preview
WORKDIR /app/frontend
COPY --from=frontend-builder --chown=ctms:ctms /app/frontend/package.json ./package.json
COPY --from=frontend-builder --chown=ctms:ctms /app/frontend/package-lock.json ./package-lock.json
COPY --from=frontend-builder --chown=ctms:ctms /app/frontend/vite.config.ts ./vite.config.ts
COPY --from=frontend-builder --chown=ctms:ctms /app/frontend/dist ./dist
COPY --from=frontend-builder --chown=ctms:ctms /app/frontend/node_modules ./node_modules

# Copy Backend application code, migrations, seed script, and database baseline
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

# ONLY Frontend port is exposed to the outside world!
# Backend listens ONLY on 127.0.0.1:8000 internally.
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || curl -f http://127.0.0.1:${PORT}/ || exit 1

WORKDIR /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
