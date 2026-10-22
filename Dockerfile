# ==============================================================================
# AyuCTMS Backend Server — Production Runtime Dockerfile
# ==============================================================================
# Multi-stage, secure, unprivileged non-root container optimized for cloud
# runtimes, Kubernetes, AWS ECS, GCP Cloud Run, VPS, and Docker Compose.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Builder
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies for compiling Python packages (e.g. asyncpg, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend requirements and install dependencies
COPY backend/requirements.txt /build/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


# ------------------------------------------------------------------------------
# Stage 2: Production Server Runtime Environment
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS runtime

LABEL maintainer="AyuCTMS Engineering Team"
LABEL description="AyuCTMS Clinical Trial Management System — Backend Server Runtime"

# Runtime Environment Variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=8000 \
    HOST=0.0.0.0 \
    WORKERS=2 \
    DATA_DIR=/app/data \
    DATABASE_URL=sqlite+aiosqlite:////app/data/ctms.db \
    PATH="/opt/venv/bin:$PATH"

# Install minimal runtime libraries (curl for healthcheck, libpq5 for PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create unprivileged system user and runtime directories
RUN groupadd -g 10001 ctms && \
    useradd -u 10001 -g ctms -s /bin/bash -m ctms && \
    mkdir -p /app/backend /app/data && \
    chown -R ctms:ctms /app

WORKDIR /app/backend

# Copy application code, migrations, and scripts
COPY --chown=ctms:ctms backend/alembic.ini /app/backend/alembic.ini
COPY --chown=ctms:ctms backend/alembic/ /app/backend/alembic/
COPY --chown=ctms:ctms backend/app/ /app/backend/app/
COPY --chown=ctms:ctms backend/scripts/ /app/backend/scripts/
COPY --chown=ctms:ctms .env.example /app/.env.example
COPY --chown=ctms:ctms docker-entrypoint.sh /app/docker-entrypoint.sh

# Ensure entrypoint script is executable
RUN chmod +x /app/docker-entrypoint.sh

# Mount volume for SQLite database persistence / documents
VOLUME ["/app/data"]

# Switch to unprivileged non-root user
USER ctms

# Expose backend API port
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["server"]
