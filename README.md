# QuantumEV — Intelligent EV Charging & Grid Optimization

AI + Quantum Computing platform for electric vehicle charging and smart-grid
optimization. Given a smart-city scenario (100 EVs, 10 charging stations, 3 zones),
the platform forecasts charging demand, projects electricity prices and solar
generation, formulates the station/time-slot assignment problem as a **QUBO**, solves
it with **QAOA** on Qiskit Aer, and compares the result honestly against a classical
**OR-Tools CP-SAT** baseline.

> **Phase 1 of 10 is complete.** This repository currently contains the full project
> skeleton, pinned dependency set, FastAPI application skeleton, React/TypeScript/Vite
> frontend shell, PostgreSQL service definition and an automated environment test
> suite. Feature phases (2–10) are listed at the bottom.

---

## 1. Verified environment

Everything below was executed and verified on this machine:

| Tool | Version | Notes |
| --- | --- | --- |
| Python | 3.12.0 | `C:\Program Files\Python312\python.exe` |
| Node.js | 26.13.1 | `C:\Program Files\nodejs\node.exe` |
| npm | 11.20.0 | |
| Docker | 27.3.1 | with Compose v2.30.3 |
| Git | 2.47.1 | |

See [Troubleshooting](#9-troubleshooting) if `node`/`npm` are not on your `PATH`.

---

## 2. Folder structure

```
QuantumEV/
├── backend/                  # FastAPI application (REST + WebSocket)
│   ├── app/
│   │   ├── main.py           # app factory, CORS, lifespan, /docs
│   │   ├── core/config.py    # typed settings loaded from .env
│   │   └── api/
│   │       ├── router.py     # aggregates versioned routers
│   │       └── routes/health.py   # liveness + dependency readiness probes
│   └── Dockerfile
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx           # Phase 1 status console (live backend data)
│   │   ├── lib/api.ts        # axios client + typed API functions
│   │   └── index.css         # Tailwind entry point
│   ├── nginx.conf            # SPA fallback for the production image
│   ├── vite.config.ts
│   └── Dockerfile
├── quantum_engine/           # Phases 7–9: QUBO, QAOA (Qiskit Aer), CP-SAT baseline
├── ai_engine/                # Phase 6: demand / price / solar forecasting
├── simulation/               # Phase 5: 100-EV smart-city simulation + WebSockets
├── database/                 # Phase 4: SQLAlchemy models + Alembic migrations
├── tests/                    # pytest suite (Phase 1 environment acceptance tests)
├── docs/
│   └── architecture.md       # module responsibilities, data flow, design rules
├── requirements.txt          # single pinned, mutually-compatible Python dependency set
├── pyproject.toml            # pytest configuration
├── docker-compose.yml        # postgres + backend + frontend
├── .env.example              # every environment variable the platform reads
└── README.md
```

---

## 3. Installation

### 3.1 Python environment

```powershell
# from the repository root
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`requirements.txt` pins one compatible set covering the API, auth, database, AI
(scikit-learn/XGBoost), quantum (Qiskit, Qiskit Aer, Qiskit Optimization) and
classical (OR-Tools) stacks. It is verified by the test-suite and by the
`/api/v1/health/dependencies` endpoint.

### 3.2 Frontend

```powershell
cd frontend
npm install
```

### 3.3 Configuration

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env   # only needed for local `npm run dev`
```

---

## 4. Running the platform

### 4.1 Local development (two terminals)

Backend — from the repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Health | http://localhost:8000/api/v1/health |
| Dependency readiness | http://localhost:8000/api/v1/health/dependencies |

### 4.2 Docker (PostgreSQL + backend + frontend)

```powershell
docker compose up --build -d
docker compose ps
```

`postgres` is published on `5432`, the API on `8000`, the frontend on `5173`.

### 4.3 PostgreSQL only

```powershell
docker compose up -d postgres
```

---

## 5. Testing

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

The Phase 1 suite ([test_phase1_environment.py](file:///c:/Users/RAJESWARI/OneDrive/Documents/QuantumEV/tests/test_phase1_environment.py)) checks that:

* every project package imports (`backend.app`, `ai_engine`, `quantum_engine`, `simulation`, `database`);
* every dependency needed by phases 3–9 really imports in the running interpreter;
* settings load from `.env`, including comma-separated `CORS_ORIGINS`;
* the API serves `/`, `/api/v1/health`, `/api/v1/health/dependencies` and `/openapi.json`.

---

## 6. Environment variables

All variables are documented in [.env.example](file:///c:/Users/RAJESWARI/OneDrive/Documents/QuantumEV/.env.example).
Highlights:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy DSN (`postgresql+psycopg2://…`) used from Phase 4 |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT auth from Phase 3 |
| `CORS_ORIGINS` | comma-separated list of allowed browser origins |
| `SIM_TICK_SECONDS`, `SIM_EV_COUNT`, `SIM_STATION_COUNT`, `SIM_ZONE_COUNT`, `SIM_RANDOM_SEED` | simulation engine (Phase 5) |
| `VITE_API_BASE_URL`, `VITE_WS_BASE_URL` | frontend → backend endpoints |

---

## 7. Data honesty rules

These are hard project rules, enforced in every later phase:

1. All simulated values are labelled `simulated` in API responses and in the UI.
2. Model metrics (MAE/RMSE/R²) are computed on held-out test data — never invented.
3. QAOA results are produced by an actual parameterized circuit executed on
   Qiskit Aer. No random bitstring is ever presented as a QAOA solution.
4. No claim of quantum advantage is made unless the measured experiment supports it;
   classical and quantum results are reported side by side.

---

## 8. Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project structure & environment | **done** |
| 2 | Frontend & UI (15 pages, layout, charts, maps) | pending |
| 3 | Backend & authentication (JWT, RBAC, 3 roles) | pending |
| 4 | PostgreSQL schema, indexes, Alembic migrations, seed data | pending |
| 5 | Real-time simulation engine + WebSockets | pending |
| 6 | AI prediction models (demand, price, solar) | pending |
| 7 | QUBO formulation & constraint validation | pending |
| 8 | QAOA implementation on Qiskit Aer | pending |
| 9 | Classical OR-Tools comparison | pending |
| 10 | Full integration & deployment | pending |

---

## 9. Troubleshooting

**`node` / `npm` not recognized.** Node is installed at `C:\Program Files\nodejs`
but missing from `PATH`. Add it permanently (new terminal afterwards):

```powershell
[Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Program Files\nodejs', 'User')
```

or for the current session only:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
```

**`npm.ps1 cannot be loaded because running scripts is disabled`.** Windows PowerShell
blocks npm's PowerShell shims. Use the `.cmd` wrappers (`npm.cmd`, `npx.cmd`) or allow
local scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Port already in use.** 5173/8000/5432 must be free, or override `BACKEND_PORT`,
`POSTGRES_PORT` in `.env` and the Vite `server.port` in
[vite.config.ts](file:///c:/Users/RAJESWARI/OneDrive/Documents/QuantumEV/frontend/vite.config.ts).
