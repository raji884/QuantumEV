import { useState } from 'react'
import {
  BatteryCharging,
  BatteryMedium,
  Car,
  PlugZap,
  Wallet,
  Zap,
} from 'lucide-react'

import { useApp } from '../context/AppContext'
import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  SelectFilter,
  StatCard,
  Toggle,
} from '../components/ui'
import type { BadgeTone, Column } from '../components/ui'
import { CHART_COLORS, LineSeriesChart } from '../components/charts/Charts'
import {
  SAMPLE_NOW,
  chargingRequests,
  reportSummary,
  scheduleAssignments,
  vehiclesForOwner,
  zoneById,
} from '../data/sample'
import {
  formatCurrency,
  formatDuration,
  formatKWh,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  titleCase,
} from '../lib/format'
import type {
  ChargingRequest,
  RequestStatus,
  ScheduleAssignment,
  VehicleStatus,
} from '../types'

/** Sample average tariff (₹/kWh) used for the "estimated next charging cost" KPI. */
const SAMPLE_AVG_TARIFF = 17.8

const VEHICLE_STATUS_TONE: Record<VehicleStatus, BadgeTone> = {
  charging: 'success',
  waiting: 'warning',
  'en-route': 'info',
  discharging: 'quantum',
  idle: 'neutral',
}

const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  pending: 'warning',
  scheduled: 'info',
  'in-progress': 'quantum',
  completed: 'success',
  rejected: 'danger',
}

const SOURCE_TONE: Record<ScheduleAssignment['source'], BadgeTone> = {
  'QUBO + QAOA': 'quantum',
  'CP-SAT': 'neutral',
  hybrid: 'info',
}

/** Battery colour band: low/medium/healthy. */
function batteryTone(pct: number): 'rose' | 'amber' | 'emerald' {
  if (pct <= 20) return 'rose'
  if (pct <= 45) return 'amber'
  return 'emerald'
}

const requestColumns: Column<ChargingRequest>[] = [
  {
    key: 'id',
    header: 'Request',
    sortValue: (row) => row.id,
    render: (row) => <span className="font-mono text-slate-300">{row.id}</span>,
  },
  { key: 'vehicle', header: 'Vehicle', render: (row) => row.vehicleLabel },
  {
    key: 'energy',
    header: 'Requested energy',
    align: 'right',
    sortValue: (row) => row.requestedEnergyKWh,
    render: (row) => formatKWh(row.requestedEnergyKWh),
  },
  {
    key: 'priority',
    header: 'Priority',
    align: 'right',
    sortValue: (row) => row.priority,
    render: (row) => formatNumber(row.priority),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (row) => row.status,
    render: (row) => (
      <Badge tone={REQUEST_STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>
    ),
  },
  { key: 'station', header: 'Assigned station', render: (row) => row.assignedStationName ?? '—' },
  { key: 'slot', header: 'Slot', render: (row) => row.assignedSlot ?? '—' },
  {
    key: 'cost',
    header: 'Est. cost',
    align: 'right',
    sortValue: (row) => row.estimatedCost ?? 0,
    render: (row) => (row.estimatedCost == null ? '—' : formatCurrency(row.estimatedCost)),
  },
  {
    key: 'requested',
    header: 'Requested',
    sortValue: (row) => row.requestedAt,
    render: (row) => formatRelativeTime(row.requestedAt, SAMPLE_NOW),
  },
]

const scheduleColumns: Column<ScheduleAssignment>[] = [
  {
    key: 'slot',
    header: 'Slot',
    sortValue: (row) => row.slotIndex,
    render: (row) => row.slotLabel,
  },
  { key: 'vehicle', header: 'Vehicle', render: (row) => row.vehicleLabel },
  { key: 'station', header: 'Station', render: (row) => row.stationName },
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
    key: 'gridLoad',
    header: 'Grid load at slot',
    sortValue: (row) => row.gridLoadAtSlotPct,
    render: (row) => (
      <div className="w-28">
        <ProgressBar
          value={row.gridLoadAtSlotPct}
          tone="indigo"
          valueLabel={formatPercent(row.gridLoadAtSlotPct)}
        />
      </div>
    ),
  },
  {
    key: 'renewable',
    header: 'Renewable share',
    align: 'right',
    sortValue: (row) => row.renewableSharePct,
    render: (row) => formatPercent(row.renewableSharePct),
  },
  {
    key: 'source',
    header: 'Source',
    render: (row) => <Badge tone={SOURCE_TONE[row.source]}>{row.source}</Badge>,
  },
]

