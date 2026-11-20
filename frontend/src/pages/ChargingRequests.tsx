import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  CalendarClock,
  CheckCircle2,
  Clock,
  Wallet,
  Zap,
} from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  SampleDataChip,
  SearchInput,
  SelectFilter,
  StatCard,
  Tabs,
} from '../components/ui'
import type { BadgeTone, Column, SelectOption } from '../components/ui'
import { SAMPLE_NOW, chargingRequests, stations, zones } from '../data/sample'
import {
  formatCurrency,
  formatDuration,
  formatKWh,
  formatNumber,
  formatRelativeTime,
  titleCase,
} from '../lib/format'
import type { ChargingRequest, RequestStatus, ZoneId } from '../types'

type StatusFilter = 'all' | 'pending' | 'scheduled' | 'in-progress' | 'completed'
type ZoneFilter = 'all' | ZoneId

const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  pending: 'warning',
  scheduled: 'info',
  'in-progress': 'quantum',
  completed: 'success',
  rejected: 'danger',
}

function priorityTone(priority: number): BadgeTone {
  if (priority >= 5) return 'danger'
  if (priority === 4) return 'warning'
  return 'neutral'
}

/** Row shape used by the table — the request plus its resolved status/assignment. */
interface RequestRow {
  id: string
  vehicleLabel: string
  ownerName: string
  zoneId: ZoneId
  energyKWh: number
  priority: number
  requestedAt: string
  status: RequestStatus
  stationName: string | null
  slot: string | null
  cost: number | null
  minutes: number | null
}

/** Deterministic station + slot derivation for a locally "assigned" request. */
function derivedAssignment(request: ChargingRequest): {
  stationName: string
  slot: string
  cost: number
  minutes: number
} {
  const index = Number(request.id.replace(/\D/g, '')) || 0
  const station = stations[index % stations.length]
  const hour = 8 + (index % 12)
  const slot = `${String(hour).padStart(2, '0')}:${index % 2 === 0 ? '00' : '30'}`
  return {
    stationName: station.name,
    slot,
    cost: request.requestedEnergyKWh * station.pricePerKWh,
    minutes: Math.round((request.requestedEnergyKWh / (station.powerKW * 0.7)) * 60),
  }
}

function buildRequestRow(
  request: ChargingRequest,
  overrides: Record<string, RequestStatus>,
): RequestRow {
  const status = overrides[request.id] ?? request.status
  const base: RequestRow = {
    id: request.id,
    vehicleLabel: request.vehicleLabel,
    ownerName: request.ownerName,
    zoneId: request.zoneId,
    energyKWh: request.requestedEnergyKWh,
    priority: request.priority,
    requestedAt: request.requestedAt,
    status,
    stationName: null,
    slot: null,
    cost: null,
    minutes: null,
  }
  if (status === 'rejected') return base
  if (request.assignedStationName) {
    return {
      ...base,
      stationName: request.assignedStationName,
      slot: request.assignedSlot,
      cost: request.estimatedCost,
      minutes: request.estimatedMinutes,
    }
  }
  const derived = derivedAssignment(request)
  return {
    ...base,
    stationName: derived.stationName,
    slot: derived.slot,
    cost: derived.cost,
    minutes: derived.minutes,
  }
}

