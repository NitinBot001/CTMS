from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
_BCRYPT_ROUNDS = 12  # OWASP minimum; data dictionary: argon2id/bcrypt


def hash_password(plain: str) -> str:
    """Hashes a plaintext password using bcrypt (rounds=12).

    bcrypt generates a cryptographically random 128-bit salt automatically.
    The returned string includes the algorithm identifier, cost factor, salt,
    and digest — safe to store directly in the hashed_password column.
    """
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time comparison of a plaintext password against a bcrypt hash.

    Returns False (not raises) for any mismatched or malformed hash so that
    the login endpoint always returns a generic 401 without leaking details.
    """
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodes and validates JWT token. Raises PyJWTError on invalid/expired token."""
    settings = get_settings()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])

