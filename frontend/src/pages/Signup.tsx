import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Info, Zap } from 'lucide-react'

import { Button } from '../components/ui'
import { zones } from '../data/sample'
import type { Role, ZoneId } from '../types'
import { titleCase } from '../lib/format'

const ROLES: Role[] = ['admin', 'owner', 'operator']

const ROLE_BLURB: Record<Role, string> = {
  admin: 'Full platform oversight, users, stations and optimization runs.',
  owner: 'Your vehicles, charging requests, scheduled slots and spend.',
  operator: 'Grid monitoring, station operations and forecasting.',
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<Role>('owner')
  const [zoneId, setZoneId] = useState(zones[0]!.id)
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    setError(null)
    if (name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    navigate('/login', {
      state: {
        email: email.trim(),
        notice:
          'Account registration is a Phase 2 demo — no account was created. Sign in with a demo account below.',
      },
    })
  }

  return (
    <div className="min-h-dvh bg-[#060a15] text-slate-200">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">
            Q
          </span>
          <span className="text-sm font-semibold text-slate-50">QuantumEV</span>
        </Link>

        <h1 className="mt-8 text-2xl font-semibold text-slate-50">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Choose the role you want to explore — each role gets its own dashboard.
        </p>

        <p className="mt-5 flex items-start gap-2 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3 py-2.5 text-xs leading-relaxed text-sky-200">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Registration is intentionally a local demo in Phase 2. Submitting the form
          validates your input and returns you to the sign-in page — the real
          registration endpoint arrives with the Phase 3 backend.
        </p>

        <form
          className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Full name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Rohan Iyer"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@quantumev.io"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Confirm password
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              >
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-300">
                Home zone
              </span>
              <select
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value as ZoneId)}
                className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {zone.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-[11px] leading-relaxed text-slate-500 sm:col-span-2">
              {ROLE_BLURB[role]}
            </p>
          </div>

          {error ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" className="px-4 py-2.5 text-sm">
              <Zap className="size-4" />
              Create account
              <ArrowRight className="size-3.5" />
            </Button>
            <Link
              to="/login"
              className="text-xs font-medium text-slate-400 transition hover:text-slate-200"
            >
              I already have an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
