import { useMemo, useState } from 'react'
import {
  BatteryCharging,
  Clock,
  Coins,
  Download,
  Gauge,
  Leaf,
  ListChecks,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  Button,
  Card,
  DataTable,
  PageHeader,
  ProgressBar,
  SampleDataChip,
  SelectFilter,
  StatCard,
} from '../components/ui'
import type { Column, ProgressTone } from '../components/ui'
import {
  BarSeriesChart,
  CHART_COLORS,
  LineSeriesChart,
} from '../components/charts/Charts'
import { reportSummary } from '../data/sample'
import {
  formatCurrency,
  formatDuration,
  formatKWh,
  formatNumber,
  formatPercent,
} from '../lib/format'
import type { ZoneReport } from '../types'

type ZoneRow = ZoneReport & { id: string }

function utilizationTone(pct: number): ProgressTone {
  if (pct >= 80) return 'rose'
  if (pct >= 65) return 'amber'
  return 'emerald'
}

interface Kpi {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'positive' | 'warning' | 'danger' | 'quantum'
  icon: LucideIcon
}

export default function Analytics() {
  const [period, setPeriod] = useState('14d')

  const slice = useMemo(() => {
    if (period === '7d') return reportSummary.daily.slice(-7)
    return reportSummary.daily
  }, [period])

  const zoneRows: ZoneRow[] = useMemo(
    () => reportSummary.zones.map((zone) => ({ ...zone, id: zone.zoneId })),
    [],
  )

  const kpis: Kpi[] = [
    {
      label: 'Energy delivered',
      value: formatKWh(reportSummary.energyDeliveredKWh),
      hint: reportSummary.period,
      icon: BatteryCharging,
    },
    {
      label: 'Cost saved',
      value: formatCurrency(reportSummary.costSavedAmount, 0),
      hint: 'vs un-optimized baseline',
      tone: 'positive',
      icon: TrendingDown,
    },
    {
      label: 'Baseline cost',
      value: formatCurrency(reportSummary.baselineCostAmount, 0),
      hint: 'un-optimized profile',
      icon: Wallet,
    },
    {
      label: 'Savings',
      value: formatPercent(reportSummary.savingsPct),
      hint: 'simulated comparison',
      tone: 'positive',
      icon: Leaf,
    },
    {
      label: 'CO₂ avoided',
      value: `${formatNumber(reportSummary.co2AvoidedKg)} kg`,
      hint: 'sample factor',
      icon: Leaf,
    },
    {
      label: 'Sessions completed',
      value: formatNumber(reportSummary.sessionsCompleted),
      hint: 'over the period',
      icon: ListChecks,
    },
    {
      label: 'Average cost / kWh',
      value: formatCurrency(reportSummary.avgCostPerKWh),
      hint: 'blended',
      icon: Coins,
    },
    {
      label: 'Station uptime',
      value: formatPercent(reportSummary.stationUptimePct),
      hint: 'all stations',
      icon: Gauge,
    },
    {
      label: 'Average wait',
      value: formatDuration(reportSummary.avgWaitMinutes),
      hint: 'per session',
      icon: Clock,
    },
  ]

  const columns: Column<ZoneRow>[] = [
    {
      key: 'zone',
      header: 'Zone',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-200">{row.zoneName}</p>
          <p className="text-[11px] text-slate-500">{row.label}</p>
        </div>
      ),
    },
    {
      key: 'energy',
      header: 'Energy delivered',
      align: 'right',
      sortValue: (row) => row.energyDeliveredKWh,
      render: (row) => formatKWh(row.energyDeliveredKWh),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      sortValue: (row) => row.revenue,
      render: (row) => formatCurrency(row.revenue, 0),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      align: 'right',
      sortValue: (row) => row.sessionsCompleted,
      render: (row) => formatNumber(row.sessionsCompleted),
    },
    {
      key: 'wait',
      header: 'Avg wait',
      align: 'right',
      sortValue: (row) => row.avgWaitMinutes,
      render: (row) => formatDuration(row.avgWaitMinutes),
    },
    {
      key: 'co2',
      header: 'CO₂ avoided',
      align: 'right',
      sortValue: (row) => row.co2AvoidedKg,
      render: (row) => `${formatNumber(row.co2AvoidedKg)} kg`,
    },
    {
      key: 'utilization',
      header: 'Utilisation',
      render: (row) => (
        <div className="min-w-[120px]">
          <ProgressBar
            value={row.utilizationPct}
            tone={utilizationTone(row.utilizationPct)}
            valueLabel={formatPercent(row.utilizationPct)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="Analytics and Reports"
        description={`Energy, cost and emissions reporting for ${reportSummary.period}.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled
              title="Report export arrives with the Phase 3 API"
            >
              <Download className="size-3.5" />
              Export
            </Button>
            <span className="text-[11px] text-slate-500">Export is not wired up yet.</span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SelectFilter
          value={period}
          onChange={setPeriod}
          label="Period"
          options={[
            { value: '7d', label: '7 days' },
            { value: '14d', label: '14 days' },
            { value: '30d', label: '30 days (sample capped at 14)' },
          ]}
        />
        <span className="text-xs text-slate-500">
          Aggregates come from the sample report summary; the slice below drives the trend
          charts.
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            tone={kpi.tone}
            icon={kpi.icon}
          />
        ))}
      </div>

      <Card
        title="Energy and cost trend"
        subtitle="Daily energy delivered alongside daily cost."
      >
        <LineSeriesChart
          data={slice}
          xKey="date"
          series={[
            { key: 'energyKWh', name: 'Energy (kWh)', color: CHART_COLORS.cyan },
            { key: 'cost', name: 'Cost (₹)', color: CHART_COLORS.amber },
          ]}
          height={280}
        />
        <p className="mt-3 text-xs text-slate-500">
          The two series use different units and share one axis, so this is a shape comparison,
          not a like-for-like magnitude comparison.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sessions per day" subtitle="Completed charging sessions in the slice.">
          <BarSeriesChart
            data={slice}
            xKey="date"
            series={[{ key: 'sessions', name: 'Sessions', color: CHART_COLORS.indigo }]}
            height={260}
          />
        </Card>

        <Card
          title="Sessions and grid utilisation"
          subtitle="Grid utilisation against solar share."
        >
          <LineSeriesChart
            data={slice}
            xKey="date"
            series={[
              {
                key: 'gridUtilizationPct',
                name: 'Grid utilisation %',
                color: CHART_COLORS.amber,
              },
              { key: 'solarSharePct', name: 'Solar share %', color: CHART_COLORS.emerald },
            ]}
            height={260}
            unit=" %"
          />
        </Card>
      </div>

      <Card title="Zone performance" subtitle="Per-zone energy, revenue, wait and utilisation.">
        <DataTable
          columns={columns}
          rows={zoneRows}
          rowKey={(row) => row.id}
        />
      </Card>

      <Card title="How these numbers are produced">
        <ul className="space-y-2.5 text-xs leading-relaxed text-slate-400">
          <li>
            All figures are generated from 14 days of simulated platform operation; the period
            selector only slices those sample points.
          </li>
          <li>
            The baseline is the un-optimized charging profile, so the saving percentage is a
            simulated comparison, not metered revenue.
          </li>
          <li>
            Grid utilisation and CO₂-avoided values use sample coefficients rather than measured
            grid data.
          </li>
          <li>
            Phase 4 replaces this source with PostgreSQL aggregates served by the backend.
          </li>
        </ul>
      </Card>
    </>
  )
}
