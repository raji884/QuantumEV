import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Atom,
  BarChart3,
  BatteryCharging,
  Brain,
  Car,
  Cpu,
  Gauge,
  Leaf,
  Network,
  PlugZap,
  ShieldCheck,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { PublicNav } from '../components/layout/PublicNav'
import { StationMap } from '../components/map/StationMap'
import { Badge, Card, StatCard } from '../components/ui'
import { platformKpis, stations, zones } from '../data/sample'
import { formatKW } from '../lib/format'

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gauge,
    title: 'Real-time grid monitoring',
    body: 'Live zone loads, solar generation, battery state of charge and frequency, refreshed from the simulation engine over WebSockets.',
  },
  {
    icon: Brain,
    title: 'AI demand & price forecasting',
    body: 'Gradient-boosted models forecast charging demand, tariff and solar output. Metrics are computed on held-out test data — never hard-coded.',
  },
  {
    icon: Atom,
    title: 'QUBO optimization on quantum hardware',
    body: 'Charging assignment is encoded as a QUBO with energy, waiting, grid-overload, capacity and renewable terms, then solved with QAOA on Qiskit Aer.',
  },
  {
    icon: BarChart3,
    title: 'Honest classical comparison',
    body: 'Every quantum run is benchmarked against an OR-Tools CP-SAT optimum. Quantum advantage is reported only when the evidence supports it.',
  },
  {
    icon: BatteryCharging,
    title: 'Smart charging schedules',
    body: 'Per-EV station and time-slot assignments that flatten the evening peak and shift flexible load into cheaper, sunnier windows.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    body: 'Separate experiences for administrators, EV owners and energy operators, enforced with JWT auth and role-based routing.',
  },
]

const PIPELINE: { title: string; body: string; icon: LucideIcon }[] = [
  {
    icon: Car,
    title: '1 · Charging request',
    body: 'An EV asks for energy. The request carries its zone, connector, priority and requested kWh.',
  },
  {
    icon: Network,
    title: '2 · Live grid state',
    body: 'The simulation engine publishes load, solar, battery and price snapshots across 3 zones and 10 stations.',
  },
  {
    icon: TrendingUp,
    title: '3 · AI prediction',
    body: 'Demand, price and solar models forecast the next hours so the optimizer can look ahead.',
  },
  {
    icon: Atom,
    title: '4 · QUBO + QAOA',
    body: 'Constraints become penalty terms in a QUBO, minimized by QAOA; CP-SAT provides the exact baseline.',
  },
  {
    icon: PlugZap,
    title: '5 · Schedule',
    body: 'The best feasible assignment is validated against every constraint and pushed to the dashboards.',
  },
]

