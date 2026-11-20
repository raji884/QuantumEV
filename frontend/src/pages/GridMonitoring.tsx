/**
 * Smart Grid Monitoring — the energy operator's primary screen.
 *
 * Renders the simulated 24-hour grid series, the current snapshot and the
 * per-zone telemetry. All numbers are sample data from `src/data/sample.ts`.
 */

import { Activity, BatteryCharging, Car, Gauge, PlugZap, Sun, Waves, Zap } from 'lucide-react'

import {
  AreaStackChart,
  BarSeriesChart,
  CHART_COLORS,
  LineSeriesChart,
  RadialGauge,
  utilizationColor,
} from '../components/charts/Charts'
import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column, ProgressTone } from '../components/ui'
import { gridSeries, gridSnapshot, stations, zoneById, zoneLoads } from '../data/sample'
import {
  formatCurrency,
  formatDateTime,
  formatKW,
  formatKWh,
  formatPercent,
  titleCase,
} from '../lib/format'
import type { Station, StationStatus, ZoneLoad } from '../types'

const STATUS_TONE: Record<StationStatus, BadgeTone> = {
  available: 'success',
  busy: 'warning',
  maintenance: 'info',
  offline: 'danger',
}

function progressTone(pct: number): ProgressTone {
  if (pct >= 85) return 'rose'
  if (pct >= 70) return 'amber'
  return 'emerald'
}

