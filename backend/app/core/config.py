from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./ctms.db"
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AyuCTMS"
    SECRET_KEY: str = "change-me-in-production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
