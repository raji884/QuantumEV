/**
 * Charging Station Management — admin / operator view.
 *
 * Everything on this page renders the simulated sample fleet from
 * `src/data/sample.ts`. The only interactive controls mutate local component
 * state (status overrides, view mode, selection); nothing calls a backend.
 */

import { useMemo, useState } from 'react'
import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  Gauge,
  Plug,
  PlugZap,
  Wrench,
  Zap,
} from 'lucide-react'

import { ChartLegendList, CHART_COLORS, DonutChart } from '../components/charts/Charts'
import { StationMap } from '../components/map/StationMap'
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
  Tabs,
} from '../components/ui'
import type { BadgeTone, Column, ProgressTone } from '../components/ui'
import { stations, zoneById, zones } from '../data/sample'
import { formatCurrency, formatKW, formatPercent, titleCase } from '../lib/format'
import type { Station, StationStatus } from '../types'

const STATUS_TONE: Record<StationStatus, BadgeTone> = {
  available: 'success',
  busy: 'warning',
  maintenance: 'info',
  offline: 'danger',
}

const STATUS_COLOR: Record<StationStatus, string> = {
  available: CHART_COLORS.emerald,
  busy: CHART_COLORS.amber,
  maintenance: CHART_COLORS.sky,
  offline: CHART_COLORS.rose,
}

const STATUS_ORDER: StationStatus[] = ['available', 'busy', 'maintenance', 'offline']

function progressTone(pct: number): ProgressTone {
  if (pct >= 85) return 'rose'
  if (pct >= 70) return 'amber'
  return 'emerald'
}

