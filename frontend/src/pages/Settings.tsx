import { useState } from 'react'
import { RefreshCw, Save, ShieldAlert } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  PageHeader,
  SampleDataChip,
  SelectFilter,
  Toggle,
} from '../components/ui'
import { quboSummary } from '../data/sample'
import { formatClock, formatPercent } from '../lib/format'
import type { Role, QuboPenaltyWeights } from '../types'
import { useApp } from '../context/AppContext'

const DEFAULT_NOTIFICATIONS: Record<string, boolean> = {
  gridOverload: true,
  optimizationFinished: true,
  modelRetrained: true,
  stationMaintenance: false,
  weeklySummary: false,
}

const NOTIFICATION_ROWS: { key: string; label: string; description: string }[] = [
  {
    key: 'gridOverload',
    label: 'Grid overload alerts',
    description: 'Warn me when a zone crosses its safe utilisation band.',
  },
  {
    key: 'optimizationFinished',
    label: 'Optimization run finished',
    description: 'Notify me when a QUBO/QAOA or CP-SAT run completes.',
  },
  {
    key: 'modelRetrained',
    label: 'AI model retrained',
    description: 'Notify me when a forecast model is retrained.',
  },
  {
    key: 'stationMaintenance',
    label: 'Station maintenance',
    description: 'Notify me when a station goes into maintenance.',
  },
  {
    key: 'weeklySummary',
    label: 'Weekly summary email',
    description: 'Send a weekly energy and cost digest.',
  },
]

const PENALTY_ROWS: { key: keyof QuboPenaltyWeights; label: string }[] = [
  { key: 'energyCost', label: 'Energy cost' },
  { key: 'waiting', label: 'Waiting time' },
  { key: 'gridOverload', label: 'Grid overload' },
  { key: 'stationCapacity', label: 'Station capacity' },
  { key: 'assignment', label: 'Assignment' },
  { key: 'renewableBonus', label: 'Renewable bonus' },
]

const ROLE_ROWS: { role: Role; label: string }[] = [
  { role: 'admin', label: 'Administrator' },
  { role: 'owner', label: 'EV Owner' },
  { role: 'operator', label: 'Energy Operator' },
]

export default function Settings() {
  const { user, switchDemoRole, demoPassword } = useApp()

  const [compact, setCompact] = useState(false)
  const [reduceAnimation, setReduceAnimation] = useState(false)
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(() => ({
    ...DEFAULT_NOTIFICATIONS,
  }))
  const [chargeWindow, setChargeWindow] = useState('cheapest-4h')
  const [minBattery, setMinBattery] = useState(80)
  const [maxTariff, setMaxTariff] = useState('20')
  const [splitSessions, setSplitSessions] = useState(false)
  const [weights, setWeights] = useState<QuboPenaltyWeights>(() => ({ ...quboSummary.penaltyWeights }))
  const [depth, setDepth] = useState('3')
  const [shots, setShots] = useState('4096')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const updateWeight = (key: keyof QuboPenaltyWeights, value: number) => {
    setWeights((previous) => ({ ...previous, [key]: value }) as QuboPenaltyWeights)
  }

  const resetAll = () => {
    setCompact(false)
    setReduceAnimation(false)
    setNotifSettings({ ...DEFAULT_NOTIFICATIONS })
    setChargeWindow('cheapest-4h')
    setMinBattery(80)
    setMaxTariff('20')
    setSplitSessions(false)
    setWeights({ ...quboSummary.penaltyWeights })
    setDepth('3')
    setShots('4096')
    setSavedAt(null)
  }

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Settings"
        description="Local preferences, optimization parameters and demo role switching. Nothing on this page is persisted yet."
      />

      <Card className="border-amber-400/30 bg-amber-400/[0.06]">
        <div className="flex gap-2.5 text-xs leading-relaxed text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Every control here is local UI state. Phase 3 adds PATCH /api/v1/users/me and
            platform-settings endpoints to persist them.
          </p>
        </div>
      </Card>

      <Card title="Appearance" subtitle="Display preferences for this browser session.">
        <div className="divide-y divide-white/5">
          <Toggle
            checked={compact}
            onChange={setCompact}
            label="Compact density"
            description="Tighter spacing for tables and cards. Affects this browser session only."
          />
          <Toggle
            checked={reduceAnimation}
            onChange={setReduceAnimation}
            label="Reduce chart animation"
            description="Disable chart transitions. Local to this session; nothing is saved."
          />
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Theme</p>
              <p className="mt-0.5 text-xs text-slate-500">Read-only for this build.</p>
            </div>
            <Badge tone="neutral">Dark (fixed for this build)</Badge>
          </div>
        </div>
      </Card>

      <Card title="Notifications" subtitle="Choose which alerts you would receive.">
        <div className="divide-y divide-white/5">
          {NOTIFICATION_ROWS.map((row) => (
            <Toggle
              key={row.key}
              checked={notifSettings[row.key] ?? false}
              onChange={(checked) =>
                setNotifSettings((previous) => ({ ...previous, [row.key]: checked }))
              }
              label={row.label}
              description={row.description}
            />
          ))}
        </div>
      </Card>

      <Card
        title="Charging preferences"
        subtitle="Applied to EV owners; shown for every role."
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectFilter
              value={chargeWindow}
              onChange={setChargeWindow}
              label="Preferred charging window"
              options={[
                { value: 'cheapest-4h', label: 'Cheapest 4 hours' },
                { value: 'overnight', label: '22:00 – 06:00' },
                { value: 'solar', label: 'Solar peak (10:00 – 15:00)' },
                { value: 'none', label: 'No preference' },
              ]}
            />
            <SelectFilter
              value={maxTariff}
              onChange={setMaxTariff}
              label="Maximum accepted tariff (₹/kWh)"
              options={[
                { value: '15', label: '₹15' },
                { value: '18', label: '₹18' },
                { value: '20', label: '₹20' },
                { value: '25', label: '₹25' },
                { value: 'none', label: 'No limit' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Minimum target battery level</span>
              <span className="font-mono text-slate-300">{formatPercent(minBattery)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={minBattery}
              onChange={(event) => setMinBattery(Number(event.target.value))}
              className="w-full accent-indigo-400"
            />
          </div>
          <div className="border-t border-white/5">
            <Toggle
              checked={splitSessions}
              onChange={setSplitSessions}
              label="Allow the optimizer to split my session across slots"
              description="Lets the schedule charge across multiple time slots to avoid peaks."
            />
          </div>
        </div>
      </Card>

      <Card
        title="Optimization parameters"
        subtitle="λ terms of the QUBO objective and QAOA circuit settings."
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {PENALTY_ROWS.map((row) => (
              <div key={row.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{row.label}</span>
                  <span className="font-mono text-slate-300">{weights[row.key].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.05}
                  value={weights[row.key]}
                  onChange={(event) => updateWeight(row.key, Number(event.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            These weights are the λ terms of the QUBO objective. Changing them here does not
            re-run the optimizer in Phase 2.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectFilter
              value={depth}
              onChange={setDepth}
              label="QAOA circuit depth"
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
              ]}
            />
            <SelectFilter
              value={shots}
              onChange={setShots}
              label="QAOA shots"
              options={[
                { value: '1024', label: '1024' },
                { value: '2048', label: '2048' },
                { value: '4096', label: '4096' },
              ]}
            />
          </div>
          <p className="text-xs text-slate-500">
            These are the parameters that Phase 8 will send to the Qiskit Aer backend.
          </p>
        </div>
      </Card>

      <Card title="Demo role switch" subtitle="Switching re-routes you to that role's dashboard.">
        <div className="flex flex-wrap items-center gap-3">
          {ROLE_ROWS.map((row) => {
            const active = user?.role === row.role
            return (
              <Button
                key={row.role}
                variant={active ? 'primary' : 'secondary'}
                disabled={active}
                onClick={() => switchDemoRole(row.role)}
              >
                {active ? 'Current role' : row.label}
              </Button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Demo password</span>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-slate-300">
            {demoPassword}
          </span>
          <span>
            Menu visibility is role-based, so switching roles lands you on that role&apos;s
            dashboard.
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setSavedAt(new Date())}>
            <Save className="size-3.5" />
            Save settings
          </Button>
          <Button variant="ghost" onClick={resetAll}>
            <RefreshCw className="size-3.5" />
            Reset to defaults
          </Button>
          {savedAt ? (
            <span className="text-xs text-emerald-300">
              Saved locally at {formatClock(savedAt)}
            </span>
          ) : null}
        </div>
      </Card>
    </>
  )
}
