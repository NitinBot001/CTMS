#!/usr/bin/env python3
"""AyuCTMS Backend Server Runner.

Usage:
    python run.py
    or
    python3 run.py
"""

from __future__ import annotations

import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    import uvicorn
    import fastapi
    import sqlalchemy
    import pydantic
except ImportError as exc:
    print(f"\n❌ Missing required dependencies: {exc}")
    print("\nPlease install the dependencies with:")
    print("    pip install -r requirements.txt\n")
    sys.exit(1)


def main():
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")

    print("\n" + "=" * 60)
    print("  🏥 AyuCTMS — Clinical Trial Management System Backend")
    print("=" * 60)
    print(f"  🚀 Server starting on:  http://{host}:{port}")
    print(f"  📖 Interactive Docs:   http://localhost:{port}/docs")
    print(f"  📚 ReDoc Docs:          http://localhost:{port}/redoc")
    print(f"  ❤️  Health Check:       http://localhost:{port}/health")
    print(f"  🗄️  Database:           SQLite / PostgreSQL (Async)")
    print("=" * 60 + "\n")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
