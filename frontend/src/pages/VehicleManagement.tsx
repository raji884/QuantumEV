import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  BatteryMedium,
  Car,
  Clock,
  Navigation,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  FilterChips,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  SearchInput,
  SelectFilter,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column, SelectOption } from '../components/ui'
import { SAMPLE_NOW, stationById, vehicles, zones } from '../data/sample'
import {
  formatKWh,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  titleCase,
} from '../lib/format'
import type { ConnectorType, Vehicle, VehicleStatus, ZoneId } from '../types'

type StatusFilter = 'all' | VehicleStatus
type ZoneFilter = 'all' | ZoneId
type ConnectorFilter = 'all' | ConnectorType

const VEHICLE_STATUSES: VehicleStatus[] = [
  'charging',
  'waiting',
  'en-route',
  'idle',
  'discharging',
]

const CONNECTORS: ConnectorType[] = ['CCS2', 'Type2', 'CHAdeMO']

const STATUS_TONE: Record<VehicleStatus, BadgeTone> = {
  charging: 'success',
  waiting: 'warning',
  'en-route': 'info',
  discharging: 'quantum',
  idle: 'neutral',
}

const CONNECTOR_TONE: Record<ConnectorType, BadgeTone> = {
  CCS2: 'info',
  Type2: 'neutral',
  CHAdeMO: 'muted',
}

function batteryTone(pct: number): 'rose' | 'amber' | 'emerald' {
  if (pct <= 20) return 'rose'
  if (pct <= 45) return 'amber'
  return 'emerald'
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-xs last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{children}</span>
    </div>
  )
}

