import type { ReactNode } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'quantum'
  | 'muted'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.06] text-slate-300 ring-white/10',
  success: 'bg-emerald-400/12 text-emerald-300 ring-emerald-400/30',
  warning: 'bg-amber-400/12 text-amber-300 ring-amber-400/30',
  danger: 'bg-rose-500/12 text-rose-300 ring-rose-500/30',
  info: 'bg-sky-400/12 text-sky-300 ring-sky-400/30',
  quantum: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30',
  muted: 'bg-white/[0.03] text-slate-500 ring-white/5',
}

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 whitespace-nowrap ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted'

const DOT: Record<StatusTone, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-500',
  info: 'bg-sky-400',
  muted: 'bg-slate-500',
}

/** Small coloured dot with an optional pulse, used for live indicators. */
export function StatusDot({
  tone = 'muted',
  pulse = false,
}: {
  tone?: StatusTone
  pulse?: boolean
}) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse ? (
        <span
          className={`absolute inline-flex size-2 animate-ping rounded-full opacity-60 ${DOT[tone]}`}
        />
      ) : null}
      <span className={`relative inline-flex size-2 rounded-full ${DOT[tone]}`} />
    </span>
  )
}
