import type { ReactNode } from 'react'

export type ProgressTone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'

const FILL: Record<ProgressTone, string> = {
  indigo: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-500',
  sky: 'bg-sky-400',
}

interface ProgressBarProps {
  /** 0–100. Values are clamped. */
  value: number
  tone?: ProgressTone
  label?: ReactNode
  valueLabel?: ReactNode
  height?: 'sm' | 'md'
}

export function ProgressBar({
  value,
  tone = 'indigo',
  label,
  valueLabel,
  height = 'sm',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="w-full">
      {label || valueLabel ? (
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-slate-400">{label}</span>
          <span className="shrink-0 font-medium text-slate-300">
            {valueLabel ?? `${pct.toFixed(1)}%`}
          </span>
        </div>
      ) : null}
      <div
        className={`w-full overflow-hidden rounded-full bg-white/[0.07] ${
          height === 'md' ? 'h-2.5' : 'h-1.5'
        }`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all ${FILL[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