export default function ChargingRequests() {
  const [overrides, setOverrides] = useState<Record<string, RequestStatus>>({})
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')

  const rows = useMemo(
    () => chargingRequests.map((request) => buildRequestRow(request, overrides)),
    [overrides],
  )

  const counts = useMemo(() => {
    const result: Record<RequestStatus, number> = {
      pending: 0,
      scheduled: 0,
      'in-progress': 0,
      completed: 0,
      rejected: 0,
    }
    rows.forEach((row) => {
      result[row.status] += 1
    })
    return result
  }, [rows])

  const totalEnergyKWh = useMemo(
    () => chargingRequests.reduce((sum, request) => sum + request.requestedEnergyKWh, 0),
    [],
  )
  const totalCost = useMemo(
    () => rows.reduce((sum, row) => sum + (row.cost ?? 0), 0),
    [rows],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (zoneFilter !== 'all' && row.zoneId !== zoneFilter) return false
      if (needle) {
        const haystack = `${row.vehicleLabel} ${row.ownerName}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [rows, statusFilter, zoneFilter, query])

  const highPriority = useMemo(() => rows.filter((row) => row.priority === 5), [rows])

  const zoneOptions: SelectOption[] = [
    { value: 'all', label: 'All zones' },
    ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
  ]

  const tabOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `All (${rows.length})` },
    { value: 'pending', label: `Pending (${counts.pending})` },
    { value: 'scheduled', label: `Scheduled (${counts.scheduled})` },
    { value: 'in-progress', label: `In progress (${counts['in-progress']})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
  ]

  function handleAssign(id: string) {
    setOverrides((previous) => ({ ...previous, [id]: 'scheduled' }))
    setConfirmation(
      `Request ${id} assigned to a station and marked scheduled — local demo only.`,
    )
  }

  function handleReject(id: string) {
    setOverrides((previous) => ({ ...previous, [id]: 'rejected' }))
    setConfirmation(`Request ${id} marked rejected — local demo only.`)
  }

  const columns: Column<RequestRow>[] = [
    {
      key: 'request',
      header: 'Request',
      sortValue: (row) => row.id,
      render: (row) => <span className="font-mono text-slate-300">{row.id}</span>,
    },
    { key: 'vehicle', header: 'Vehicle', sortValue: (row) => row.vehicleLabel, render: (row) => row.vehicleLabel },
    { key: 'owner', header: 'Owner', sortValue: (row) => row.ownerName, render: (row) => row.ownerName },
    {
      key: 'zone',
      header: 'Zone',
      sortValue: (row) => row.zoneId,
      render: (row) => zones.find((zone) => zone.id === row.zoneId)?.name ?? row.zoneId,
    },
    {
      key: 'energy',
      header: 'Requested energy',
      align: 'right',
      sortValue: (row) => row.energyKWh,
      render: (row) => formatKWh(row.energyKWh),
    },
    {
      key: 'priority',
      header: 'Priority',
      align: 'right',
      sortValue: (row) => row.priority,
      render: (row) => (
        <Badge tone={priorityTone(row.priority)}>
          {row.priority === 5 ? 'High' : formatNumber(row.priority)}
        </Badge>
      ),
    },
    {
      key: 'requested',
      header: 'Requested',
      sortValue: (row) => row.requestedAt,
      render: (row) => formatRelativeTime(row.requestedAt, SAMPLE_NOW),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => (
        <Badge tone={REQUEST_STATUS_TONE[row.status]}>{titleCase(row.status)}</Badge>
      ),
    },
    { key: 'station', header: 'Assigned station', render: (row) => row.stationName ?? '—' },
    { key: 'slot', header: 'Slot', render: (row) => row.slot ?? '—' },
    {
      key: 'cost',
      header: 'Est. cost',
      align: 'right',
      sortValue: (row) => row.cost ?? 0,
      render: (row) => (row.cost == null ? '—' : formatCurrency(row.cost)),
    },
    {
      key: 'duration',
      header: 'Est. duration',
      align: 'right',
      sortValue: (row) => row.minutes ?? 0,
      render: (row) => (row.minutes == null ? '—' : formatDuration(row.minutes)),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            disabled={row.status !== 'pending'}
            onClick={() => handleAssign(row.id)}
            title={
              row.status === 'pending'
                ? 'Assign this request (Phase 3 will call the API)'
                : 'Only pending requests can be assigned'
            }
          >
            Assign
          </Button>
          <Button
            variant="danger"
            disabled={row.status === 'completed' || row.status === 'rejected'}
            onClick={() => handleReject(row.id)}
            title="Reject this request (Phase 3 will call the API)"
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Charging Requests"
        description="Request intake and assignment queue across all simulated vehicles, stations and zones."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pending"
          value={formatNumber(counts.pending)}
          hint="awaiting scheduling"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Scheduled"
          value={formatNumber(counts.scheduled)}
          hint="assigned to a station slot"
          icon={CalendarClock}
          tone="quantum"
        />
        <StatCard
          label="In progress"
          value={formatNumber(counts['in-progress'])}
          hint="charging right now"
          icon={Zap}
          tone="positive"
        />
        <StatCard
          label="Completed"
          value={formatNumber(counts.completed)}
          hint="finished charging"
          icon={CheckCircle2}
          tone="positive"
        />
        <StatCard
          label="Total requested energy"
          value={formatKWh(totalEnergyKWh)}
          hint="across all requests"
          icon={BatteryCharging}
        />
        <StatCard
          label="Total estimated cost"
          value={formatCurrency(totalCost, 0)}
          hint="sum of resolved request estimates"
          icon={Wallet}
        />
      </div>

      <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs leading-relaxed text-amber-200/90">
        Status changes on this page are local to the browser in Phase 2. Phase 3 will persist them
        through the FastAPI backend.
      </p>

      <Card title="Request queue" subtitle={`${filtered.length} of ${rows.length} requests`}>
        <div className="flex flex-col gap-3">
          <Tabs value={statusFilter} onChange={setStatusFilter} options={tabOptions} />
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search vehicle or owner…"
              className="w-full sm:w-64"
            />
            <SelectFilter
              label="Zone"
              value={zoneFilter}
              onChange={(value) => setZoneFilter(value as ZoneFilter)}
              options={zoneOptions}
            />
          </div>

          {confirmation ? (
            <p className="text-xs text-emerald-300">{confirmation}</p>
          ) : null}

          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            pageSize={12}
            initialSortKey="priority"
            initialSortDesc
          />
        </div>
      </Card>

      <Card
        title="High-priority queue"
        subtitle="Requests flagged priority 5 — the most urgent to schedule."
      >
        {highPriority.length === 0 ? (
          <EmptyState
            title="No high-priority requests"
            description="No request in the current sample set is flagged priority 5."
          />
        ) : (
          <ul className="divide-y divide-white/5">
            {highPriority.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-200">{row.id}</p>
                  <p className="text-[11px] text-slate-500">
                    {row.vehicleLabel} · {row.ownerName} · {formatKWh(row.energyKWh)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={REQUEST_STATUS_TONE[row.status]}>
                    {titleCase(row.status)}
                  </Badge>
                  <span className="text-[11px] text-slate-500">
                    {row.stationName ?? '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