export default function OwnerDashboard() {
  const { user } = useApp()
  const ownerId = user?.role === 'owner' ? user.id : 'usr-own-001'
  const ownerName = user?.name ?? 'Rohan Iyer'

  const [preferredWindow, setPreferredWindow] = useState('cheapest-4h')
  const [batteryTarget, setBatteryTarget] = useState(80)
  const [demandResponse, setDemandResponse] = useState(true)

  const myVehicles = vehiclesForOwner(ownerId)
  const myVehicleIds = myVehicles.map((vehicle) => vehicle.id)

  const chargingCount = myVehicles.filter((vehicle) => vehicle.status === 'charging').length
  const totalCapacityKWh = myVehicles.reduce(
    (sum, vehicle) => sum + vehicle.batteryCapacityKWh,
    0,
  )
  const avgBatteryPct =
    myVehicles.length === 0
      ? 0
      : myVehicles.reduce((sum, vehicle) => sum + vehicle.batteryPercent, 0) / myVehicles.length
  const requestedEnergyKWh = myVehicles.reduce(
    (sum, vehicle) => sum + vehicle.requestedEnergyKWh,
    0,
  )
  const estimatedCost = requestedEnergyKWh * SAMPLE_AVG_TARIFF

  const myRequests = chargingRequests.filter((row) => myVehicleIds.includes(row.vehicleId))
  const requestFallback = myRequests.length === 0
  const requestRows = requestFallback ? chargingRequests.slice(0, 6) : myRequests

  const myAssignments = scheduleAssignments.filter((row) => myVehicleIds.includes(row.vehicleId))
  const assignmentFallback = myAssignments.length === 0
  const assignmentRows = assignmentFallback ? scheduleAssignments.slice(0, 6) : myAssignments

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="EV Owner Dashboard"
        description={`Charging activity and spend for ${ownerName}. Showing ${myVehicles.length} simulated vehicles drawn from the sample fleet.`}
        actions={<Badge tone="quantum">{ownerName}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="My vehicles"
          value={formatNumber(myVehicles.length)}
          hint="registered to your account"
          icon={Car}
          tone="quantum"
        />
        <StatCard
          label="Currently charging"
          value={formatNumber(chargingCount)}
          hint="vehicles on a charger now"
          icon={Zap}
          tone="positive"
        />
        <StatCard
          label="Total battery capacity"
          value={formatKWh(totalCapacityKWh)}
          hint="sum across your fleet"
          icon={BatteryCharging}
        />
        <StatCard
          label="Average battery level"
          value={formatPercent(avgBatteryPct)}
          hint="mean state of charge"
          icon={BatteryMedium}
          tone={avgBatteryPct <= 30 ? 'warning' : 'default'}
        />
        <StatCard
          label="Energy requested today"
          value={formatKWh(requestedEnergyKWh)}
          hint="sum of pending vehicle requests"
          icon={PlugZap}
        />
        <StatCard
          label="Estimated next charging cost"
          value={formatCurrency(estimatedCost, 0)}
          hint={`estimate at ₹${SAMPLE_AVG_TARIFF.toFixed(2)}/kWh sample tariff`}
          icon={Wallet}
          tone="quantum"
        />
      </div>

      <Card
        title="My vehicles"
        subtitle={`${myVehicles.length} simulated EVs with live sample state.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {myVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-slate-100">{vehicle.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {vehicle.plate} · {vehicle.model}
                  </p>
                </div>
                <Badge tone={VEHICLE_STATUS_TONE[vehicle.status]}>
                  {titleCase(vehicle.status)}
                </Badge>
              </div>

              <div className="mt-3">
                <ProgressBar
                  value={vehicle.batteryPercent}
                  tone={batteryTone(vehicle.batteryPercent)}
                  label="Battery"
                  valueLabel={formatPercent(vehicle.batteryPercent)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Range <span className="text-slate-200">{vehicle.rangeKm} km</span>
                </span>
                <span>Updated {formatRelativeTime(vehicle.lastUpdated, SAMPLE_NOW)}</span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <Badge tone="muted">{vehicle.connector}</Badge>
                <span>{zoneById(vehicle.zoneId).name}</span>
                <span>· Priority {vehicle.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="My charging requests"
        subtitle={
          requestFallback
            ? 'No sample requests matched your vehicles — showing the first 6 platform requests instead.'
            : `${requestRows.length} request(s) linked to your vehicles.`
        }
      >
        <DataTable
          columns={requestColumns}
          rows={requestRows}
          rowKey={(row) => row.id}
          pageSize={12}
          initialSortKey="requested"
          initialSortDesc
        />
      </Card>

      <Card
        title="My scheduled slots"
        subtitle={
          assignmentFallback
            ? 'No scheduled slots matched your vehicles — showing the first 6 platform assignments instead.'
            : `${assignmentRows.length} optimised slot(s) for your vehicles.`
        }
      >
        <DataTable
          columns={scheduleColumns}
          rows={assignmentRows}
          rowKey={(row) => row.id}
          pageSize={12}
          initialSortKey="slot"
        />
      </Card>

      <Card
        title="Smart charging preferences"
        subtitle="Local interface only — these controls do not call any backend in Phase 2."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <SelectFilter
              label="Preferred window"
              value={preferredWindow}
              onChange={setPreferredWindow}
              options={[
                { value: 'cheapest-4h', label: 'Cheapest 4 hours' },
                { value: 'after-22', label: 'After 22:00' },
                { value: 'before-07', label: 'Before 07:00' },
                { value: 'max-solar', label: 'Max solar' },
              ]}
            />

            <div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Target battery level</span>
                <span className="font-medium text-slate-200">{batteryTarget}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={batteryTarget}
                onChange={(event) => setBatteryTarget(Number(event.target.value))}
                className="mt-2 w-full accent-indigo-400"
              />
            </div>
          </div>

          <div>
            <Toggle
              checked={demandResponse}
              onChange={setDemandResponse}
              label="Participate in demand response"
              description="Allow the platform to shift your flexible charging into cheap, low-carbon windows."
            />
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-500">
          Preferences are stored locally in this demo only. Phase 3 will persist them through the
          FastAPI backend.
        </p>
      </Card>

      <Card
        title="My spend"
        subtitle="Platform-wide sample cost series (not personal billing)."
      >
        <LineSeriesChart
          data={reportSummary.daily}
          xKey="date"
          series={[
            { key: 'cost', name: 'Platform daily cost (₹)', color: CHART_COLORS.amber },
          ]}
        />
        <p className="mt-3 text-xs text-slate-500">
          This is the platform-wide simulated daily cost series from the analytics report, shown
          for context. It is not a statement of your personal charging spend.
        </p>
      </Card>
    </>
  )
}
