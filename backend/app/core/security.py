import hashlib

SALT_PREFIX = "ayu_ctms_"


def hash_password(plain: str) -> str:
    salted = SALT_PREFIX + plain
    return hashlib.sha256(salted.encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed
