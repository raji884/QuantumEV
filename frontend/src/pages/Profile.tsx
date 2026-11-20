import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BatteryCharging,
  Car,
  Gauge,
  LogOut,
  Mail,
  MapPin,
  PlugZap,
} from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  SelectFilter,
  StatCard,
} from '../components/ui'
import type { BadgeTone, Column } from '../components/ui'
import { platformKpis, vehiclesForOwner, zoneById, zones } from '../data/sample'
import {
  formatClock,
  formatKWh,
  formatPercent,
  formatRelativeTime,
  initialsOf,
  titleCase,
} from '../lib/format'
import type { Role, Vehicle, VehicleStatus } from '../types'
import { useApp } from '../context/AppContext'

const INPUT_CLASS =
  'w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none'

const ROLE_ROWS: { role: Role; label: string }[] = [
  { role: 'admin', label: 'Administrator' },
  { role: 'owner', label: 'EV Owner' },
  { role: 'operator', label: 'Energy Operator' },
]

function vehicleStatusTone(status: VehicleStatus): BadgeTone {
  if (status === 'charging') return 'info'
  if (status === 'waiting') return 'warning'
  if (status === 'discharging') return 'quantum'
  if (status === 'en-route') return 'success'
  return 'neutral'
}

function categoryTone(category: string): BadgeTone {
  if (category === 'grid') return 'info'
  if (category === 'charging') return 'success'
  if (category === 'optimization') return 'quantum'
  if (category === 'ai') return 'warning'
  return 'neutral'
}

export default function Profile() {
  const { user, logout, notifications } = useApp()
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [homeZone, setHomeZone] = useState(user?.zoneId ?? '')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  if (!user) {
    return <EmptyState title="Not signed in" description="Sign in to view your profile." />
  }

  const ownedVehicles = user.role === 'owner' ? vehiclesForOwner(user.id) : []
  const fleet =
    user.role === 'owner' && ownedVehicles.length === 0
      ? vehiclesForOwner('usr-own-001')
      : ownedVehicles

  const chargingCount = fleet.filter((vehicle) => vehicle.status === 'charging').length
  const avgBattery =
    fleet.length === 0
      ? 0
      : fleet.reduce((sum, vehicle) => sum + vehicle.batteryPercent, 0) / fleet.length
  const totalCapacity = fleet.reduce((sum, vehicle) => sum + vehicle.batteryCapacityKWh, 0)

  const recentActivity = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const zoneOptions = [
    { value: '', label: 'No zone (platform-wide)' },
    ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
  ]

  const columns: Column<Vehicle>[] = [
    {
      key: 'label',
      header: 'Vehicle',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200">{row.label}</p>
          <p className="font-mono text-[11px] text-slate-500">{row.plate}</p>
        </div>
      ),
    },
    { key: 'model', header: 'Model', render: (row) => row.model },
    {
      key: 'battery',
      header: 'Battery',
      render: (row) => (
        <div className="min-w-[120px]">
          <ProgressBar
            value={row.batteryPercent}
            tone="indigo"
            valueLabel={formatPercent(row.batteryPercent)}
          />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={vehicleStatusTone(row.status)}>{titleCase(row.status)}</Badge>
      ),
    },
    { key: 'zone', header: 'Zone', render: (row) => zoneById(row.zoneId).name },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="User Profile"
        description="Signed-in account details, activity and (for EV owners) fleet summary."
      />

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xl font-semibold text-slate-950">
            {user.initials || initialsOf(user.name)}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-50">{user.name}</h2>
              <Badge tone="quantum">{titleCase(user.role)}</Badge>
              <Badge tone="warning">Demo session</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {user.zoneId ? zoneById(user.zoneId).name : 'All zones (platform-wide)'}
              </span>
              <span className="font-mono text-slate-500">id: {user.id}</span>
            </div>
            <p className="text-xs text-slate-500">
              Phase 2 sessions are local; Phase 3 replaces this with a JWT-backed account.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Editable details" subtitle="Local form state — nothing is persisted.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-slate-400">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-slate-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-slate-400">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 …"
              className={INPUT_CLASS}
            />
          </label>
          <div className="space-y-1.5">
            <span className="block text-xs text-slate-400">Home zone</span>
            <SelectFilter value={homeZone} onChange={setHomeZone} options={zoneOptions} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setSavedAt(new Date())
            }}
          >
            Save changes
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setFullName(user.name)
              setEmail(user.email)
              setPhone('')
              setHomeZone(user.zoneId ?? '')
              setSavedAt(null)
            }}
          >
            Reset
          </Button>
          {savedAt ? (
            <span className="text-xs text-emerald-300">
              Saved locally at {formatClock(savedAt)} — nothing was sent to a server.
            </span>
          ) : null}
        </div>
      </Card>

      <Card title="Role" subtitle="Your access level on the platform.">
        <ul className="divide-y divide-white/5">
          {ROLE_ROWS.map((entry) => (
            <li key={entry.role} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-slate-300">{entry.label}</span>
              {user.role === entry.role ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Badge tone="muted">Inactive</Badge>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          <Link to="/app/settings" className="text-indigo-300 hover:text-indigo-200">
            Change role in Settings (demo)
          </Link>
        </p>
      </Card>

      <Card
        title="Fleet summary"
        subtitle={
          user.role === 'owner'
            ? 'Your registered vehicles.'
            : 'Platform overview (this role has no personal fleet).'
        }
      >
        {user.role === 'owner' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Vehicles" value={String(fleet.length)} hint="in your fleet" icon={Car} />
              <StatCard
                label="Charging now"
                value={String(chargingCount)}
                hint="active sessions"
                tone="positive"
                icon={BatteryCharging}
              />
              <StatCard
                label="Average battery"
                value={formatPercent(avgBattery)}
                hint="state of charge"
                icon={Gauge}
              />
              <StatCard
                label="Total capacity"
                value={formatKWh(totalCapacity)}
                hint="pack capacity"
                icon={PlugZap}
              />
            </div>
            <div className="mt-4">
              <DataTable columns={columns} rows={fleet} rowKey={(row) => row.id} pageSize={8} />
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-xs text-slate-500">
              The platform summary is shown because this role has no personal fleet.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total EVs"
                value={String(platformKpis.totalEVs)}
                hint="simulated"
                icon={Car}
              />
              <StatCard
                label="Active sessions"
                value={String(platformKpis.activeSessions)}
                hint="across all stations"
                icon={BatteryCharging}
              />
              <StatCard
                label="Stations"
                value={`${platformKpis.availableStations}/${platformKpis.totalStations}`}
                hint="available / total"
                icon={PlugZap}
              />
              <StatCard
                label="Grid utilisation"
                value={formatPercent(platformKpis.gridUtilizationPct)}
                hint="current snapshot"
                icon={Gauge}
              />
            </div>
          </>
        )}
      </Card>

      <Card title="Recent activity" subtitle="The six most recent notifications.">
        <ul className="divide-y divide-white/5">
          {recentActivity.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.message}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={categoryTone(item.category)}>{titleCase(item.category)}</Badge>
                <span className="text-[11px] text-slate-500">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Session">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="danger" onClick={logout}>
            <LogOut className="size-3.5" />
            Sign out
          </Button>
          <span className="text-xs text-slate-500">
            Ends the local demo session; no server call is made.
          </span>
        </div>
      </Card>
    </>
  )
}
