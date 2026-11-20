/**
 * Application state shared across every page.
 *
 * Phase 2 deliberately keeps this local: the "session" is a demo account picked
 * from `src/data/sample.ts` and persisted in localStorage so a refresh does not
 * log you out. Phase 3 replaces `login()`/`logout()` with real JWT calls to the
 * FastAPI backend; the context API stays the same so pages do not change.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { DEMO_PASSWORD, demoUsers, notifications as seedNotifications } from '../data/sample'
import type { AppNotification, Role, SessionUser } from '../types'

const SESSION_KEY = 'quantumev.session.user'

interface AppContextValue {
  user: SessionUser | null
  /** Demo credential check. Returns the user on success, null on failure. */
  login: (email: string, password: string) => SessionUser | null
  logout: () => void
  /** Demo-only role switch, used by the "view as" control on Settings. */
  switchDemoRole: (role: Role) => void
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
  /** Landing page of the signed-in role. */
  homePathFor: (role: Role) => string
  demoPassword: string
}

const AppContext = createContext<AppContextValue | null>(null)

export function homePathFor(role: Role): string {
  if (role === 'admin') return '/app/admin'
  if (role === 'owner') return '/app/owner'
  return '/app/grid'
}

function readStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readStoredUser)
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications)

  const login = useCallback((email: string, password: string): SessionUser | null => {
    const match = demoUsers.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!match || password !== DEMO_PASSWORD) return null
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(match))
    setUser(match)
    return match
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const switchDemoRole = useCallback((role: Role) => {
    const next = demoUsers.find((candidate) => candidate.role === role)
    if (!next) return
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      login,
      logout,
      switchDemoRole,
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      markAllRead,
      markRead,
      homePathFor,
      demoPassword: DEMO_PASSWORD,
    }),
    [user, login, logout, switchDemoRole, notifications, markAllRead, markRead],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp() must be used inside <AppProvider>')
  }
  return context
}
