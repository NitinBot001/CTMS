# ==============================================================================
# AyuCTMS Frontend — Node Runtime Dockerfile (No Nginx)
# ==============================================================================
# Serves the compiled React 19 SPA using Vite's built-in preview server and
# proxies /api requests internally to the Backend service over Docker network.
# ==============================================================================

FROM node:22-alpine

WORKDIR /app

# Copy dependency descriptors
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and configuration
COPY . .

# Compile production bundle (TypeScript typecheck + Vite build)
RUN npm run build

# Default backend URL on the internal Docker network
ENV BACKEND_URL=http://backend:8000
ENV PORT=5173

# Expose ONLY the frontend port to the host
EXPOSE 5173

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:5173/ || exit 1

# Start Vite preview server bound to all interfaces
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
