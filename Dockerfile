# ==============================================================================
# AyuCTMS Unified Server — Production Runtime Dockerfile
# ==============================================================================
# Architecture:
#   - Exposes ONLY Frontend (Port 80 via Nginx).
#   - Backend runs INTERNALLY on private loopback (127.0.0.1:8000) and is NOT exposed.
#   - Nginx reverse-proxies /api and /docs internally to the FastAPI backend.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

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
# Stage 3: Production Server Runtime (Frontend Exposed, Backend Internal)
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Production Server — Frontend Exposed, Backend Internal"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=80 \
    BACKEND_PORT=8000 \
    WORKERS=2 \
    DATA_DIR=/app/data \
    DATABASE_URL=sqlite+aiosqlite:////app/data/ctms.db \
    PATH="/opt/venv/bin:$PATH"

# Install Nginx and runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built virtualenv
COPY --from=backend-builder /opt/venv /opt/venv

# Configure Nginx
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf
COPY nginx-unified.conf /etc/nginx/conf.d/default.conf

# Copy frontend static build to Nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Create runtime directories
RUN mkdir -p /app/backend /app/data /var/log/ctms

WORKDIR /app/backend

# Copy backend application code
COPY backend/alembic.ini /app/backend/alembic.ini
COPY backend/alembic/ /app/backend/alembic/
COPY backend/app/ /app/backend/app/
COPY backend/scripts/ /app/backend/scripts/
COPY .env.example /app/.env.example
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

# Persistent volume for database / documents
VOLUME ["/app/data"]

# ONLY Port 80 (Frontend) is exposed to the outside world
EXPOSE 80

# Health check tests Nginx proxy to backend /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
