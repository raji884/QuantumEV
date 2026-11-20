import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StatTone = 'default' | 'positive' | 'warning' | 'danger' | 'quantum'

const TONE_RING: Record<StatTone, string> = {
  default: 'border-white/10',
  positive: 'border-emerald-400/30',
  warning: 'border-amber-400/30',
  danger: 'border-rose-500/30',
  quantum: 'border-indigo-400/30',
}

const TONE_ICON: Record<StatTone, string> = {
  default: 'bg-white/5 text-slate-300',
  positive: 'bg-emerald-400/10 text-emerald-300',
  warning: 'bg-amber-400/10 text-amber-300',
  danger: 'bg-rose-500/10 text-rose-300',
  quantum: 'bg-indigo-500/15 text-indigo-300',
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
  /** Optional delta shown next to the value. Positive is not always "good". */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }
  tone?: StatTone
  icon?: LucideIcon
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  tone = 'default',
  icon: Icon,
}: StatCardProps) {
  const deltaColor =
    delta?.good === undefined
      ? 'text-slate-400'
      : delta.good
        ? 'text-emerald-300'
        : 'text-rose-300'

  return (
    <div className={`rounded-xl border bg-white/[0.03] p-4 ${TONE_RING[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </p>
        {Icon ? (
          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONE_ICON[tone]}`}>
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="truncate text-xl font-semibold text-slate-50">{value}</p>
        {delta ? (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
            {delta.direction === 'up' ? (
              <ArrowUpRight className="size-3" />
            ) : delta.direction === 'down' ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <ArrowRight className="size-3" />
            )}
            {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 truncate text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