const ROLES = [
  {
    icon: Users,
    name: 'Administrator',
    body: 'Whole-platform oversight: KPIs, users, stations, grid health, optimization runs and reports.',
    demo: 'admin@quantumev.io',
  },
  {
    icon: Car,
    name: 'EV Owner',
    body: 'Personal vehicles, charging requests, scheduled slots and spend, with smart-charging preferences.',
    demo: 'owner@quantumev.io',
  },
  {
    icon: Zap,
    name: 'Energy Operator',
    body: 'Grid monitoring, station operations, forecast review and quantum vs classical optimization runs.',
    demo: 'operator@quantumev.io',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#060a15] text-slate-200">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 55% at 15% 0%, rgba(99,102,241,0.22) 0%, transparent 65%), radial-gradient(50% 50% at 85% 10%, rgba(34,211,238,0.16) 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge tone="quantum">
              <Atom className="size-3" />
              AI + Quantum computing for EV charging
            </Badge>
            <h1 className="mt-5 text-3xl leading-tight font-semibold text-slate-50 sm:text-5xl">
              Charge smarter.
              <span className="block bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                Optimize the whole grid.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              QuantumEV simulates 100 electric vehicles across 10 charging stations and
              3 city zones, predicts tomorrow&apos;s demand with machine learning, and
              solves the charging-assignment problem as a QUBO using QAOA — always
              benchmarked against an exact classical solver.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Open the dashboards
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                Create an account
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Demo accounts are listed on the sign-in page. No payment details, no real
              charger is ever controlled.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Simulated EVs"
              value={String(platformKpis.totalEVs)}
              hint="across 3 city zones"
              icon={Car}
              tone="quantum"
            />
            <StatCard
              label="Charging stations"
              value={`${platformKpis.availableStations}/${platformKpis.totalStations}`}
              hint="available / total"
              icon={PlugZap}
            />
            <StatCard
              label="Grid utilization"
              value={`${platformKpis.gridUtilizationPct.toFixed(1)}%`}
              hint="current sample snapshot"
              icon={Gauge}
              tone="positive"
            />
            <StatCard
              label="Solar generation"
              value={formatKW(platformKpis.solarGenerationKW)}
              hint="depot + rooftop"
              icon={Sun}
              tone="warning"
            />
            <StatCard
              label="AI mean price forecast"
              value={`₹${platformKpis.predictedPricePerKWh.toFixed(2)}`}
              hint="per kWh, daily mean"
              icon={TrendingUp}
            />
            <StatCard
              label="Modelled cost saving"
              value={`${platformKpis.costSavingVsBaselinePct.toFixed(1)}%`}
              hint="vs un-optimized baseline"
              icon={Leaf}
              tone="positive"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Everything the platform does
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Six cooperating subsystems: simulation, forecasting, quantum optimization,
            classical benchmarking, scheduling and role-based dashboards.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <feature.icon className="size-4" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="border-t border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            How a charging request becomes a schedule
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Five stages, each a separate engine, all observable from the dashboards.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {PIPELINE.map((step) => (
              <div
                key={step.title}
                className="relative rounded-xl border border-white/10 bg-[#080d1a] p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950">
                  <step.icon className="size-4" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Network map */}
      <section id="network" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                Charging network across 3 city zones
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Ten stations, colour-coded by live status. Click a station to see its
                chargers, power rating, queue and tariff.
              </p>
            </div>
            <Badge tone="neutral">Sample coordinates · Bengaluru</Badge>
          </div>
          <div className="mt-6">
            <StationMap stations={stations} zones={zones} height={440} />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-t border-white/10 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
            Three roles, three dashboards
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {ROLES.map((role) => (
              <Card key={role.name} className="h-full">
                <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-slate-200">
                  <role.icon className="size-4" />
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-slate-100">{role.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{role.body}</p>
                <p className="mt-3 font-mono text-[11px] text-slate-500">{role.demo}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Honesty + CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-2">
          <Card
            title="Data honesty rules"
            subtitle="These constraints are enforced across every phase of the build."
          >
            <ul className="space-y-3 text-xs leading-relaxed text-slate-400">
              <li className="flex gap-2.5">
                <Cpu className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                All platform data is simulated and labelled as such — no fabricated
                production telemetry.
              </li>
              <li className="flex gap-2.5">
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                Model accuracy is computed from held-out test splits, never hard-coded.
              </li>
              <li className="flex gap-2.5">
                <Atom className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                QAOA results come from real Qiskit Aer execution; no random output is
                relabelled as quantum.
              </li>
              <li className="flex gap-2.5">
                <BarChart3 className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                Quantum advantage is only claimed where CP-SAT benchmarking demonstrates
                it.
              </li>
            </ul>
          </Card>

          <div className="flex flex-col justify-center rounded-xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/12 to-cyan-400/5 p-7">
            <h2 className="text-xl font-semibold text-slate-50">
              Explore the Phase 2 interface
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The full dashboard suite is live with sample data: grid monitoring,
              forecasting, quantum optimization and reporting.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                Sign in with a demo account
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8">
          <span>
            QuantumEV · Intelligent EV Charging &amp; Grid Optimization · Phase 2 UI
          </span>
          <span className="font-mono">100 EVs · 10 stations · 3 zones</span>
        </div>
      </footer>
    </div>
  )
}
