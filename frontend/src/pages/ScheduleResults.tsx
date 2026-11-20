import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Car,
  Clock,
  Coins,
  Gauge,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  SearchInput,
  SelectFilter,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column, ProgressTone } from '../components/ui'
import {
  BarSeriesChart,
  CHART_COLORS,
  ChartLegendList,
  DonutChart,
  LineSeriesChart,
} from '../components/charts/Charts'
import { latestRun, scheduleAssignments } from '../data/sample'
import {
  formatCurrency,
  formatDuration,
  formatKWh,
  formatKW,
  formatPercent,
  formatRelativeTime,
} from '../lib/format'
import type { ScheduleAssignment } from '../types'

const SOURCE_COLORS: Record<ScheduleAssignment['source'], string> = {
  'QUBO + QAOA': CHART_COLORS.indigo,
  'CP-SAT': CHART_COLORS.slate,
  hybrid: CHART_COLORS.cyan,
}

function priorityTone(priority: number): BadgeTone {
  if (priority >= 4) return 'danger'
  if (priority === 3) return 'warning'
  return 'neutral'
}

function sourceTone(source: ScheduleAssignment['source']): BadgeTone {
  if (source === 'QUBO + QAOA') return 'quantum'
  if (source === 'hybrid') return 'info'
  return 'neutral'
}

function loadTone(pct: number): ProgressTone {
  if (pct >= 85) return 'rose'
  if (pct >= 70) return 'amber'
  return 'emerald'
}

interface Kpi {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'positive' | 'warning' | 'danger' | 'quantum'
  icon: LucideIcon
}

