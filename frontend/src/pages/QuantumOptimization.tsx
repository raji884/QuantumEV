/**
 * Quantum Optimization Dashboard — QUBO formulation, QAOA run and classical
 * comparison.
 *
 * Honesty note: the QAOA figures come from a small simulated Qiskit Aer
 * instance. OR-Tools CP-SAT solves the same instance exactly and is used as
 * the classical baseline. No quantum advantage is claimed anywhere here.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Atom, Boxes, Car, Clock, Gauge, Network, Percent, Target, Wallet, Zap } from 'lucide-react'

import { BarSeriesChart, CHART_COLORS } from '../components/charts/Charts'
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column } from '../components/ui'
import {
  latestRun,
  optimizationRuns,
  quboSummary,
  SAMPLE_NOW,
  scheduleAssignments,
} from '../data/sample'
import {
  formatCurrency,
  formatDuration,
  formatKW,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  titleCase,
} from '../lib/format'
import type { OptimizationRun, QuboSummary, SolverKind } from '../types'

type ConstraintRow = QuboSummary['constraints'][number]

const SOLVER_TONE: Record<SolverKind, BadgeTone> = {
  QAOA: 'quantum',
  'CP-SAT': 'neutral',
}

const STATUS_TONE: Record<OptimizationRun['status'], BadgeTone> = {
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
}

export default function QuantumOptimization() {
  const [selectedRunId, setSelectedRunId] = useState<string>(latestRun.id)
  const run = optimizationRuns.find((item) => item.id === selectedRunId) ?? latestRun

  const constraintRows = quboSummary.constraints
  const penaltyEntries = Object.entries(quboSummary.penaltyWeights) as [string, number][]
  const maxPenalty = Math.max(...penaltyEntries.map(([, value]) => value), 1)

  const constraintColumns: Column<ConstraintRow>[] = [
    { key: 'name', header: 'Constraint', render: (row) => <span className="text-slate-200">{row.name}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'equality' ? 'info' : 'warning'}>{titleCase(row.type)}</Badge>
      ),
      sortValue: (row) => row.type,
    },
    { key: 'enforcedBy', header: 'Enforced by', render: (row) => row.enforcedBy, sortValue: (row) => row.enforcedBy },
    {
      key: 'satisfied',
      header: 'Satisfied',
      render: (row) => <Badge tone={row.satisfied ? 'success' : 'danger'}>{row.satisfied ? 'Yes' : 'No'}</Badge>,
    },
  ]

  const runColumns: Column<OptimizationRun>[] = [
    {
      key: 'run',
      header: 'Run',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200">{row.id}</p>
          <p className="text-[11px] text-slate-500">{row.label}</p>
        </div>
      ),
      sortValue: (row) => row.id,
    },
    { key: 'created', header: 'Created', render: (row) => formatRelativeTime(row.createdAt, SAMPLE_NOW), sortValue: (row) => row.createdAt },
    {
      key: 'solver',
      header: 'Solver',
      render: (row) => <Badge tone={SOLVER_TONE[row.solver]}>{row.solver}</Badge>,
      sortValue: (row) => row.solver,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>,
      sortValue: (row) => row.status,
    },
    { key: 'objective', header: 'Objective', align: 'right', render: (row) => formatNumber(row.objective, 1), sortValue: (row) => row.objective },
    {
      key: 'feasible',
      header: 'Feasible',
      render: (row) => <Badge tone={row.feasible ? 'success' : 'danger'}>{row.feasible ? 'Yes' : 'No'}</Badge>,
    },
    { key: 'violations', header: 'Violations', align: 'right', render: (row) => row.constraintViolations, sortValue: (row) => row.constraintViolations },
    { key: 'util', header: 'Grid utilisation', align: 'right', render: (row) => formatPercent(row.gridUtilizationPct), sortValue: (row) => row.gridUtilizationPct },
    {
      key: 'assigned',
      header: 'EVs assigned',
      align: 'right',
      render: (row) => (
        <span>
          {row.assignedEVs}
          <span className="text-slate-500"> · {row.unassignedEVs} unassigned</span>
        </span>
      ),
      sortValue: (row) => row.assignedEVs,
    },
    { key: 'wait', header: 'Avg wait', align: 'right', render: (row) => formatDuration(row.avgWaitMinutes), sortValue: (row) => row.avgWaitMinutes },
    { key: 'cost', header: 'Cost per EV', align: 'right', render: (row) => formatCurrency(row.costPerEV), sortValue: (row) => row.costPerEV },
    { key: 'runtime', header: 'Runtime', align: 'right', render: (row) => `${row.runtimeSeconds.toFixed(2)} s`, sortValue: (row) => row.runtimeSeconds },
    {
      key: 'inspect',
      header: '',
      render: (row) => (
        <Button
          variant={row.id === selectedRunId ? 'primary' : 'secondary'}
          onClick={() => setSelectedRunId(row.id)}
        >
          Inspect
        </Button>
      ),
    },
  ]

  const costRows = useMemo(
    () => [
      {
        name: 'objective',
        energyCost: run.energyCost,
        waitingCost: run.waitingCost,
        gridOverloadPenalty: run.gridOverloadPenalty,
        renewableCredit: Math.abs(run.renewableCredit),
      },
    ],
    [run],
  )

  const solverComparison = useMemo(
    () =>
      optimizationRuns
        .filter((item) => item.qaoa !== null)
        .flatMap((item) => [
          { name: `${item.id} QAOA`, seconds: item.runtimeSeconds },
          { name: `${item.id} CP-SAT`, seconds: item.classical?.wallTimeSeconds ?? 0 },
        ]),
    [],
  )

  const slotTotals = useMemo(() => {
    const map = new Map<string, { slotLabel: string; energyKWh: number }>()
    for (const assignment of scheduleAssignments) {
      const entry = map.get(assignment.slotLabel) ?? { slotLabel: assignment.slotLabel, energyKWh: 0 }
      entry.energyKWh += assignment.energyKWh
      map.set(assignment.slotLabel, entry)
    }
    return [...map.values()]
      .map((entry) => ({ ...entry, energyKWh: Number(entry.energyKWh.toFixed(1)) }))
      .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel))
  }, [])

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Quantum Optimization Dashboard"
        description="Charging assignment is encoded as a QUBO and solved with QAOA, then benchmarked head-to-head against an OR-Tools CP-SAT exact solve on the same instance."
        actions={
          <Badge tone="quantum">
            <Atom className="size-3" />
            QUBO + QAOA vs CP-SAT
          </Badge>
        }
      />

      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-xs leading-relaxed text-amber-200/90">
        <p className="font-semibold text-amber-200">Scope and honesty note</p>
        <p className="mt-1">
          QAOA runs shown here are executed on a small simulated instance (14 qubits) with Qiskit
          Aer. CP-SAT solves the same instance exactly in ~2 seconds. No quantum advantage is
          claimed — at this problem size the classical solver is both faster and exact.
        </p>
      </div>

      <Card title="QUBO formulation" subtitle={quboSummary.instancedescription}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Variables" value={formatNumber(quboSummary.variables)} hint="binary decision variables" icon={Boxes} />
          <StatCard label="Quadratic terms" value={formatNumber(quboSummary.quadraticTerms)} hint="couplings in the QUBO matrix" icon={Network} />
          <StatCard label="Qubits" value={formatNumber(quboSummary.qubits)} hint="one qubit per variable" icon={Atom} tone="quantum" />
          <StatCard label="Density" value={formatPercent(quboSummary.densityPct, 2)} hint="share of non-zero couplings" icon={Percent} />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">{quboSummary.decomposition}</p>

        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-200">Constraints</h4>
          <div className="mt-2">
            <DataTable columns={constraintColumns} rows={constraintRows} rowKey={(row) => row.name} />
          </div>
        </div>

        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-200">Penalty weights (λ)</h4>
          <div className="mt-3 space-y-3">
            {penaltyEntries.map(([key, value]) => (
              <ProgressBar
                key={key}
                value={(value / maxPenalty) * 100}
                tone="indigo"
                label={titleCase(key)}
                valueLabel={value.toFixed(2)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Optimization runs"
        subtitle="QAOA and CP-SAT runs on the same decomposed instance"
        action={<Badge tone="neutral">{optimizationRuns.length} runs</Badge>}
      >
        <DataTable columns={runColumns} rows={optimizationRuns} rowKey={(row) => row.id} pageSize={10} />
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        {run.qaoa ? (
          <Card title="QAOA run" subtitle={`Simulated on ${run.qaoa.qubits} qubits with Qiskit Aer`}>
            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Qubits</dt>
                <dd className="text-slate-200">{run.qaoa.qubits}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Circuit depth</dt>
                <dd className="text-slate-200">{run.qaoa.depth}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Shots</dt>
                <dd className="text-slate-200">{formatNumber(run.qaoa.shots)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Optimizer</dt>
                <dd className="text-slate-200">{run.qaoa.optimizer}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Iterations</dt>
                <dd className="text-slate-200">{run.qaoa.iterations}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Feasible bitstrings</dt>
                <dd className="text-slate-200">{run.qaoa.feasibleBitstrings}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Best objective</dt>
                <dd className="text-slate-200">{formatNumber(run.qaoa.bestObjective, 1)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mean objective</dt>
                <dd className="text-slate-200">{formatNumber(run.qaoa.meanObjective, 1)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Std objective</dt>
                <dd className="text-slate-200">{formatNumber(run.qaoa.stdObjective, 1)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Approximation ratio</dt>
                <dd className="text-slate-200">
                  {run.qaoa.approximationRatio === null ? '—' : run.qaoa.approximationRatio.toFixed(3)}
                </dd>
              </div>
            </dl>

            <div className="mt-3">
              <p className="text-[11px] text-slate-500">Best bitstring</p>
              <p className="mt-1 font-mono text-xs break-all text-indigo-200">{run.qaoa.bestBitstring}</p>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              approximation ratio = best QAOA objective ÷ CP-SAT optimal objective, computed only
              when a classical reference exists.
            </p>
          </Card>
        ) : (
          <Card title="QAOA run">
            <EmptyState
              title="No QAOA run for this entry"
              description="This run was solved classically only."
            />
          </Card>
        )}

        {run.classical ? (
          <Card title="Classical baseline" subtitle="OR-Tools CP-SAT exact solve">
            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Solver</dt>
                <dd className="text-slate-200">{run.classical.solver}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="text-slate-200">{run.classical.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Optimal</dt>
                <dd>
                  <Badge tone={run.classical.optimal ? 'success' : 'warning'}>
                    {run.classical.optimal ? 'Optimal' : 'Sub-optimal'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Wall time</dt>
                <dd className="text-slate-200">{`${run.classical.wallTimeSeconds.toFixed(2)} s`}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Variables</dt>
                <dd className="text-slate-200">{formatNumber(run.classical.variables)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Constraints</dt>
                <dd className="text-slate-200">{formatNumber(run.classical.constraints)}</dd>
              </div>
            </dl>
          </Card>
        ) : (
          <Card title="Classical baseline">
            <EmptyState
              title="No classical baseline"
              description="This entry has no CP-SAT reference solve."
            />
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Objective" value={formatNumber(run.objective, 1)} hint="minimised QUBO cost" icon={Target} />
        <StatCard label="Grid utilisation" value={formatPercent(run.gridUtilizationPct)} hint="at scheduled peak" icon={Gauge} />
        <StatCard label="Peak grid load" value={formatKW(run.peakGridLoadKW)} hint="highest scheduled slot" icon={Zap} tone="warning" />
        <StatCard
          label="EVs assigned"
          value={`${run.assignedEVs} / ${run.assignedEVs + run.unassignedEVs}`}
          hint={`${run.unassignedEVs} unassigned`}
          icon={Car}
          tone="positive"
        />
        <StatCard label="Average wait" value={formatDuration(run.avgWaitMinutes)} hint="mean queue time" icon={Clock} />
        <StatCard label="Cost per EV" value={formatCurrency(run.costPerEV)} hint="energy + waiting" icon={Wallet} />
      </section>

      <Card title="Cost decomposition" subtitle={`Objective breakdown for ${run.id}`}>
        <BarSeriesChart
          data={costRows}
          xKey="name"
          series={[
            { key: 'energyCost', name: 'Energy cost', color: CHART_COLORS.indigo },
            { key: 'waitingCost', name: 'Waiting cost', color: CHART_COLORS.amber },
            { key: 'gridOverloadPenalty', name: 'Grid overload penalty', color: CHART_COLORS.rose },
            { key: 'renewableCredit', name: 'Renewable credit (magnitude)', color: CHART_COLORS.emerald },
          ]}
          stacked
          height={240}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          The renewable term is a credit: it subtracts from the objective, so this bar shows its
          magnitude while its contribution in the solver is negative.
        </p>
      </Card>

      <Card title="QAOA vs classical" subtitle="Wall-clock seconds per solver on the simulated instance">
        <BarSeriesChart
          data={solverComparison}
          xKey="name"
          series={[{ key: 'seconds', name: 'Runtime', color: CHART_COLORS.indigo }]}
          unit=" s"
          height={240}
        />
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
          <li>QAOA currently takes tens of seconds on the small simulated instance (14 qubits, depth 3, COBYLA).</li>
          <li>OR-Tools CP-SAT returns an exact optimum for the same instance in roughly 2 seconds.</li>
          <li>The quantum path is investigated because the QUBO generalises to larger instances, not because it wins today.</li>
          <li>The platform reports whichever solver produced the best validated feasible schedule.</li>
        </ul>
      </Card>

      <Card
        title="Optimized schedule preview"
        subtitle="Total energy assigned per time slot (latest run)"
        action={
          <Link to="/app/schedule" className="text-xs font-medium text-indigo-300 hover:text-indigo-200">
            Open full schedule results →
          </Link>
        }
      >
        <BarSeriesChart
          data={slotTotals}
          xKey="slotLabel"
          series={[{ key: 'energyKWh', name: 'Energy', color: CHART_COLORS.cyan }]}
          unit=" kWh"
          stacked
          height={240}
        />
      </Card>
    </>
  )
}
