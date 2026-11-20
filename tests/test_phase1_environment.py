"""Phase 1 acceptance tests.

These tests verify the Phase 1 deliverable only: the environment is installed,
the configuration loads, the API boots and every dependency required by later
phases can actually be imported (no fabricated pass/fail).

Run with:  python -m pytest
"""

import importlib
from importlib import metadata

import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import Settings, get_settings
from backend.app.main import app

# Packages that must import successfully for the later phases to be buildable.
REQUIRED_IMPORTS = [
    "fastapi",
    "uvicorn",
    "pydantic",
    "pydantic_settings",
    "jwt",                 # PyJWT
    "passlib",
    "sqlalchemy",
    "alembic",
    "psycopg2",
    "numpy",
    "pandas",
    "scipy",
    "sklearn",
    "xgboost",
    "qiskit",
    "qiskit_aer",
    "qiskit_optimization",
    "ortools",
    "networkx",
    "httpx",
]

PROJECT_PACKAGES = ["backend.app", "ai_engine", "quantum_engine", "simulation", "database"]


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_project_packages_import() -> None:
    for package in PROJECT_PACKAGES:
        assert importlib.import_module(package) is not None


@pytest.mark.parametrize("module_name", REQUIRED_IMPORTS)
def test_required_dependency_imports(module_name: str) -> None:
    assert importlib.import_module(module_name) is not None


def test_settings_load() -> None:
    settings = get_settings()
    assert isinstance(settings, Settings)
    assert settings.APP_NAME == "QuantumEV"
    assert settings.API_V1_PREFIX.startswith("/")
    assert settings.CORS_ORIGINS, "at least one CORS origin must be configured"


def test_cors_origins_accepts_comma_separated_env(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://a.test,http://b.test")
    assert Settings().CORS_ORIGINS == ["http://a.test", "http://b.test"]


def test_root_endpoint(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "QuantumEV"


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["data_source"] == "simulated"


def test_dependency_readiness_endpoint(client: TestClient) -> None:
    # sanity check: the running interpreter really is the one we installed into
    assert metadata.version("fastapi")

    response = client.get("/api/v1/health/dependencies")
    assert response.status_code == 200
    body = response.json()
    assert body["failed"] == [], f"dependencies failed to import: {body['failed']}"


def test_openapi_schema_is_served(client: TestClient) -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "QuantumEV"
