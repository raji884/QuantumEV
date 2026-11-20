"""QuantumEV backend package (FastAPI application).

The backend is importable as a package so that it can be started either from the
repository root (`uvicorn backend.app.main:app`) or containerised without
`sys.path` manipulation.
"""

__version__ = "0.1.0"
