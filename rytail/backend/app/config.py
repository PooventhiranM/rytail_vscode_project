from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "RYTAIL - Retail Inventory Optimization Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./rytail.db"
    DB_POOL_PRE_PING: bool = True
    DB_TIMEOUT_SECONDS: int = 15

    # Security & Auth
    SECRET_KEY: str = "rytail_super_secret_enterprise_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    ALLOW_CREDENTIALS: bool = True

    # Logging & Observability
    LOG_LEVEL: str = "INFO"
    ENABLE_METRICS: bool = True

    # Core Engine Defaults (Style Union Replenishment & Allocation Standards)
    DEFAULT_PLANNING_HORIZON_DAYS: int = 12
    DEFAULT_ALLOCATION_POOL_PCT: float = 52.4
    DEFAULT_MIN_UNITS_PER_SIZE: int = 2
    DEFAULT_MAX_UNITS_PER_SIZE: int = 10
    DEFAULT_LEAD_TIME_DAYS: int = 5
    DEFAULT_REVIEW_PERIOD_DAYS: int = 7
    DEFAULT_SAFETY_STOCK_UNITS: int = 3
    MAX_PAGE_SIZE: int = 500

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
