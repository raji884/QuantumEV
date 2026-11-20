"""Typed application settings loaded from environment variables / `.env`.

All modules (API, simulation, AI, quantum) read configuration from here so that
a single `.env` file controls the whole platform.
"""

from functools import lru_cache
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the QuantumEV backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---------- Application ----------
    APP_NAME: str = "QuantumEV"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = (
        "Intelligent EV charging and smart-grid optimization platform "
        "(AI + QUBO/QAOA + classical optimization)."
    )
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    API_V1_PREFIX: str = "/api/v1"

    # ---------- Server ----------
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    # NoDecode: env values are handled by the validator below, not as JSON.
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # ---------- PostgreSQL ----------
    POSTGRES_USER: str = "quantumev"
    POSTGRES_PASSWORD: str = "quantumev"
    POSTGRES_DB: str = "quantumev"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = (
        "postgresql+psycopg2://quantumev:quantumev@localhost:5432/quantumev"
    )

    # ---------- Authentication (used from Phase 3) ----------
    JWT_SECRET_KEY: str = "dev-only-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ---------- Simulation engine (used from Phase 5) ----------
    SIM_TICK_SECONDS: int = 5
    SIM_EV_COUNT: int = 100
    SIM_STATION_COUNT: int = 10
    SIM_ZONE_COUNT: int = 3
    SIM_RANDOM_SEED: int = 42

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        """Allow `CORS_ORIGINS=a,b` as well as a JSON list."""
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                return value  # let pydantic parse JSON
            return [item.strip() for item in raw.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings instance."""
    return Settings()