export default function GridMonitoring() {
  const zoneRows: (ZoneLoad & { id: string })[] = zoneLoads.map((zone) => ({ ...zone, id: zone.zoneId }))
  const stationRows = [...stations].sort((a, b) => b.utilizationPct - a.utilizationPct)

  const zoneColumns: Column<ZoneLoad & { id: string }>[] = [
    {
      key: 'zone',
      header: 'Zone',
      render: (row) => <span className="font-medium text-slate-200">{row.zoneName}</span>,
      sortValue: (row) => row.zoneName,
    },
    { key: 'load', header: 'Load', align: 'right', render: (row) => formatKW(row.loadKW), sortValue: (row) => row.loadKW },
    { key: 'capacity', header: 'Capacity', align: 'right', render: (row) => formatKW(row.capacityKW), sortValue: (row) => row.capacityKW },
    {
      key: 'util',
      header: 'Utilisation',
      render: (row) => (
        <div className="w-32">
          <ProgressBar
            value={row.utilizationPct}
            tone={progressTone(row.utilizationPct)}
            valueLabel={formatPercent(row.utilizationPct)}
          />
        </div>
      ),
      sortValue: (row) => row.utilizationPct,
    },
    { key: 'evs', header: 'EVs', align: 'right', render: (row) => row.evCount, sortValue: (row) => row.evCount },
    { key: 'sessions', header: 'Active sessions', align: 'right', render: (row) => row.activeSessions, sortValue: (row) => row.activeSessions },
    { key: 'solar', header: 'Solar', align: 'right', render: (row) => formatKW(row.solarKW), sortValue: (row) => row.solarKW },
  ]

  const stationColumns: Column<Station>[] = [
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
    { key: 'sessions', header: 'Active', align: 'right', render: (row) => row.activeSessions, sortValue: (row) => row.activeSessions },
    {
      key: 'util',
      header: 'Utilisation',
      render: (row) => (
        <div className="w-32">
          <ProgressBar
            value={row.utilizationPct}
            tone={progressTone(row.utilizationPct)}
            valueLabel={formatPercent(row.utilizationPct)}
          />
        </div>
      ),
      sortValue: (row) => row.utilizationPct,
    },
    { key: 'queue', header: 'Queue', align: 'right', render: (row) => row.queueLength, sortValue: (row) => row.queueLength },
    { key: 'solar', header: 'Solar share', align: 'right', render: (row) => formatPercent(row.solarSharePct), sortValue: (row) => row.solarSharePct },
    { key: 'tariff', header: 'Tariff', align: 'right', render: (row) => formatCurrency(row.pricePerKWh), sortValue: (row) => row.pricePerKWh },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Smart Grid Monitoring"
        description={`Live load, solar, battery and zone telemetry from the simulation snapshot taken at ${formatDateTime(
          gridSnapshot.timestamp,
        )}.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total grid load" value={formatKW(gridSnapshot.totalLoadKW)} hint="base + EV − solar" icon={Zap} />
        <StatCard label="Grid capacity" value={formatKW(gridSnapshot.gridCapacityKW)} hint="3 zones combined" icon={Gauge} />
        <StatCard label="EV charging load" value={formatKW(gridSnapshot.evLoadKW)} hint="across all stations" icon={Car} tone="quantum" />
        <StatCard label="Base load" value={formatKW(gridSnapshot.baseLoadKW)} hint="non-EV demand" icon={Activity} />
        <StatCard label="Solar generation" value={formatKW(gridSnapshot.solarGenerationKW)} hint="depot + rooftop" icon={Sun} tone="warning" />
        <StatCard
          label="Battery state of charge"
          value={formatPercent(gridSnapshot.batterySOCPct)}
          hint={`${formatKWh(gridSnapshot.batteryStorageKWh)} of ${formatKWh(gridSnapshot.batteryCapacityKWh)}`}
          icon={BatteryCharging}
          tone="positive"
        />
        <StatCard label="Grid frequency" value={`${gridSnapshot.frequencyHz} Hz`} hint="nominal 50 Hz" icon={Waves} />
        <StatCard label="Bus voltage" value={`${gridSnapshot.voltageV} V`} hint="nominal 415 V" icon={PlugZap} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
        <Card title="Grid utilisation" subtitle="Current snapshot vs total capacity">
          <RadialGauge
            value={gridSnapshot.utilizationPct}
            max={100}
            label="Grid utilisation"
            valueLabel={formatPercent(gridSnapshot.utilizationPct)}
            color={utilizationColor(gridSnapshot.utilizationPct)}
            height={180}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Warning thresholds: ≥85% is critical (rose), ≥70% is elevated (amber); below that the
            grid is comfortable (emerald).
          </p>
        </Card>

        <Card
          title="24-hour load profile"
          subtitle="Base load and EV load against the combined capacity"
          action={<Badge tone="warning">now 14:00</Badge>}
        >
          <AreaStackChart
            data={gridSeries}
            xKey="hour"
            series={[
              { key: 'baseLoadKW', name: 'Base load', color: CHART_COLORS.slate },
              { key: 'evLoadKW', name: 'EV load', color: CHART_COLORS.indigo },
            ]}
            height={260}
            referenceY={gridSeries[0].capacityKW}
            referenceLabel="Capacity"
            unit=" kW"
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Simulated 24-hour load curve. The dashed red line marks the combined grid capacity; EV
            charging stacks on top of base demand.
          </p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Solar generation (kW)" subtitle="Depot and rooftop output through the day">
          <LineSeriesChart
            data={gridSeries}
            xKey="hour"
            series={[{ key: 'solarKW', name: 'Solar', color: CHART_COLORS.amber }]}
            height={240}
            unit=" kW"
          />
        </Card>
        <Card title="Tariff (₹/kWh)" subtitle="Time-of-day price used by the optimizer">
          <LineSeriesChart
            data={gridSeries}
            xKey="hour"
            series={[{ key: 'pricePerKWh', name: 'Tariff', color: CHART_COLORS.violet }]}
            height={240}
            unit=" ₹"
          />
        </Card>
      </section>

      <Card title="Zone load distribution" subtitle="Current load against each zone's grid capacity">
        <BarSeriesChart
          data={zoneLoads}
          xKey="zoneName"
          series={[
            { key: 'loadKW', name: 'Load', color: CHART_COLORS.cyan },
            { key: 'capacityKW', name: 'Capacity', color: CHART_COLORS.slate },
          ]}
          unit=" kW"
          stacked={false}
          height={260}
        />
        <p className="mt-2 text-[11px] text-slate-500">
          Sample snapshot — each zone load is a fixed share of the total simulated grid load.
        </p>
      </Card>

      <Card title="Zone detail" subtitle="Load, capacity and renewable share per zone">
        <DataTable columns={zoneColumns} rows={zoneRows} rowKey={(row) => row.id} />
      </Card>

      <Card title="Station load" subtitle="Stations sorted by utilisation (highest first)">
        <DataTable
          columns={stationColumns}
          rows={stationRows}
          rowKey={(row) => row.id}
          pageSize={10}
          initialSortKey="util"
          initialSortDesc
        />
      </Card>
    </>
  )
}