export default function StationManagement() {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [selectedId, setSelectedId] = useState<string>(stations[0].id)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StationStatus>>({})

  const displayStations = useMemo(
    () =>
      stations.map((station) => ({
        ...station,
        status: statusOverrides[station.id] ?? station.status,
      })),
    [statusOverrides],
  )

  const totals = useMemo(() => {
    const totalChargers = displayStations.reduce((sum, station) => sum + station.chargers, 0)
    const totalRatedPower = displayStations.reduce(
      (sum, station) => sum + station.chargers * station.powerKW,
      0,
    )
    return {
      total: displayStations.length,
      available: displayStations.filter((station) => station.status === 'available').length,
      busy: displayStations.filter((station) => station.status === 'busy').length,
      maintenance: displayStations.filter(
        (station) => station.status === 'maintenance' || station.status === 'offline',
      ).length,
      totalChargers,
      totalRatedPower,
      avgUtilisation:
        displayStations.reduce((sum, station) => sum + station.utilizationPct, 0) /
        Math.max(1, displayStations.length),
      withBattery: displayStations.filter((station) => station.hasBatteryStorage).length,
    }
  }, [displayStations])

  const statusMix = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        name: titleCase(status),
        value: displayStations.filter((station) => station.status === status).length,
        color: STATUS_COLOR[status],
      })),
    [displayStations],
  )

  const mostQueued = useMemo(
    () => [...displayStations].sort((a, b) => b.queueLength - a.queueLength).slice(0, 3),
    [displayStations],
  )

  const selected = displayStations.find((station) => station.id === selectedId) ?? null

  const applyOverride = (id: string, status: StationStatus) => {
    setStatusOverrides((previous) => ({ ...previous, [id]: status }))
  }

  const columns: Column<Station>[] = [
    {
      key: 'name',
      header: 'Station',
      render: (row) => <span className="font-medium text-slate-200">{row.name}</span>,
      sortValue: (row) => row.name,
    },
    {
      key: 'zone',
      header: 'Zone',
      render: (row) => zoneById(row.zoneId).name,
      sortValue: (row) => zoneById(row.zoneId).name,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>,
      sortValue: (row) => row.status,
    },
    { key: 'chargers', header: 'Chargers', align: 'right', render: (row) => row.chargers, sortValue: (row) => row.chargers },
    { key: 'power', header: 'Power', align: 'right', render: (row) => formatKW(row.powerKW), sortValue: (row) => row.powerKW },
    { key: 'connector', header: 'Connector', render: (row) => row.connector, sortValue: (row) => row.connector },
    { key: 'tariff', header: 'Tariff', align: 'right', render: (row) => formatCurrency(row.pricePerKWh), sortValue: (row) => row.pricePerKWh },
    { key: 'sessions', header: 'Active', align: 'right', render: (row) => row.activeSessions, sortValue: (row) => row.activeSessions },
    { key: 'queue', header: 'Queue', align: 'right', render: (row) => row.queueLength, sortValue: (row) => row.queueLength },
    {
      key: 'util',
      header: 'Utilisation',
      render: (row) => (
        <div className="w-28">
          <ProgressBar
            value={row.utilizationPct}
            tone={progressTone(row.utilizationPct)}
            valueLabel={formatPercent(row.utilizationPct)}
          />
        </div>
      ),
      sortValue: (row) => row.utilizationPct,
    },
    { key: 'solar', header: 'Solar share', align: 'right', render: (row) => formatPercent(row.solarSharePct), sortValue: (row) => row.solarSharePct },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Charging Station Management"
        description="Operate the 10 simulated charging stations spread across 3 city zones — inspect chargers, power ratings, live utilisation, queues and on-site battery storage."
        actions={<Badge tone="neutral">{stations.length} stations · {zones.length} zones</Badge>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total stations" value={String(totals.total)} hint="across 3 city zones" icon={PlugZap} />
        <StatCard label="Available" value={String(totals.available)} hint="accepting vehicles" icon={CheckCircle2} tone="positive" />
        <StatCard label="Busy" value={String(totals.busy)} hint="charging at capacity risk" icon={Activity} tone="warning" />
        <StatCard label="Maintenance / offline" value={String(totals.maintenance)} hint="not serving sessions" icon={Wrench} tone="danger" />
        <StatCard label="Total chargers" value={String(totals.totalChargers)} hint="installed across the network" icon={Plug} />
        <StatCard label="Total rated power" value={formatKW(totals.totalRatedPower)} hint="sum of chargers × kW" icon={Zap} tone="quantum" />
        <StatCard label="Average utilisation" value={formatPercent(totals.avgUtilisation)} hint="mean across all stations" icon={Gauge} />
        <StatCard label="Battery storage" value={String(totals.withBattery)} hint="stations with on-site battery" icon={BatteryCharging} tone="positive" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Network map" subtitle="Click a marker to inspect a station. Colours show live status.">
          <StationMap stations={stations} zones={zones} height={420} showZones onSelectStation={setSelectedId} />
        </Card>

        {selected ? (
          <Card title={selected.name} subtitle={selected.address}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[selected.status]}>{titleCase(selected.status)}</Badge>
                <Badge tone="neutral">{zoneById(selected.zoneId).name}</Badge>
                <Badge tone={selected.hasBatteryStorage ? 'success' : 'muted'}>
                  {selected.hasBatteryStorage ? 'Battery storage' : 'No battery'}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">Chargers</dt>
                  <dd className="text-slate-200">{selected.chargers}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rated power</dt>
                  <dd className="text-slate-200">{formatKW(selected.chargers * selected.powerKW)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Connector</dt>
                  <dd className="text-slate-200">{selected.connector}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tariff</dt>
                  <dd className="text-slate-200">{formatCurrency(selected.pricePerKWh)}/kWh</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Active sessions</dt>
                  <dd className="text-slate-200">{selected.activeSessions}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Queue length</dt>
                  <dd className="text-slate-200">{selected.queueLength}</dd>
                </div>
              </dl>

              <ProgressBar
                value={selected.utilizationPct}
                tone={progressTone(selected.utilizationPct)}
                label="Utilisation"
                valueLabel={formatPercent(selected.utilizationPct)}
              />
              <ProgressBar
                value={selected.solarSharePct}
                tone="sky"
                label="Solar share"
                valueLabel={formatPercent(selected.solarSharePct)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => applyOverride(selected.id, 'maintenance')}>
                  Set to maintenance
                </Button>
                <Button variant="secondary" onClick={() => applyOverride(selected.id, 'available')}>
                  Bring online
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">Local demo only — Phase 3 will call the API.</p>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState title="No station selected" description="Pick a marker on the map or a station tile below." />
          </Card>
        )}
      </section>

      <Card
        title="Station directory"
        subtitle={`${stations.length} simulated stations`}
        action={
          <Tabs<'cards' | 'table'>
            value={view}
            onChange={setView}
            options={[
              { value: 'cards', label: 'Cards' },
              { value: 'table', label: 'Table' },
            ]}
          />
        }
      >
        {view === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayStations.map((station) => (
              <div key={station.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{station.name}</p>
                    <p className="text-[11px] text-slate-500">{zoneById(station.zoneId).name}</p>
                  </div>
                  <Badge tone={STATUS_TONE[station.status]}>{titleCase(station.status)}</Badge>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <dt className="text-slate-500">Chargers</dt>
                    <dd className="text-slate-200">{station.chargers}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Power</dt>
                    <dd className="text-slate-200">{formatKW(station.powerKW)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Connector</dt>
                    <dd className="text-slate-200">{station.connector}</dd>
                  </div>
                </dl>

                <p className="mt-2 text-[11px] text-slate-400">
                  Tariff {formatCurrency(station.pricePerKWh)}/kWh · queue {station.queueLength}
                </p>

                <div className="mt-3 space-y-2">
                  <ProgressBar
                    value={station.utilizationPct}
                    tone={progressTone(station.utilizationPct)}
                    label="Utilisation"
                    valueLabel={formatPercent(station.utilizationPct)}
                  />
                  <ProgressBar
                    value={station.solarSharePct}
                    tone="sky"
                    label="Solar share"
                    valueLabel={formatPercent(station.solarSharePct)}
                  />
                </div>

                <Button className="mt-3 w-full" variant="secondary" onClick={() => setSelectedId(station.id)}>
                  Select
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={displayStations}
            rowKey={(row) => row.id}
            pageSize={10}
            initialSortKey="util"
            initialSortDesc
          />
        )}
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Status mix" subtitle="Station count by live status">
          <div className="grid gap-4 sm:grid-cols-2">
            <DonutChart
              data={statusMix}
              height={220}
              innerRadius={54}
              outerRadius={84}
              centerLabel="stations"
              centerValue={String(totals.total)}
            />
            <ChartLegendList
              items={statusMix.map((item) => ({
                name: item.name,
                value: String(item.value),
                color: item.color,
              }))}
            />
          </div>
        </Card>

        <Card title="Most queued stations" subtitle="Largest queues at the current snapshot">
          <ul className="space-y-3">
            {mostQueued.map((station) => (
              <li key={station.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">{station.name}</p>
                  <p className="text-[11px] text-slate-500">{zoneById(station.zoneId).name}</p>
                </div>
                <Badge tone={station.queueLength >= 5 ? 'danger' : 'warning'}>
                  {station.queueLength} queued
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  )
}
