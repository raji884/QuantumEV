import { Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Text search
// ---------------------------------------------------------------------------

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pr-7 pl-8 text-xs text-slate-200 placeholder:text-slate-500 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string
  label: string
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  className?: string
}) {
  return (
    <label className={`inline-flex items-center gap-2 text-xs text-slate-400 ${className}`}>
      {label ? <span className="whitespace-nowrap">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/10 bg-[#0b1220] px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Chips (segmented filter)
// ---------------------------------------------------------------------------

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              active
                ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200'
                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className="ml-1.5 text-slate-500">{option.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tabs (underlined)
// ---------------------------------------------------------------------------

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-white/10">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition ${
              active
                ? 'border-indigo-400 text-indigo-200'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-40 ${
          checked ? 'bg-indigo-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`inline-block size-3.5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-[20px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BUTTON: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:brightness-110 border-transparent',
  secondary: 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-white/30 hover:bg-white/10',
  ghost: 'border-transparent text-slate-300 hover:bg-white/5',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled = false,
  className = '',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  title?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${BUTTON[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
