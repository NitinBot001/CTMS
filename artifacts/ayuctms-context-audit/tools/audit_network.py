#!/usr/bin/env python3
import asyncio
import json
import urllib.request
import urllib.error
import sqlite3
from pathlib import Path
import sys
sys.path.insert(0, "/root/ayu-back/ctms/backend")
from app.core.security import create_access_token

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Connect to sqlite to read user IDs
conn = sqlite3.connect("/root/ayu-back/ctms/backend/ctms.db")
c = conn.cursor()
users = c.execute("SELECT id, email, full_name, status, must_change_password FROM users").fetchall()

accounts = []
for u_id, email, name, status, must_change in users:
    # create JWT
    token = create_access_token({"sub": str(u_id), "email": email})
    accounts.append({
        "id": u_id,
        "email": email,
        "name": name,
        "status": status,
        "token": token
    })

endpoints = [
    ("GET", "/health", False),
    ("GET", "/dashboard/summary", True),
    ("GET", "/organizations", True),
    ("GET", "/studies", True),
    ("GET", "/sites", True),
    ("GET", "/participants", True),
    ("GET", "/safety", True),
    ("GET", "/compliance/capa", True),
    ("GET", "/documents", True),
    ("GET", "/audit/logs", True),
    ("GET", "/users", True),
    ("GET", "/platform/onboarding-requests", True),
    ("GET", "/platform/super-admin/me", True),
]

results = []

for acc in accounts:
    user_results = []
    for method, path, needs_auth in endpoints:
        url = "http://127.0.0.1:8000" + (path if path == "/health" else "/api/v1" + path)
        headers = {}
        if needs_auth:
            headers["Authorization"] = f"Bearer {acc['token']}"
        req = urllib.request.Request(url, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.status
                body = resp.read().decode('utf-8')
                try:
                    parsed = json.loads(body)
                    count = len(parsed) if isinstance(parsed, list) else 1
                except:
                    count = 1
                user_results.append({
                    "endpoint": path,
                    "method": method,
                    "status": status,
                    "count": count,
                    "sample": body[:300]
                })
        except urllib.error.HTTPError as e:
            user_results.append({
                "endpoint": path,
                "method": method,
                "status": e.code,
                "error": e.read().decode('utf-8')[:200]
            })
    results.append({
        "account": acc["email"],
        "name": acc["name"],
        "endpoints": user_results
    })

Path("artifacts/ayuctms-context-audit/network").mkdir(parents=True, exist_ok=True)
with open("artifacts/ayuctms-context-audit/network/api_audit_dump.json", "w") as f:
    json.dump(results, f, indent=2)

print("Network audit complete! Dumped to artifacts/ayuctms-context-audit/network/api_audit_dump.json")
