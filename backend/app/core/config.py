from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./ctms.db"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AyuCTMS"
    SECRET_KEY: str = "ayu-ctms-production-grade-jwt-secret-key-32bytes-secure"
    # Super Admin Bootstrap
    SUPER_ADMIN_EMAIL: str = ""
    SUPER_ADMIN_BOOTSTRAP_PASSWORD: str = ""
    SUPER_ADMIN_ACTIVATION_MODE: str = "bootstrap_password"
    # Email & Resend
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"
    APP_BASE_URL: str = "http://localhost:5173"
    MAIL_ENABLED: bool = False
    MAIL_FROM: str = "noreply@ayuctms.example"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True

@lru_cache
def get_settings() -> Settings:
    return Settings()
