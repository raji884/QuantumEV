import { useCallback, useEffect, useState } from 'react'

import {
  API_BASE_URL,
  WS_BASE_URL,
  fetchDependencies,
  fetchHealth,
  type DependencyResponse,
  type HealthResponse,
} from './lib/api'

type LoadState = 'loading' | 'ready' | 'error'

const PIPELINE_STAGES: { name: string; detail: string }[] = [
  { name: 'EV charging request', detail: 'REST + WebSocket intake' },
  { name: 'Real-time data', detail: 'Simulation engine snapshot' },
  { name: 'AI predictions', detail: 'Demand · price · solar' },
  { name: 'QUBO generation', detail: 'Cost + waiting + grid penalties' },
  { name: 'QAOA execution', detail: 'Qiskit Aer, configurable instance' },
  { name: 'Classical baseline', detail: 'OR-Tools CP-SAT' },
  { name: 'Best feasible schedule', detail: 'Constraint validated' },
]

const PHASES: { id: number; title: string; done: boolean }[] = [
  { id: 1, title: 'Structure & environment', done: true },
  { id: 2, title: 'Frontend & UI', done: false },
  { id: 3, title: 'Backend & auth', done: false },
  { id: 4, title: 'PostgreSQL database', done: false },
  { id: 5, title: 'Real-time simulation', done: false },
  { id: 6, title: 'AI prediction models', done: false },
  { id: 7, title: 'QUBO formulation', done: false },
  { id: 8, title: 'QAOA implementation', done: false },
  { id: 9, title: 'Classical comparison', done: false },
  { id: 10, title: 'Integration & deployment', done: false },
]

function StatusPill({ state, label }: { state: LoadState; label: string }) {
  const palette: Record<LoadState, string> = {
    loading: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
    ready: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
    error: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${palette[state]}`}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-2 animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
      {label}
    </span>
  )
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
        {title}
      </p>
      <p className="mt-2 truncate text-xl font-semibold text-slate-100">{value}</p>
      {hint ? <p className="mt-1 truncate text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<LoadState>('loading')
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [dependencies, setDependencies] = useState<DependencyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const [healthData, dependencyData] = await Promise.all([
        fetchHealth(),
        fetchDependencies(),
      ])
      setHealth(healthData)
      setDependencies(dependencyData)
      setState('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const passed = dependencies?.checks.filter((check) => check.status === 'ok').length ?? 0
  const total = dependencies?.checks.length ?? 0

  return (
    <div className="min-h-dvh bg-[#060a15] text-slate-200">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-lg font-bold text-slate-900">
              Q
            </span>
            <div>
              <h1 className="text-lg leading-tight font-semibold text-slate-50">
                QuantumEV
              </h1>
              <p className="text-xs text-slate-400">
                Intelligent EV Charging &amp; Smart Grid Optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill
              state={state}
              label={
                state === 'ready'
                  ? 'Backend online'
                  : state === 'loading'
                    ? 'Contacting backend…'
                    : 'Backend unreachable'
              }
            />
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="mt-8">
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/30">
            Phase 1 of 10 · Project structure &amp; environment setup
          </span>
          <h2 className="mt-4 max-w-3xl text-3xl leading-tight font-semibold text-slate-50 sm:text-4xl">
            AI + Quantum optimization for electric vehicle charging demand
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            This build stands up the full platform skeleton: FastAPI backend, React
            + TypeScript + Tailwind frontend, PostgreSQL, and the AI / QUBO / QAOA
            engines. Every dependency required by later phases is verified against
            the running interpreter — nothing is stubbed or faked.
          </p>
        </section>

        {state === 'error' ? (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
            <p className="font-medium text-rose-200">
              Could not reach the backend at {API_BASE_URL}
            </p>
            <p className="mt-1 font-mono text-xs text-rose-300/80">{error}</p>
            <p className="mt-2 text-xs text-rose-200/70">
              Start it with:{' '}
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono">
                .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload
              </code>
            </p>
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="API service"
            value={health ? `${health.service} v${health.version}` : '—'}
            hint={health ? `uptime ${health.uptime_seconds.toFixed(0)}s` : 'loading…'}
          />
          <StatCard
            title="Environment"
            value={health?.environment ?? '—'}
            hint={health ? `data source: ${health.data_source}` : 'loading…'}
          />
          <StatCard
            title="Python runtime"
            value={dependencies?.python ?? '—'}
            hint={dependencies?.platform ?? 'loading…'}
          />
          <StatCard
            title="Dependencies"
            value={total > 0 ? `${passed} / ${total} importable` : '—'}
            hint={
              dependencies
                ? dependencies.failed.length > 0
                  ? `failed: ${dependencies.failed.join(', ')}`
                  : 'AI, quantum and database stacks ready'
                : 'loading…'
            }
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-slate-100">
              Dependency readiness
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Reported by <span className="font-mono">GET /api/v1/health/dependencies</span> —
              a real import of each package in the running backend.
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Package</th>
                    <th className="px-3 py-2 font-medium">Used in</th>
                    <th className="px-3 py-2 font-medium">Version</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(dependencies?.checks ?? []).map((check) => (
                    <tr key={check.package} className="bg-transparent">
                      <td className="px-3 py-2 font-mono text-slate-200">
                        {check.package}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{check.phase}</td>
                      <td className="px-3 py-2 font-mono text-slate-400">
                        {check.version ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            check.status === 'ok'
                              ? 'font-medium text-emerald-300'
                              : 'font-medium text-rose-300'
                          }
                        >
                          {check.status === 'ok' ? 'ok' : 'error'}
                        </span>
                        {check.error ? (
                          <span className="ml-2 text-rose-300/70">{check.error}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {dependencies === null ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={4}>
                        Waiting for backend…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Optimization pipeline
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Wired up across phases 5–10.
            </p>
            <ol className="mt-3 space-y-2">
              {PIPELINE_STAGES.map((stage, index) => (
                <li
                  key={stage.name}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-[10px] font-semibold text-indigo-300">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-medium text-slate-200">
                      {stage.name}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {stage.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-sm font-semibold text-slate-100">Delivery roadmap</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {PHASES.map((phase) => (
              <div
                key={phase.id}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  phase.done
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                    : 'border-white/10 bg-white/[0.02] text-slate-400'
                }`}
              >
                <span className="font-mono">P{phase.id}</span> · {phase.title}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-slate-500">
          <p>
            Simulation target: 100 EVs · 10 charging stations · 3 city zones.
            All platform data is <strong className="text-slate-400">simulated</strong>;
            real charger telemetry can be attached later through an OCPP-compatible
            adapter.
          </p>
          <p className="mt-2 font-mono">
            API {API_BASE_URL} · WS {WS_BASE_URL} · Swagger /docs
          </p>
        </footer>
      </div>
    </div>
  )
}
