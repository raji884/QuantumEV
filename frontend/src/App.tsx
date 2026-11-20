import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { AppShell } from './components/layout/AppShell'
import { AppProvider, homePathFor, useApp } from './context/AppContext'
import type { Role } from './types'

import AiPrediction from './pages/AiPrediction'
import AdminDashboard from './pages/AdminDashboard'
import Analytics from './pages/Analytics'
import ChargingRequests from './pages/ChargingRequests'
import GridMonitoring from './pages/GridMonitoring'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import OwnerDashboard from './pages/OwnerDashboard'
import Profile from './pages/Profile'
import QuantumOptimization from './pages/QuantumOptimization'
import ScheduleResults from './pages/ScheduleResults'
import Settings from './pages/Settings'
import SignupPage from './pages/Signup'
import StationManagement from './pages/StationManagement'
import VehicleManagement from './pages/VehicleManagement'

/** Blocks a route when nobody is signed in, or when the role is not allowed. */
function Protected({ roles }: { roles?: Role[] }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}

/** Sends /app to whichever dashboard belongs to the signed-in role. */
function RoleHomeRedirect() {
  const { user } = useApp()
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}

/** Sends an already-signed-in visitor away from the public auth pages. */
function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (user) return <Navigate to={homePathFor(user.role)} replace />
  return <>{children}</>
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="grid min-h-dvh place-items-center bg-[#060a15] px-6 text-center text-slate-300">
      <div>
        <p className="font-mono text-4xl font-semibold text-indigo-300">404</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-100">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          That route does not exist in the QuantumEV dashboard.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignupPage />
            </PublicOnly>
          }
        />

        {/* Authenticated application */}
        <Route path="/app" element={<Protected />}>
          <Route element={<AppShell />}>
            <Route index element={<RoleHomeRedirect />} />
            <Route element={<Protected roles={['admin']} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
            <Route element={<Protected roles={['owner']} />}>
              <Route path="owner" element={<OwnerDashboard />} />
            </Route>
            <Route element={<Protected roles={['admin', 'owner']} />}>
              <Route path="vehicles" element={<VehicleManagement />} />
            </Route>
            <Route element={<Protected roles={['admin', 'operator']} />}>
              <Route path="stations" element={<StationManagement />} />
              <Route path="grid" element={<GridMonitoring />} />
              <Route path="ai" element={<AiPrediction />} />
              <Route path="quantum" element={<QuantumOptimization />} />
            </Route>
            <Route element={<Protected roles={['admin', 'owner', 'operator']} />}>
              <Route path="requests" element={<ChargingRequests />} />
              <Route path="schedule" element={<ScheduleResults />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppProvider>
  )
}
