# ==============================================================================
# AyuCTMS Universal Container Runtime Dockerfile
# ==============================================================================
# Dual-target single Dockerfile:
#   - Defaults to FRONTEND service (Node.js 22 Vite Preview)
#   - Switch to BACKEND service by setting environment variable: SERVICE=backend
#   - Loads backend API endpoint from environment: BACKEND_URL / VITE_API_BASE_URL
#   - Pure Node.js + Python 3.12 stack — Zero Nginx
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
# Stage 3: Universal Production Server Runtime
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Universal Runtime — Frontend (Default) or Backend via SERVICE=backend (No Nginx)"

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

# Copy Backend application code, migrations, and seed script
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

# Default to frontend port 5173 and backend port 8000
EXPOSE 5173 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || curl -f http://127.0.0.1:${PORT}/ || exit 1

WORKDIR /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["frontend"]