export default function VehicleManagement() {
  const [query, setQuery] = useState('')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const [connectorFilter, setConnectorFilter] = useState<ConnectorFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const statusCounts = useMemo(() => {
    const counts: Record<VehicleStatus, number> = {
      idle: 0,
      charging: 0,
      waiting: 0,
      'en-route': 0,
      discharging: 0,
    }
    vehicles.forEach((vehicle) => {
      counts[vehicle.status] += 1
    })
    return counts
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      if (zoneFilter !== 'all' && vehicle.zoneId !== zoneFilter) return false
      if (connectorFilter !== 'all' && vehicle.connector !== connectorFilter) return false
      if (statusFilter !== 'all' && vehicle.status !== statusFilter) return false
      if (needle) {
        const haystack = `${vehicle.label} ${vehicle.plate} ${vehicle.ownerName} ${vehicle.model}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [query, zoneFilter, connectorFilter, statusFilter])

  const selected = useMemo(
    () => (selectedId ? vehicles.find((vehicle) => vehicle.id === selectedId) ?? null : null),
    [selectedId],
  )

  const zoneOptions: SelectOption[] = [
    { value: 'all', label: 'All zones' },
    ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
  ]

  const connectorOptions: SelectOption[] = [
    { value: 'all', label: 'All connectors' },
    ...CONNECTORS.map((connector) => ({ value: connector, label: connector })),
  ]

  const statusChipOptions: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: vehicles.length },
    ...VEHICLE_STATUSES.map((status) => ({
      value: status as StatusFilter,
      label: titleCase(status),
      count: statusCounts[status],
    })),
  ]

  const columns = useMemo<Column<Vehicle>[]>(
    () => [
      {
        key: 'vehicle',
        header: 'Vehicle',
        sortValue: (row) => row.label,
        render: (row) => (
          <div className="min-w-0">
            <p className="font-mono text-slate-200">{row.label}</p>
            <p className="text-[11px] text-slate-500">{row.plate}</p>
          </div>
        ),
      },
      { key: 'owner', header: 'Owner', sortValue: (row) => row.ownerName, render: (row) => row.ownerName },
      { key: 'model', header: 'Model', sortValue: (row) => row.model, render: (row) => row.model },
      {
        key: 'zone',
        header: 'Zone',
        sortValue: (row) => row.zoneId,
        render: (row) => zones.find((zone) => zone.id === row.zoneId)?.name ?? row.zoneId,
      },
      {
        key: 'connector',
        header: 'Connector',
        render: (row) => <Badge tone={CONNECTOR_TONE[row.connector]}>{row.connector}</Badge>,
      },
      {
        key: 'battery',
        header: 'Battery',
        sortValue: (row) => row.batteryPercent,
        render: (row) => (
          <div className="w-28">
            <ProgressBar
              value={row.batteryPercent}
              tone={batteryTone(row.batteryPercent)}
              valueLabel={formatPercent(row.batteryPercent)}
            />
          </div>
        ),
      },
      {
        key: 'range',
        header: 'Range',
        align: 'right',
        sortValue: (row) => row.rangeKm,
        render: (row) => `${row.rangeKm} km`,
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (row) => row.status,
        render: (row) => <Badge tone={STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>,
      },
      {
        key: 'priority',
        header: 'Priority',
        align: 'right',
        sortValue: (row) => row.priority,
        render: (row) => formatNumber(row.priority),
      },
      {
        key: 'station',
        header: 'Station',
        render: (row) => stationById(row.currentStationId ?? '')?.name ?? '—',
      },
      {
        key: 'updated',
        header: 'Updated',
        sortValue: (row) => row.lastUpdated,
        render: (row) => formatRelativeTime(row.lastUpdated, SAMPLE_NOW),
      },
      {
        key: 'view',
        header: 'View',
        align: 'right',
        render: (row) => (
          <Button variant="ghost" onClick={() => setSelectedId(row.id)}>
            View
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Vehicle Management"
        description="Registry of all 100 simulated electric vehicles, their connectors, battery state, zone and assigned station. All fields are generated sample data."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total vehicles"
          value={formatNumber(vehicles.length)}
          hint="full simulated fleet"
          icon={Car}
          tone="quantum"
        />
        <StatCard
          label="Charging"
          value={formatNumber(statusCounts.charging)}
          hint="on a charger now"
          icon={Zap}
          tone="positive"
        />
        <StatCard
          label="Waiting"
          value={formatNumber(statusCounts.waiting)}
          hint="queued at a station"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="En-route"
          value={formatNumber(statusCounts['en-route'])}
          hint="driving to a charger"
          icon={Navigation}
        />
        <StatCard
          label="Idle"
          value={formatNumber(statusCounts.idle)}
          hint="not plugged in"
          icon={BatteryMedium}
        />
        <StatCard
          label="Discharging"
          value={formatNumber(statusCounts.discharging)}
          hint="vehicle-to-grid (sample)"
          icon={BatteryCharging}
          tone="quantum"
        />
      </div>

      <Card title="Filters" subtitle="Search and narrow the fleet registry.">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search label, plate, owner or model…"
              className="w-full sm:w-64"
            />
            <SelectFilter
              label="Zone"
              value={zoneFilter}
              onChange={(value) => setZoneFilter(value as ZoneFilter)}
              options={zoneOptions}
            />
            <SelectFilter
              label="Connector"
              value={connectorFilter}
              onChange={(value) => setConnectorFilter(value as ConnectorFilter)}
              options={connectorOptions}
            />
          </div>
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusChipOptions}
          />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card title="Vehicle registry" subtitle={`${filtered.length} of ${vehicles.length} vehicles`}>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(row) => row.id}
              pageSize={12}
              initialSortKey="label"
            />
          </Card>
        </div>

        <div>
          {selected ? (
            <Card
              title="Vehicle detail"
              subtitle={selected.label}
              action={
                <Button variant="ghost" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
              }
            >
              <div className="space-y-0.5">
                <DetailRow label="Label">{selected.label}</DetailRow>
                <DetailRow label="Plate">{selected.plate}</DetailRow>
                <DetailRow label="Owner">{selected.ownerName}</DetailRow>
                <DetailRow label="Model">{selected.model}</DetailRow>
                <DetailRow label="Capacity">{formatKWh(selected.batteryCapacityKWh)}</DetailRow>
                <DetailRow label="Current battery">
                  {formatPercent(selected.batteryPercent)}
                </DetailRow>
                <DetailRow label="Range">{`${selected.rangeKm} km`}</DetailRow>
                <DetailRow label="Connector">
                  <Badge tone={CONNECTOR_TONE[selected.connector]}>{selected.connector}</Badge>
                </DetailRow>
                <DetailRow label="Zone">
                  {zones.find((zone) => zone.id === selected.zoneId)?.name ?? selected.zoneId}
                </DetailRow>
                <DetailRow label="Status">
                  <Badge tone={STATUS_TONE[selected.status]}>{titleCase(selected.status)}</Badge>
                </DetailRow>
                <DetailRow label="Current station">
                  {stationById(selected.currentStationId ?? '')?.name ?? '—'}
                </DetailRow>
                <DetailRow label="Requested energy">
                  {formatKWh(selected.requestedEnergyKWh)}
                </DetailRow>
                <DetailRow label="Priority">{formatNumber(selected.priority)}</DetailRow>
                <DetailRow label="Last updated">
                  {formatRelativeTime(selected.lastUpdated, SAMPLE_NOW)}
                </DetailRow>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={selected.batteryPercent}
                  tone={batteryTone(selected.batteryPercent)}
                  label="Charging progress"
                  valueLabel={formatPercent(selected.batteryPercent)}
                  height="md"
                />
              </div>
            </Card>
          ) : (
            <Card title="Vehicle detail">
              <EmptyState
                title="No vehicle selected"
                description="Choose a vehicle from the registry to see its full simulated profile."
              />
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
