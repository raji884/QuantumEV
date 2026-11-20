import { useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'

import { NAV_SECTIONS } from './navigation'
import { NotificationBell } from './NotificationBell'
import { Badge, StatusDot } from '../ui'
import type { BadgeTone } from '../ui'
import { useApp } from '../../context/AppContext'
import { titleCase } from '../../lib/format'
import type { Role } from '../../types'

const ROLE_TONE: Record<Role, BadgeTone> = {
  admin: 'quantum',
  owner: 'info',
  operator: 'success',
}

function useCurrentPageLabel(): string {
  const location = useLocation()
  for (const section of NAV_SECTIONS) {
    const match = section.items.find((item) => location.pathname.startsWith(item.to))
    if (match) return match.label
  }
  return 'Dashboard'
}

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout } = useApp()
  const pageLabel = useCurrentPageLabel()

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#060a15]/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="grid size-9 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:border-white/25 hover:bg-white/5 lg:hidden"
        >
          <Menu className="size-4" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{pageLabel}</p>
          <p className="hidden text-[11px] text-slate-500 sm:block">
            QuantumEV · Intelligent EV Charging &amp; Grid Optimization
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
            <StatusDot tone="success" pulse />
            Simulation live
          </span>

          <NotificationBell />

          {user ? (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-1 pr-1 pl-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-bold text-slate-950">
                {user.initials}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block max-w-[9rem] truncate text-[11px] font-medium text-slate-200">
                  {user.name}
                </span>
                <span className="block text-[10px] text-slate-500">{user.email}</span>
              </span>
              <Badge tone={ROLE_TONE[user.role]}>{titleCase(user.role)}</Badge>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-rose-300"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
