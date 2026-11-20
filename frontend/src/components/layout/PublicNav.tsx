import { Link } from 'react-router-dom'

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060a15]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-base font-bold text-slate-950">
            Q
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-50">QuantumEV</span>
            <span className="block text-[10px] text-slate-500">
              EV charging &amp; grid optimization
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#features" className="transition hover:text-slate-100">
            Platform
          </a>
          <a href="#pipeline" className="transition hover:text-slate-100">
            How it works
          </a>
          <a href="#roles" className="transition hover:text-slate-100">
            Roles
          </a>
          <a href="#network" className="transition hover:text-slate-100">
            Network
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
