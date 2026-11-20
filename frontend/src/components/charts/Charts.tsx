/**
 * Recharts wrappers used by every QuantumEV dashboard.
 *
 * All charts are presentation-only: they render whatever arrays a page passes
 * in. In Phase 2 those arrays come from `src/data/sample.ts`; from Phase 3 they
 * come from the FastAPI backend — no chart needs to change.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'

export const CHART_COLORS = {
  indigo: '#6366f1',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  sky: '#38bdf8',
  violet: '#a78bfa',
  slate: '#64748b',
  teal: '#2dd4bf',
}

const TOOLTIP_PROPS = {
  contentStyle: {
    background: 'rgba(9, 14, 26, 0.96)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: 8,
    fontSize: 11,
    padding: '6px 10px',
  },
  labelStyle: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
  itemStyle: { color: '#e2e8f5', fontSize: 11 },
} as const

const AXIS_PROPS = {
  tick: { fill: '#64748b', fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const

const GRID_PROPS = {
  stroke: 'rgba(148, 163, 184, 0.12)',
  strokeDasharray: '3 3',
  vertical: false,
} as const

export interface SeriesDef {
  key: string
  name: string
  color: string
  /** Dashed stroke — used for predicted / forecast series. */
  dashed?: boolean
  stackId?: string
}

interface BaseChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  xKey: string
  height?: number
  unit?: string
}

function Frame({ height = 260, children }: { height?: number; children: ReactNode }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children as never}
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stacked / single area chart — used for grid load composition
// ---------------------------------------------------------------------------

export function AreaStackChart({
  data,
  xKey,
  series,
  height = 280,
  referenceY,
  referenceLabel,
  unit,
}: BaseChartProps & {
  series: SeriesDef[]
  referenceY?: number
  referenceLabel?: string
}) {
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          {series.map((item) => (
            <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} unit={unit} width={56} />
        <Tooltip {...TOOLTIP_PROPS} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {referenceY !== undefined ? (
          <ReferenceLine
            y={referenceY}
            stroke={CHART_COLORS.rose}
            strokeDasharray="4 4"
            label={{ value: referenceLabel ?? 'capacity', fill: CHART_COLORS.rose, fontSize: 10 }}
          />
        ) : null}
        {series.map((item) => (
          <Area
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stackId={item.stackId ?? '1'}
            stroke={item.color}
            strokeWidth={1.8}
            fill={`url(#grad-${item.key})`}
          />
        ))}
      </AreaChart>
    </Frame>
  )
}

// ---------------------------------------------------------------------------
// Multi-series line chart
// ---------------------------------------------------------------------------

export function LineSeriesChart({ data, xKey, series, height = 280, unit }: BaseChartProps & { series: SeriesDef[] }) {
  return (
    <Frame height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} unit={unit} width={56} />
        <Tooltip {...TOOLTIP_PROPS} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.name}
            stroke={item.color}
            strokeWidth={2}
            strokeDasharray={item.dashed ? '5 4' : undefined}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </Frame>
  )
}

// ---------------------------------------------------------------------------
// Bar chart (grouped or stacked)
// ---------------------------------------------------------------------------

export function BarSeriesChart({
  data,
  xKey,
  series,
  height = 280,
  unit,
  stacked = false,
}: BaseChartProps & { series: SeriesDef[]; stacked?: boolean }) {
  return (
    <Frame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} unit={unit} width={56} />
        <Tooltip {...TOOLTIP_PROPS} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.name}
            stackId={stacked ? '1' : undefined}
            fill={item.color}
            radius={stacked ? undefined : [3, 3, 0, 0]}
            maxBarSize={26}
          />
        ))}
      </BarChart>
    </Frame>
  )
}

// ---------------------------------------------------------------------------
// Forecast chart — actual vs predicted, with the future region shaded
// ---------------------------------------------------------------------------

export interface ForecastRow {
  label: string
  actual: number | null
  predicted: number
}

export function ForecastChart({
  rows,
  height = 300,
  unit,
  horizonHours,
}: {
  rows: ForecastRow[]
  height?: number
  unit?: string
  horizonHours: number
}) {
  const firstForecastIndex = rows.length - horizonHours
  const boundary = rows[firstForecastIndex - 1]?.label
  return (
    <Frame height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" {...AXIS_PROPS} interval={5} />
        <YAxis {...AXIS_PROPS} unit={unit} width={60} />
        <Tooltip {...TOOLTIP_PROPS} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {boundary ? (
          <ReferenceLine
            x={boundary}
            stroke={CHART_COLORS.amber}
            strokeDasharray="4 4"
            label={{
              value: 'forecast horizon',
              fill: CHART_COLORS.amber,
              fontSize: 10,
              position: 'insideTopRight',
            }}
          />
        ) : null}
        <Line
          type="monotone"
          dataKey="actual"
          name="Observed"
          stroke={CHART_COLORS.cyan}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Model prediction"
          stroke={CHART_COLORS.violet}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
        />
      </LineChart>
    </Frame>
  )
}

// ---------------------------------------------------------------------------
// Donut / pie
// ---------------------------------------------------------------------------

export function DonutChart({
  data,
  height = 240,
  innerRadius = 58,
  outerRadius = 88,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  centerLabel?: string
  centerValue?: string
}) {
  return (
    <div className="relative" style={{ height }}>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-lg font-semibold text-slate-50">{centerValue}</p>
            {centerLabel ? (
              <p className="text-[11px] text-slate-500">{centerLabel}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data.map((item, index) => ({ ...item, fill: item.color, index }))}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 'dataMax']} tick={false} />
          <Tooltip {...TOOLTIP_PROPS} />
          <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.08)' }} cornerRadius={4} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Simple legend list to sit next to a DonutChart. */
export function ChartLegendList({
  items,
}: {
  items: { name: string; value: string; color: string }[]
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="truncate text-slate-400">{item.name}</span>
          </span>
          <span className="shrink-0 font-medium text-slate-200">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Radial gauge — single KPI against a max
// ---------------------------------------------------------------------------

export function RadialGauge({
  value,
  max = 100,
  label,
  valueLabel,
  color = CHART_COLORS.indigo,
  height = 170,
}: {
  value: number
  max?: number
  label?: string
  valueLabel?: string
  color?: string
  height?: number
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const data = [{ name: label ?? 'value', value: pct, fill: color }]
  return (
    <div className="relative" style={{ height }}>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-lg font-semibold text-slate-50">{valueLabel ?? `${pct.toFixed(1)}%`}</p>
          {label ? <p className="text-[11px] text-slate-500">{label}</p> : null}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={225}
          endAngle={-45}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.10)' }} cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Colour band helper shared by gauges and progress bars. */
export function utilizationColor(pct: number): string {
  if (pct >= 85) return CHART_COLORS.rose
  if (pct >= 70) return CHART_COLORS.amber
  return CHART_COLORS.emerald
}

/** Re-exported so pages can build a Cell-coloured pie if they need one. */
export { Cell }