export default function ScheduleResults() {
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState('all')
  const [source, setSource] = useState('all')
  const [slot, setSlot] = useState('all')

  const totals = useMemo(
    () => ({
      energy: scheduleAssignments.reduce((sum, row) => sum + row.energyKWh, 0),
      cost: scheduleAssignments.reduce((sum, row) => sum + row.estimatedCost, 0),
    }),
    [],
  )

  const slotEnergy = useMemo(() => {
    const groups = new Map<number, { slotIndex: number; slotLabel: string; energyKWh: number }>()
    for (const row of scheduleAssignments) {
      const current = groups.get(row.slotIndex)
      if (current) {
        current.energyKWh += row.energyKWh
      } else {
        groups.set(row.slotIndex, {
          slotIndex: row.slotIndex,
          slotLabel: row.slotLabel,
          energyKWh: row.energyKWh,
        })
      }
    }
    return [...groups.values()].sort((a, b) => a.slotIndex - b.slotIndex)
  }, [])

  const slotTimeline = useMemo(() => {
    const groups = new Map<
      number,
      { slotIndex: number; slotLabel: string; count: number; loadSum: number }
    >()
    for (const row of scheduleAssignments) {
      const current = groups.get(row.slotIndex)
      if (current) {
        current.count += 1
        current.loadSum += row.gridLoadAtSlotPct
      } else {
        groups.set(row.slotIndex, {
          slotIndex: row.slotIndex,
          slotLabel: row.slotLabel,
          count: 1,
          loadSum: row.gridLoadAtSlotPct,
        })
      }
    }
    return [...groups.values()]
      .map((group) => ({
        slotIndex: group.slotIndex,
        slotLabel: group.slotLabel,
        count: group.count,
        meanLoad: group.loadSum / group.count,
      }))
      .sort((a, b) => a.slotIndex - b.slotIndex)
  }, [])

  const slotGridLoad = useMemo(
    () =>
      slotTimeline.map((entry) => ({
        slotIndex: entry.slotIndex,
        slotLabel: entry.slotLabel,
        avgGridLoadPct: entry.meanLoad,
      })),
    [slotTimeline],
  )

  const sourceMix = useMemo(() => {
    const counts = new Map<ScheduleAssignment['source'], number>()
    for (const row of scheduleAssignments) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1)
    }
    const order: ScheduleAssignment['source'][] = ['QUBO + QAOA', 'CP-SAT', 'hybrid']
    return order
      .filter((name) => (counts.get(name) ?? 0) > 0)
      .map((name) => ({
        name,
        value: counts.get(name) ?? 0,
        color: SOURCE_COLORS[name],
      }))
  }, [])

  const zoneOptions = useMemo(() => {
    const names = [...new Set(scheduleAssignments.map((row) => row.zoneName))]
    return [{ value: 'all', label: 'All zones' }, ...names.map((name) => ({ value: name, label: name }))]
  }, [])

  const slotOptions = useMemo(() => {
    const labels = [...new Set(scheduleAssignments.map((row) => row.slotLabel))].sort()
    return [{ value: 'all', label: 'All slots' }, ...labels.map((label) => ({ value: label, label }))]
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return scheduleAssignments.filter((row) => {
      if (zone !== 'all' && row.zoneName !== zone) return false
      if (source !== 'all' && row.source !== source) return false
      if (slot !== 'all' && row.slotLabel !== slot) return false
      if (
        needle &&
        !row.vehicleLabel.toLowerCase().includes(needle) &&
        !row.stationName.toLowerCase().includes(needle)
      ) {
        return false
      }
      return true
    })
  }, [query, zone, source, slot])

  const columns: Column<ScheduleAssignment>[] = [
    {
      key: 'slot',
      header: 'Slot',
      sortValue: (row) => row.slotIndex,
      render: (row) => <span className="font-mono text-slate-200">{row.slotLabel}</span>,
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => <span className="font-medium text-slate-200">{row.vehicleLabel}</span>,
    },
    { key: 'station', header: 'Station', render: (row) => row.stationName },
    { key: 'zone', header: 'Zone', render: (row) => row.zoneName },
    {
      key: 'energy',
      header: 'Energy',
      align: 'right',
      sortValue: (row) => row.energyKWh,
      render: (row) => formatKWh(row.energyKWh),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
      sortValue: (row) => row.durationMinutes,
      render: (row) => formatDuration(row.durationMinutes),
    },
    {
      key: 'cost',
      header: 'Est. cost',
      align: 'right',
      sortValue: (row) => row.estimatedCost,
      render: (row) => formatCurrency(row.estimatedCost),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'center',
      sortValue: (row) => row.priority,
      render: (row) => <Badge tone={priorityTone(row.priority)}>P{row.priority}</Badge>,
    },
    {
      key: 'gridLoad',
      header: 'Grid load',
      render: (row) => (
        <div className="min-w-[120px]">
          <ProgressBar
            value={row.gridLoadAtSlotPct}
            tone={loadTone(row.gridLoadAtSlotPct)}
            valueLabel={formatPercent(row.gridLoadAtSlotPct)}
          />
        </div>
      ),
    },
    {
      key: 'renewable',
      header: 'Renewable',
      align: 'right',
      sortValue: (row) => row.renewableSharePct,
      render: (row) => formatPercent(row.renewableSharePct),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => <Badge tone={sourceTone(row.source)}>{row.source}</Badge>,
    },
  ]

  const kpis: Kpi[] = [
    {
      label: 'EVs assigned',
      value: String(latestRun.assignedEVs),
      hint: 'in the latest run',
      icon: Car,
    },
    {
      label: 'Unassigned',
      value: String(latestRun.unassignedEVs),
      hint: 'no feasible slot',
      tone: latestRun.unassignedEVs > 0 ? 'warning' : 'default',
      icon: AlertTriangle,
    },
    {
      label: 'Energy scheduled',
      value: formatKWh(totals.energy),
      hint: 'sum of assignments',
      icon: BatteryCharging,
    },
    {
      label: 'Total est. cost',
      value: formatCurrency(totals.cost, 0),
      hint: 'across assignments',
      icon: Wallet,
    },
    {
      label: 'Average wait',
      value: formatDuration(latestRun.avgWaitMinutes),
      hint: 'per assigned EV',
      icon: Clock,
    },
    {
      label: 'Peak grid load',
      value: formatKW(latestRun.peakGridLoadKW),
      hint: 'latest run peak',
      icon: Gauge,
    },
    {
      label: 'Grid utilisation',
      value: formatPercent(latestRun.gridUtilizationPct),
      hint: 'latest run',
      icon: Activity,
    },
    {
      label: 'Cost per EV',
      value: formatCurrency(latestRun.costPerEV, 0),
      hint: 'average',
      icon: Coins,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Charging Schedule Results"
        description={`Per-EV station and time-slot assignments produced by the latest simulated optimization run — ${latestRun.label}.`}
        actions={
          <>
            <Badge tone={latestRun.solver === 'QAOA' ? 'quantum' : 'neutral'}>
              {latestRun.solver}
            </Badge>
            <Badge tone="muted">{formatRelativeTime(latestRun.createdAt)}</Badge>
          </>
        }
      />

      <p className="text-xs leading-relaxed text-slate-400">
        The assignment table below corresponds to the latest simulated optimization run. The
        source label on each row indicates whether it came from the QUBO+QAOA path, the CP-SAT
        baseline, or the hybrid merge.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            tone={kpi.tone}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Energy per slot"
          subtitle="Total energy scheduled in each charging slot."
        >
          <BarSeriesChart
            data={slotEnergy}
            xKey="slotLabel"
            series={[{ key: 'energyKWh', name: 'Energy scheduled', color: CHART_COLORS.cyan }]}
            height={260}
            unit=" kWh"
            stacked={false}
          />
          <p className="mt-3 text-xs text-slate-500">
            Each bar is the total energy scheduled across every assignment in that slot.
          </p>
        </Card>

        <Card
          title="Assignment source mix"
          subtitle="Which solver produced each row of the schedule."
        >
          <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
            <DonutChart
              data={sourceMix}
              height={220}
              centerValue={String(scheduleAssignments.length)}
              centerLabel="assignments"
            />
            <ChartLegendList
              items={sourceMix.map((entry) => ({
                name: entry.name,
                value: String(entry.value),
                color: entry.color,
              }))}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            QAOA rows come from the simulated 14-qubit instance; CP-SAT rows are the exact
            classical baseline.
          </p>
        </Card>

        <Card
          title="Grid load at slot"
          subtitle="Mean predicted grid utilisation during each charging slot."
          className="lg:col-span-2"
        >
          <LineSeriesChart
            data={slotGridLoad}
            xKey="slotLabel"
            series={[
              {
                key: 'avgGridLoadPct',
                name: 'Mean grid load %',
                color: CHART_COLORS.amber,
              },
            ]}
            height={260}
            unit=" %"
          />
          <p className="mt-3 text-xs text-slate-500">
            Values are the mean predicted utilisation of the grid during each slot across the
            assignments placed in it.
          </p>
        </Card>
      </div>

      <Card
        title="Slot assignments"
        subtitle={`${filtered.length} of ${scheduleAssignments.length} assignments shown.`}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search vehicle or station…"
            className="w-full sm:w-64"
          />
          <SelectFilter value={zone} onChange={setZone} options={zoneOptions} label="Zone" />
          <SelectFilter
            value={source}
            onChange={setSource}
            label="Source"
            options={[
              { value: 'all', label: 'All sources' },
              { value: 'QUBO + QAOA', label: 'QUBO + QAOA' },
              { value: 'CP-SAT', label: 'CP-SAT' },
              { value: 'hybrid', label: 'hybrid' },
            ]}
          />
          <SelectFilter value={slot} onChange={setSlot} options={slotOptions} label="Slot" />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          pageSize={12}
          initialSortKey="slot"
          emptyMessage="No assignments match the current filters."
        />
      </Card>

      <Card title="Timeline" subtitle="Charge distribution across the 12 charging slots.">
        <ul className="space-y-2.5">
          {slotTimeline.map((entry) => (
            <li key={entry.slotIndex} className="flex items-center gap-3">
              <span className="w-14 shrink-0 font-mono text-xs text-slate-300">
                {entry.slotLabel}
              </span>
              <div className="min-w-0 flex-1">
                <ProgressBar value={entry.meanLoad} tone={loadTone(entry.meanLoad)} />
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-slate-400">
                {entry.count} EV{entry.count === 1 ? '' : 's'} · {formatPercent(entry.meanLoad)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Each bar shows the mean predicted grid load during the slot; the count is how many EVs
          are charged in it.
        </p>
      </Card>
    </>
  )
}
