#!/usr/bin/env python3
"""AyuCTMS Backend Server Runner.

Usage:
    python run.py
    or
    python3 run.py
"""

from __future__ import annotations

import importlib.util
import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

missing_pkgs: list[str] = []
for pkg in ["uvicorn", "fastapi", "sqlalchemy", "pydantic"]:
    if importlib.util.find_spec(pkg) is None:
        missing_pkgs.append(pkg)

if missing_pkgs:
    print(f"\n❌ Missing required dependencies: {', '.join(missing_pkgs)}")
    print("\nPlease install the dependencies with:")
    print("    pip install -r requirements.txt\n")
    sys.exit(1)

import uvicorn  # noqa: E402


def main() -> None:
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")

    print("\n" + "=" * 60)
    print("  🏥 AyuCTMS — Clinical Trial Management System Backend")
    print("=" * 60)
    print(f"  🚀 Server starting on:  http://{host}:{port}")
    print(f"  📖 Interactive Docs:   http://localhost:{port}/docs")
    print(f"  📚 ReDoc Docs:          http://localhost:{port}/redoc")
    print(f"  ❤️  Health Check:       http://localhost:{port}/health")
    print("  🗄️  Database:           SQLite / PostgreSQL (Async)")
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
