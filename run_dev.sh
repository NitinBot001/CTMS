#!/usr/bin/env bash
# ==============================================================================
# AyuCTMS Development Runner (Linux / macOS / Git Bash / WSL)
# Starts both Backend (FastAPI/uvicorn) and Frontend (Vite/React) concurrently.
# Gracefully stops both services on Ctrl+C (SIGINT) or termination (SIGTERM).
# ==============================================================================

set -e

# Resolve repository root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "  🚀 Starting AyuCTMS (Backend + Frontend)"
echo "=================================================="

# 1. Detect Python
if [ -f "$SCRIPT_DIR/backend/.venv/bin/python" ]; then
    PYTHON_CMD="$SCRIPT_DIR/backend/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please setup backend/.venv or install Python."
    exit 1
fi

# 2. Detect npm
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ Error: npm not found. Please install Node.js and npm."
    exit 1
fi

export PYTHONUNBUFFERED=1

BACKEND_PID=""
FRONTEND_PID=""

# Cleanup function to kill all child processes
cleanup() {
    # Disable trap to prevent recursive calls
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo "=================================================="
    echo "  🛑 Shutting down AyuCTMS (Backend + Frontend)..."
    echo "=================================================="

    # 1. Terminate backend
    if [ -n "$BACKEND_PID" ]; then
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo "Stopping Backend (PID $BACKEND_PID)..."
            # Kill children first (e.g. uvicorn reloader child worker)
            pkill -P "$BACKEND_PID" 2>/dev/null || true
            kill -TERM "$BACKEND_PID" 2>/dev/null || true
        fi
    fi

    # 2. Terminate frontend
    if [ -n "$FRONTEND_PID" ]; then
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo "Stopping Frontend (PID $FRONTEND_PID)..."
            # Kill children first (e.g. node/vite processes)
            pkill -P "$FRONTEND_PID" 2>/dev/null || true
            kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        fi
    fi

    # Wait up to 1 second for graceful exit
    sleep 1

    # Force kill if any process is still lingering
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi

    echo "✅ All services stopped cleanly."
    exit 0
}

# Trap SIGINT (Ctrl+C), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "▶ Starting Backend (FastAPI on http://127.0.0.1:8000)..."
(
    cd "$SCRIPT_DIR/backend"
    exec "$PYTHON_CMD" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

# Start Frontend
echo "▶ Starting Frontend (Vite on http://localhost:5173)..."
(
    cd "$SCRIPT_DIR/frontend"
    exec npm run dev -- --host
) &
FRONTEND_PID=$!

echo "=================================================="
echo "  AyuCTMS is live:"
echo "  - Backend API:  http://localhost:8000"
echo "  - API Docs:     http://localhost:8000/docs"
echo "  - Frontend UI:  http://localhost:5173"
echo "  Press Ctrl+C to stop both services."
echo "=================================================="

# Wait for any process to exit or Ctrl+C
wait -n "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
