import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Atom, Brain, Eye, EyeOff, Gauge, Lock, Mail, Zap } from 'lucide-react'

import { Button } from '../components/ui'
import { demoUsers } from '../data/sample'
import { homePathFor, useApp } from '../context/AppContext'
import { titleCase } from '../lib/format'

const HIGHLIGHTS = [
  { icon: Gauge, text: 'Live grid, solar and battery monitoring across 3 zones' },
  { icon: Brain, text: 'Held-out-test-validated demand, price and solar forecasts' },
  { icon: Atom, text: 'QUBO + QAOA scheduling benchmarked against CP-SAT' },
]

interface LocationState {
  email?: string
  notice?: string
}

export default function LoginPage() {
  const { login, demoPassword } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState

  const [email, setEmail] = useState(state.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (nextEmail = email, nextPassword = password) => {
    setError(null)
    const user = login(nextEmail, nextPassword)
    if (!user) {
      setError('Incorrect email or password. Use one of the demo accounts below.')
      return
    }
    navigate(homePathFor(user.role), { replace: true })
  }

  return (
    <div className="grid min-h-dvh bg-[#060a15] text-slate-200 lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 20% 10%, rgba(99,102,241,0.22) 0%, transparent 65%), radial-gradient(55% 45% at 80% 85%, rgba(34,211,238,0.14) 0%, transparent 70%)',
          }}
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">
            Q
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-50">QuantumEV</span>
            <span className="block text-[10px] text-slate-500">
              Intelligent EV Charging &amp; Grid Optimization
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-3xl leading-tight font-semibold text-slate-50">
            AI and quantum optimization for electric vehicle charging demand.
          </h1>
          <ul className="mt-7 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex gap-3 text-sm text-slate-400">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <item.icon className="size-3.5" />
                </span>
                <span className="leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Phase 2 · UI preview. All figures shown after sign-in are simulated sample
          data.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">
              Q
            </span>
            <span className="text-sm font-semibold text-slate-50">QuantumEV</span>
          </Link>

          <h2 className="text-xl font-semibold text-slate-50">Sign in</h2>
          <p className="mt-1 text-sm text-slate-400">
            Use a demo account to explore the dashboards.
          </p>

          {state.notice ? (
            <p className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              {state.notice}
            </p>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@quantumev.io"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Password
              </span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pr-9 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </span>
            </label>

            {error ? (
              <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" className="w-full py-2.5 text-sm">
              <Zap className="size-4" />
              Sign in
            </Button>
          </form>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold text-slate-200">Demo accounts</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Password for every demo account:{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-slate-300">
                {demoPassword}
              </code>
            </p>
            <ul className="mt-3 space-y-2">
              {demoUsers.map((account) => (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(demoPassword)
                      submit(account.email, demoPassword)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-left transition hover:border-indigo-400/40 hover:bg-indigo-500/10"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium text-slate-200">
                        {titleCase(account.role)}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-slate-500">
                        {account.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-indigo-300">
                      Use →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            No account?{' '}
            <Link to="/signup" className="font-medium text-indigo-300 hover:text-indigo-200">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
