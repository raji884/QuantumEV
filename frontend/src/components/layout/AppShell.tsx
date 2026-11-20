import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useApp } from '../../context/AppContext'

/**
 * Authenticated application frame: fixed sidebar, sticky top bar and the page
 * outlet. Rendered for every /app/* route.
 */
export function AppShell() {
  const { user } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  if (!user) return null

  return (
    <div className="min-h-dvh bg-[#060a15] text-slate-200">
      <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-white/10 px-4 py-4 text-[11px] text-slate-500 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2">
            <span>
              Simulation target: 100 EVs · 10 charging stations · 3 city zones. All
              platform data is <strong className="text-slate-400">simulated</strong>.
            </span>
            <span className="font-mono">QuantumEV · Phase 2 UI</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
