"""
Regression tests for password storage security.

Requirements verified:
  1. hash_password() returns a bcrypt hash (starts with $2b$), NOT plaintext and NOT SHA-256.
  2. Different calls with the same plaintext produce different hashes (random salt).
  3. verify_password() correctly validates the right password against its hash.
  4. verify_password() correctly rejects a wrong password.
  5. verify_password() rejects a raw SHA-256 hex string (legacy hash guard).
  6. verify_password() returns False — never raises — on a malformed hash.
  7. No plaintext password is returned from hash_password().
  8. data-dictionary compliance: algorithm identifier is bcrypt ($2b$).
"""
from __future__ import annotations

import hashlib
import importlib
import re
import sys

import bcrypt

import app.core.security as _security_module
from app.core.security import hash_password, verify_password

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_BCRYPT_RE = re.compile(r"^\$2[ab]?\$\d{2}\$.{53}$")
_PLAINTEXT_PASSWORD = "S3cur3P@ssw0rd!"


# ---------------------------------------------------------------------------
# 1. Output format — must be a bcrypt hash
# ---------------------------------------------------------------------------


def test_hash_password_returns_bcrypt_format():
    """hash_password() must return a valid bcrypt hash string."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert _BCRYPT_RE.match(h), (
        f"Expected a bcrypt hash ($2b$...) but got: {h!r}. "
        "If this is a SHA-256 hex string, the implementation is wrong."
    )


def test_hash_password_not_plaintext():
    """The hash must not equal the plaintext password."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert h != _PLAINTEXT_PASSWORD, "hash_password() returned the plaintext password — no hashing occurred!"


def test_hash_password_not_sha256_hex():
    """The hash must not be a raw SHA-256 hex digest (64 lowercase hex chars)."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert not _SHA256_RE.match(h), (
        "hash_password() returned a SHA-256 hex string. "
        "SHA-256 is NOT an acceptable password hashing function (data dictionary: argon2id/bcrypt)."
    )


def test_hash_password_not_sha256_with_any_salt():
    """Verify the output cannot be reconstructed by SHA-256 with any reasonable prefix."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    # Try every salt variant ever used (including the removed SALT_PREFIX)
    for salt in ("", "ayu_ctms_", "ayu_", _PLAINTEXT_PASSWORD):
        sha = hashlib.sha256((salt + _PLAINTEXT_PASSWORD).encode()).hexdigest()
        assert h != sha, (
            f"hash_password() returned a SHA-256 digest (salt={salt!r}). "
            "SHA-256 is NOT a password hashing function."
        )


# ---------------------------------------------------------------------------
# 2. Randomness — unique hashes per call
# ---------------------------------------------------------------------------


def test_hash_password_unique_per_call():
    """Each call must generate a different bcrypt hash (per-password random salt)."""
    h1 = hash_password(_PLAINTEXT_PASSWORD)
    h2 = hash_password(_PLAINTEXT_PASSWORD)
    assert h1 != h2, (
        "hash_password() produced identical hashes for two separate calls. "
        "A per-password random salt must be generated each time."
    )


# ---------------------------------------------------------------------------
# 3. Cost factor — meets minimum security threshold
# ---------------------------------------------------------------------------


def test_bcrypt_cost_factor_matches_configured_rounds():
    """The bcrypt work factor used in the hash must match the active _BCRYPT_ROUNDS setting."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    # bcrypt format: $2b$<cost>$<22-char-salt><31-char-hash>
    cost = int(h.split("$")[2])
    assert cost == _security_module._BCRYPT_ROUNDS, (
        f"Hash cost factor is {cost} but _BCRYPT_ROUNDS={_security_module._BCRYPT_ROUNDS}."
    )


def test_production_bcrypt_rounds_meets_owasp_minimum():
    """The production _BCRYPT_ROUNDS constant must be >= 12 (OWASP 2023 minimum for bcrypt).

    This test bypasses the module-level patch and reads the source constant directly.
    """
    # Temporarily remove the module from sys.modules so we get a fresh import
    # without the patch applied. We read the constant only; no hashing happens.
    mod_name = "app.core.security"
    saved = sys.modules.pop(mod_name, None)
    try:
        fresh = importlib.import_module(mod_name)
        assert fresh._BCRYPT_ROUNDS >= 12, (
            f"Production _BCRYPT_ROUNDS={fresh._BCRYPT_ROUNDS} is below the OWASP minimum of 12."
        )
    finally:
        # Restore the patched module so other tests are unaffected
        sys.modules[mod_name] = saved  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# 4. Verification correctness
# ---------------------------------------------------------------------------


def test_verify_password_correct_password():
    """verify_password() must return True for the correct plaintext."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert verify_password(_PLAINTEXT_PASSWORD, h) is True


def test_verify_password_wrong_password():
    """verify_password() must return False for a wrong plaintext."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert verify_password("WrongPassword!", h) is False


def test_verify_password_empty_string():
    """verify_password() must return False when given an empty string."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert verify_password("", h) is False


def test_verify_password_case_sensitive():
    """Passwords are case-sensitive — different case must fail verification."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert verify_password(_PLAINTEXT_PASSWORD.lower(), h) is False


# ---------------------------------------------------------------------------
# 5. Legacy SHA-256 hash guard — old hashes must NOT verify
# ---------------------------------------------------------------------------


def test_verify_password_rejects_sha256_hash():
    """A legacy SHA-256 hex hash must NOT be accepted as a valid bcrypt hash.

    This guards against any code path that still produces SHA-256 hashes
    sneaking back into the database and being accepted at login.
    """
    legacy_sha256 = hashlib.sha256(("ayu_ctms_" + _PLAINTEXT_PASSWORD).encode()).hexdigest()
    # verify_password must return False — the hash is not bcrypt format
    result = verify_password(_PLAINTEXT_PASSWORD, legacy_sha256)
    assert result is False, (
        "verify_password() accepted a SHA-256 hash as valid! "
        "This means the implementation fell back to a non-bcrypt comparison."
    )


# ---------------------------------------------------------------------------
# 6. Error safety — never raises on malformed input
# ---------------------------------------------------------------------------


def test_verify_password_malformed_hash_returns_false():
    """verify_password() must return False, not raise, on a garbage hash value."""
    assert verify_password(_PLAINTEXT_PASSWORD, "not-a-valid-hash") is False


def test_verify_password_empty_hash_returns_false():
    """verify_password() must return False, not raise, on an empty hash."""
    assert verify_password(_PLAINTEXT_PASSWORD, "") is False


def test_verify_password_plaintext_as_hash_returns_false():
    """Passing the plaintext itself as the hash must return False."""
    assert verify_password(_PLAINTEXT_PASSWORD, _PLAINTEXT_PASSWORD) is False


# ---------------------------------------------------------------------------
# 7. Data-dictionary compliance: algorithm marker
# ---------------------------------------------------------------------------


def test_hash_uses_bcrypt_2b_identifier():
    """The stored hash must start with $2b$ (bcrypt, latest variant).

    The data dictionary specifies argon2id/bcrypt. This confirms bcrypt is active.
    """
    h = hash_password(_PLAINTEXT_PASSWORD)
    assert h.startswith("$2b$"), (
        f"Expected bcrypt hash starting with '$2b$' but got: {h[:10]!r}"
    )


def test_bcrypt_library_round_trip():
    """Direct bcrypt library round-trip confirming the library itself is functional."""
    h = hash_password(_PLAINTEXT_PASSWORD)
    # Verify directly via bcrypt — no app code in the loop
    assert bcrypt.checkpw(_PLAINTEXT_PASSWORD.encode("utf-8"), h.encode("utf-8"))
