import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'

import { Badge, StatusDot } from '../ui'
import type { BadgeTone } from '../ui'
import { useApp } from '../../context/AppContext'
import { formatRelativeTime } from '../../lib/format'
import type { NotificationSeverity } from '../../types'

const SEVERITY_TONE: Record<NotificationSeverity, BadgeTone> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
}

const SEVERITY_DOT = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
} as const

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useApp()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Notifications"
        className="relative grid size-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-white/25 hover:bg-white/5"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0b1220] shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
            <p className="text-xs font-semibold text-slate-100">
              Notifications{' '}
              {unreadCount > 0 ? (
                <span className="text-slate-500">· {unreadCount} unread</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto">
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  className={`w-full px-3 py-2.5 text-left transition hover:bg-white/[0.04] ${
                    item.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5">
                      <StatusDot tone={SEVERITY_DOT[item.severity]} pulse={!item.read} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-slate-100">
                          {item.title}
                        </span>
                        <Badge tone={SEVERITY_TONE[item.severity]}>{item.category}</Badge>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">
                        {item.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
