import type { ReactNode } from 'react'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** Standard dark panel used across every QuantumEV page. */
export function Card({
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children,
}: CardProps) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-white/[0.03] shadow-sm backdrop-blur-sm ${className}`}
    >
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-100">{title}</h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
