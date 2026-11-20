"""Health / readiness endpoints.

These are the Phase 1 verification surface: they prove the API boots and that
every heavy dependency used by later phases (AI, quantum, database) actually
imports in the running interpreter. Nothing here is faked — a dependency that
fails to import is reported as `error` with the real exception message.
"""

import logging
import platform
import sys
import time
from importlib import import_module, metadata
from typing import Any, Dict, List, Tuple

from fastapi import APIRouter

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

# (import name, distribution name, owning phase)
DEPENDENCY_CHECKS: Tuple[Tuple[str, str, str], ...] = (
    ("fastapi", "fastapi", "Phase 3"),
    ("sqlalchemy", "SQLAlchemy", "Phase 4"),
    ("alembic", "alembic", "Phase 4"),
    ("numpy", "numpy", "Phase 5"),
    ("pandas", "pandas", "Phase 6"),
    ("sklearn", "scikit-learn", "Phase 6"),
    ("xgboost", "xgboost", "Phase 6"),
    ("qiskit", "qiskit", "Phase 8"),
    ("qiskit_aer", "qiskit-aer", "Phase 8"),
    ("qiskit_optimization", "qiskit-optimization", "Phase 7"),
    ("ortools", "ortools", "Phase 9"),
)

_STARTED_AT = time.time()


def _check_dependency(import_name: str, dist_name: str, phase: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {"package": dist_name, "phase": phase}
    try:
        version = metadata.version(dist_name)
    except metadata.PackageNotFoundError:
        version = None
    try:
        import_module(import_name)
        result.update(status="ok", version=version, error=None)
    except Exception as exc:  # noqa: BLE001 - we want to surface any import failure
        logger.warning("Dependency check failed for %s: %s", import_name, exc)
        result.update(status="error", version=version, error=f"{type(exc).__name__}: {exc}")
    return result


@router.get("", summary="Liveness probe")
def health() -> Dict[str, Any]:
    """Basic liveness information — always cheap, never imports heavy modules."""
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "data_source": "simulated",  # all platform data is simulated until OCPP adapters land
        "uptime_seconds": round(time.time() - _STARTED_AT, 3),
    }


@router.get("/dependencies", summary="Dependency readiness probe")
def dependencies() -> Dict[str, Any]:
    """Import every runtime dependency used by later phases and report the truth."""
    checks: List[Dict[str, Any]] = [
        _check_dependency(import_name, dist_name, phase)
        for import_name, dist_name, phase in DEPENDENCY_CHECKS
    ]
    failed = [c["package"] for c in checks if c["status"] != "ok"]
    return {
        "status": "ok" if not failed else "degraded",
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "failed": failed,
        "checks": checks,
    }
