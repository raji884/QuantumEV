# QuantumEV — Architecture

## 1. System overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│  React + TypeScript + Vite + Tailwind  (frontend/)                        │
│  Dashboards · charts (Recharts) · station map (Leaflet) · live WebSocket  │
└───────────────┬───────────────────────────────────────┬───────────────────┘
                │ REST (axios, JWT)                     │ WebSocket
                ▼                                       ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  FastAPI backend  (backend/app)                                           │
│  auth/RBAC · vehicles · stations · requests · sessions · reports          │
│  /api/v1/health, /docs (Swagger), WebSocket hub                           │
└───────┬───────────────────┬───────────────────┬───────────────┬───────────┘
        │                   │                   │               │
        ▼                   ▼                   ▼               ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ database/     │  │ simulation/    │  │ ai_engine/     │  │ quantum_engine/│
│ SQLAlchemy +  │  │ 100 EVs        │  │ demand / price │  │ QUBO (Ph7)     │
│ Alembic →     │  │ 10 stations    │  │ / solar        │  │ QAOA (Ph8)     │
│ PostgreSQL    │  │ 3 zones        │  │ forecasters    │  │ CP-SAT (Ph9)   │
└───────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

Modules are independent Python packages. The backend is the only component that
imports across all of them; `quantum_engine` and `ai_engine` never import the
backend, so both can be run head-less from scripts and tests.

## 2. Module responsibilities

| Path | Responsibility | Phase |
| --- | --- | --- |
| `backend/app/main.py` | FastAPI app factory, CORS, lifespan hooks, logging | 1 (extended 3–5) |
| `backend/app/core/config.py` | Single source of truth for settings, read from `.env` | 1 |
| `backend/app/api/` | Versioned REST routers under `/api/v1` | 1+ |
| `simulation/` | Synthetic smart-city state + evolution tick, publishes snapshots | 5 |
| `ai_engine/` | Trains/evaluates/serves demand, price and solar models | 6 |
| `quantum_engine/` | QUBO builder, QAOA runner, CP-SAT baseline, comparison | 7–9 |
| `database/` | Declarative models, session factory, Alembic migrations, seed data | 4 |
| `tests/` | pytest suite; one module per phase | 1–10 |
| `docs/` | Architecture and per-phase notes | all |

## 3. Optimization data flow (phases 5–10)

```
EV charging request
  → simulation snapshot (battery %, arrival time, zone, grid load, solar, tariff)
  → AI predictions (demand, price, solar for the planning horizon)
  → QUBO construction            x[i,s,t] ∈ {0,1}
  → QAOA on Qiskit Aer  ──┐
  → CP-SAT baseline     ──┤→ objective / feasibility / runtime comparison
  → best feasible schedule
  → charging assignment (station + time slot + estimated cost/duration)
  → dashboards updated (REST + WebSocket push)
```

### 3.1 QUBO objective (Phase 7)

Binary variable `x[i,s,t] = 1` iff EV *i* is assigned to station *s* in time slot *t*.

```
E(x) =  Σ energy_cost(i,s,t) · x[i,s,t]                     (electricity price × energy)
      + Σ waiting_cost(i,t) · x[i,s,t]                      (waiting time penalty)
      + Σ grid_penalty(t) · (Σ x[i,s,t] − grid_limit(t))²   (grid overload)
      + Σ station_penalty(s,t) · (Σ x[i,s,t] − capacity(s))²(station capacity)
      + Σ assignment_penalty · (Σ_s,t x[i,s,t] − 1)²        (each EV assigned once)
      − Σ renewable_bonus(s,t) · x[i,s,t]                   (solar / storage use)
```

Constraints become quadratic penalty terms; penalties are calibrated so that any
infeasible assignment costs strictly more than the best feasible one. Every generated
solution is validated against the original constraints before being returned.

### 3.2 Quantum scale strategy (Phase 8)

QAOA on a statevector simulator is limited to a small number of qubits. The small,
configurable instance used for the actual circuit is documented together with its
qubit count, depth, optimizer, shots and measured objective distribution. For the
full 100-EV problem the engine uses problem decomposition (per-zone / per-time-slot
sub-problems) with classical optimization, and any decomposition is reported as such
— never presented as a single QAOA solve.

## 4. Design rules

1. **No fake results.** Metrics come from held-out test data; QAOA outputs come from an
   executed circuit; infeasible solutions are reported as infeasible.
2. **Simulated data is labelled.** API responses carry `data_source: "simulated"` until
   real telemetry replaces the simulation.
3. **Swappable telemetry.** The simulation engine exposes a snapshot interface; an
   OCPP-compatible adapter can implement the same interface later without touching the
   API or the UI.
4. **Config over code.** Every tunable lives in `.env`; nothing is hard-coded in the
   route handlers.
5. **Phases are verified.** Each phase ships tests that must pass before the next phase
   starts.

## 5. Runtime topology

| Component | Local dev | Docker compose |
| --- | --- | --- |
| Frontend | Vite dev server, `:5173` | nginx serving built assets, `:5173 → :80` |
| Backend | uvicorn `--reload`, `:8000` | uvicorn in `python:3.12-slim`, `:8000` |
| Database | `docker compose up -d postgres` | `postgres:16-alpine`, named volume `pgdata` |
