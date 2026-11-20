import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Atom,
  BarChart3,
  Brain,
  Car,
  Gauge,
  Leaf,
  PlugZap,
  Sun,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column } from '../components/ui'
import {
  AreaStackChart,
  BarSeriesChart,
  CHART_COLORS,
  ChartLegendList,
  DonutChart,
} from '../components/charts/Charts'
import {
  gridSeries,
  latestRun,
  notifications,
  platformKpis,
  stations,
  zoneById,
  zoneLoads,
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
import type { NotificationSeverity, Station, StationStatus } from '../types'

const STATION_STATUS_TONE: Record<StationStatus, BadgeTone> = {
  available: 'success',
  busy: 'warning',
  maintenance: 'info',
  offline: 'danger',
}

const SEVERITY_TONE: Record<NotificationSeverity, BadgeTone> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
}

/** Utilisation colour band used for the station progress bars. */
function utilizationTone(pct: number): 'emerald' | 'amber' | 'rose' {
  if (pct >= 85) return 'rose'
  if (pct >= 70) return 'amber'
  return 'emerald'
}

function runStatusTone(status: string): BadgeTone {
  if (status === 'completed') return 'success'
  if (status === 'running') return 'info'
  if (status === 'failed') return 'danger'
  return 'neutral'
}

const stationColumns: Column<Station>[] = [
  {
    key: 'station',
    header: 'Station',
    sortValue: (row) => row.name,
    render: (row) => (
      <div className="min-w-0">
        <p className="font-medium text-slate-200">{row.name}</p>
        <p className="text-[11px] text-slate-500">{row.address}</p>
      </div>
    ),
  },
  {
    key: 'zone',
    header: 'Zone',
    sortValue: (row) => zoneById(row.zoneId).name,
    render: (row) => zoneById(row.zoneId).name,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (row) => row.status,
    render: (row) => <Badge tone={STATION_STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>,
  },
  {
    key: 'utilization',
    header: 'Utilisation',
    sortValue: (row) => row.utilizationPct,
    render: (row) => (
      <div className="w-32">
        <ProgressBar
          value={row.utilizationPct}
          tone={utilizationTone(row.utilizationPct)}
          valueLabel={formatPercent(row.utilizationPct)}
        />
      </div>
    ),
  },
  {
    key: 'queue',
    header: 'Queue',
    align: 'right',
    sortValue: (row) => row.queueLength,
    render: (row) => formatNumber(row.queueLength),
  },
  {
    key: 'activeSessions',
    header: 'Active sessions',
    align: 'right',
    sortValue: (row) => row.activeSessions,
    render: (row) => formatNumber(row.activeSessions),
  },
  {
    key: 'tariff',
    header: 'Tariff',
    align: 'right',
    sortValue: (row) => row.pricePerKWh,
    render: (row) => formatCurrency(row.pricePerKWh),
  },
]

const QUICK_ACTIONS: { to: string; label: string; hint: string; icon: LucideIcon }[] = [
  { to: '/app/stations', label: 'Charging stations', hint: 'Status, queues and pricing', icon: PlugZap },
  { to: '/app/grid', label: 'Smart grid', hint: 'Load, solar and battery', icon: Gauge },
  { to: '/app/ai', label: 'AI predictions', hint: 'Demand, price and solar', icon: Brain },
  { to: '/app/quantum', label: 'Quantum optimizer', hint: 'QUBO, QAOA and CP-SAT', icon: Atom },
  { to: '/app/analytics', label: 'Analytics & reports', hint: 'Energy, cost and CO₂', icon: BarChart3 },
]

/** Compact labelled value tile used inside the optimization-run summary. */
function RunStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const statusCounts: Record<StationStatus, number> = {
    available: 0,
    busy: 0,
    maintenance: 0,
    offline: 0,
  }
  stations.forEach((station) => {
    statusCounts[station.status] += 1
  })

  const donutData = [
    { name: 'Available', value: statusCounts.available, color: CHART_COLORS.emerald },
    { name: 'Busy', value: statusCounts.busy, color: CHART_COLORS.amber },
    { name: 'Maintenance', value: statusCounts.maintenance, color: CHART_COLORS.sky },
    { name: 'Offline', value: statusCounts.offline, color: CHART_COLORS.rose },
  ]

  const legendItems = donutData.map((item) => ({
    name: item.name,
    value: `${item.value}`,
    color: item.color,
  }))

  const topStations = [...stations]
    .sort((a, b) => b.utilizationPct - a.utilizationPct)
    .slice(0, 6)

  const recentAlerts = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const gridCapacityKW = gridSeries[0].capacityKW

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Admin Dashboard"
        description="Whole-platform operational overview across 100 simulated EVs, 10 charging stations and 3 city zones. Every figure on this page is generated sample data."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total EVs"
          value={formatNumber(platformKpis.totalEVs)}
          hint="simulated vehicles registered"
          icon={Car}
          tone="quantum"
        />
        <StatCard
          label="Active charging sessions"
          value={formatNumber(platformKpis.activeSessions)}
          hint="sessions in progress right now"
          icon={Zap}
          tone="positive"
        />
        <StatCard
          label="Stations available"
          value={`${platformKpis.availableStations}/${platformKpis.totalStations}`}
          hint="available / total"
          icon={PlugZap}
        />
        <StatCard
          label="Grid utilisation"
          value={formatPercent(platformKpis.gridUtilizationPct)}
          hint="of total zonal capacity"
          icon={Gauge}
          tone="warning"
        />
        <StatCard
          label="Solar generation"
          value={formatKW(platformKpis.solarGenerationKW)}
          hint="depot + rooftop, sample snapshot"
          icon={Sun}
          tone="warning"
        />
        <StatCard
          label="Predicted mean price"
          value={formatCurrency(platformKpis.predictedPricePerKWh)}
          hint="per kWh, daily mean forecast"
          icon={TrendingUp}
        />
        <StatCard
          label="Estimated schedule cost"
          value={formatCurrency(platformKpis.estimatedScheduleCost, 0)}
          hint="current optimised schedule"
          icon={Wallet}
          tone="quantum"
        />
        <StatCard
          label="Cost saving vs baseline"
          value={formatPercent(platformKpis.costSavingVsBaselinePct)}
          hint="modelled, vs un-optimized baseline"
          icon={Leaf}
          tone="positive"
        />
      </div>

      <Card
        title="Grid load — last 24 hours"
        subtitle="Stacked base + EV load per hour, compared with total grid capacity."
      >
        <AreaStackChart
          data={gridSeries}
          xKey="hour"
          series={[
            { key: 'baseLoadKW', name: 'Base load', color: CHART_COLORS.slate },
            { key: 'evLoadKW', name: 'EV load', color: CHART_COLORS.indigo },
          ]}
          referenceY={gridCapacityKW}
          referenceLabel="Grid capacity"
          unit=" kW"
        />
        <p className="mt-3 text-xs text-slate-500">
          The y-axis is in kW and the dashed red line marks total zonal grid capacity
          ({formatKW(gridCapacityKW)}) summed across the 3 zones.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Station status mix"
          subtitle="Count of the 10 stations by current status."
        >
          <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
            <DonutChart
              data={donutData}
              height={220}
              centerValue={String(stations.length)}
              centerLabel="stations"
            />
            <ChartLegendList items={legendItems} />
          </div>
        </Card>

        <Card
          title="Zone load"
          subtitle="Current load against available capacity for each zone."
        >
          <BarSeriesChart
            data={zoneLoads}
            xKey="zoneName"
            series={[
              { key: 'loadKW', name: 'Load', color: CHART_COLORS.cyan },
              { key: 'capacityKW', name: 'Capacity', color: CHART_COLORS.slate },
            ]}
            unit=" kW"
          />
        </Card>
      </div>

      <Card
        title="Latest optimization run"
        subtitle="Most recent QUBO scheduling run and its headline results."
        action={
          <Link
            to="/app/quantum"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Open quantum optimizer
            <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-100">{latestRun.label}</span>
          <Badge tone={latestRun.solver === 'QAOA' ? 'quantum' : 'neutral'}>
            {latestRun.solver}
          </Badge>
          <Badge tone={runStatusTone(latestRun.status)}>{titleCase(latestRun.status)}</Badge>
          <Badge tone={latestRun.feasible ? 'success' : 'danger'}>
            {latestRun.feasible ? 'Feasible' : 'Infeasible'}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RunStat label="Objective" value={formatNumber(latestRun.objective, 1)} />
          <RunStat
            label="Constraint violations"
            value={formatNumber(latestRun.constraintViolations)}
          />
          <RunStat
            label="Grid utilisation"
            value={formatPercent(latestRun.gridUtilizationPct)}
          />
          <RunStat
            label="EVs assigned / unassigned"
            value={`${latestRun.assignedEVs} / ${latestRun.unassignedEVs}`}
          />
          <RunStat label="Avg wait" value={formatDuration(latestRun.avgWaitMinutes)} />
          <RunStat
            label="Runtime"
            value={`${formatNumber(latestRun.runtimeSeconds, 1)} s`}
          />
          <RunStat
            label="Peak grid load"
            value={formatKW(latestRun.peakGridLoadKW)}
          />
          <RunStat
            label="Created"
            value={formatRelativeTime(latestRun.createdAt)}
          />
        </div>
      </Card>

      <Card
        title="Highest-utilised stations"
        subtitle="The 6 busiest stations by current utilisation."
      >
        <DataTable
          columns={stationColumns}
          rows={topStations}
          rowKey={(row) => row.id}
          pageSize={12}
          initialSortKey="utilization"
          initialSortDesc
        />
      </Card>

      <Card
        title="Recent alerts"
        subtitle="The 5 most recent platform notifications."
      >
        <ul className="space-y-3">
          {recentAlerts.map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-start gap-3">
              <Badge tone={SEVERITY_TONE[alert.severity]}>{titleCase(alert.severity)}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{alert.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="muted">{titleCase(alert.category)}</Badge>
                <span className="text-[11px] text-slate-500">
                  {formatRelativeTime(alert.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Quick actions"
        subtitle="Local navigation only — no backend calls in Phase 2."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 transition hover:border-indigo-400/40 hover:bg-white/[0.05]"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <action.icon className="size-4" />
              </span>
              <span className="text-xs font-medium text-slate-200">{action.label}</span>
              <span className="text-[11px] text-slate-500">{action.hint}</span>
              <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-indigo-300 opacity-0 transition group-hover:opacity-100">
                Open
                <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  )
}
