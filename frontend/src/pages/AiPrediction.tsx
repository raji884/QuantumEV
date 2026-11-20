/**
 * AI Prediction Dashboard — demand / price / solar forecast review.
 *
 * Every metric shown here is computed in `src/data/sample.ts` from the
 * generated actual-vs-predicted series via `computeRegressionMetrics()`.
 * Nothing is hard-coded, and the metrics are labelled as coming from a
 * held-out test split of the sample series.
 */

import { useState } from 'react'
import { Activity, Brain, Clock, Database, Gauge, Percent, Sun, Target, TrendingUp } from 'lucide-react'

import { ForecastChart } from '../components/charts/Charts'
import {
  Badge,
  Card,
  DataTable,
  PageHeader,
  SampleDataChip,
  StatCard,
  Tabs,
} from '../components/ui'
import type { Column } from '../components/ui'
import { forecastModelById, forecastModels } from '../data/sample'
import { formatDateTime, formatNumber, formatPercent } from '../lib/format'
import type { ForecastModel, ForecastPoint } from '../types'

const MODEL_TABS: { value: ForecastModel['id']; label: string }[] = [
  { value: 'demand', label: 'Demand' },
  { value: 'price', label: 'Price' },
  { value: 'solar', label: 'Solar' },
]

export default function AiPrediction() {
  const [activeId, setActiveId] = useState<ForecastModel['id']>('demand')
  const model = forecastModelById(activeId)
  const recentPoints = model.points.slice(-12)

  const pointColumns: Column<ForecastPoint>[] = [
    { key: 'hour', header: 'Hour', render: (row) => row.label, sortValue: (row) => row.label },
    {
      key: 'observed',
      header: 'Observed',
      align: 'right',
      render: (row) => (row.actual === null ? '—' : formatNumber(row.actual, 1)),
    },
    { key: 'predicted', header: 'Predicted', align: 'right', render: (row) => formatNumber(row.predicted, 1) },
    {
      key: 'error',
      header: 'Error',
      align: 'right',
      render: (row) => (row.actual === null ? '—' : formatNumber(row.predicted - row.actual, 1)),
    },
    {
      key: 'kind',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.actual === null ? 'warning' : 'success'}>
          {row.actual === null ? 'forecast' : 'observed'}
        </Badge>
      ),
    },
  ]

  const modelColumns: Column<ForecastModel>[] = [
    {
      key: 'model',
      header: 'Model',
      render: (row) => <span className="font-medium text-slate-200">{row.name}</span>,
      sortValue: (row) => row.name,
    },
    { key: 'unit', header: 'Target / unit', render: (row) => row.unit, sortValue: (row) => row.unit },
    { key: 'algorithm', header: 'Algorithm', render: (row) => row.info.algorithm, sortValue: (row) => row.info.algorithm },
    { key: 'mae', header: 'MAE', align: 'right', render: (row) => formatNumber(row.metrics.mae, 2), sortValue: (row) => row.metrics.mae },
    { key: 'rmse', header: 'RMSE', align: 'right', render: (row) => formatNumber(row.metrics.rmse, 2), sortValue: (row) => row.metrics.rmse },
    { key: 'r2', header: 'R²', align: 'right', render: (row) => row.metrics.r2.toFixed(3), sortValue: (row) => row.metrics.r2 },
    { key: 'mape', header: 'MAPE', align: 'right', render: (row) => formatPercent(row.metrics.mapePct, 2), sortValue: (row) => row.metrics.mapePct },
    { key: 'test', header: 'Test samples', align: 'right', render: (row) => formatNumber(row.metrics.testSamples), sortValue: (row) => row.metrics.testSamples },
  ]

  return (
    <>
      <PageHeader
        eyebrow={<SampleDataChip />}
        title="AI Prediction Dashboard"
        description="Demand, tariff and solar forecasts produced by the sample models below. Each model reports its error metrics on a held-out test split of its own series."
        actions={
          <Badge tone="quantum">
            <Brain className="size-3" />
            trained sample models
          </Badge>
        }
      />

      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4 text-xs leading-relaxed text-amber-200/90">
        <p className="font-semibold text-amber-200">How these metrics are produced</p>
        <p className="mt-1">
          Every model metric on this page is computed from the generated sample series' held-out
          test observations — no accuracy value is hard-coded. In Phase 6 the same numbers come
          from real scikit-learn / XGBoost evaluation on a held-out test split.
        </p>
      </div>

      <Tabs<ForecastModel['id']> value={activeId} onChange={setActiveId} options={MODEL_TABS} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="MAE"
          value={`${formatNumber(model.metrics.mae, 2)} ${model.unit}`}
          hint="mean absolute error"
          icon={Activity}
        />
        <StatCard
          label="RMSE"
          value={`${formatNumber(model.metrics.rmse, 2)} ${model.unit}`}
          hint="root mean squared error"
          icon={Gauge}
        />
        <StatCard
          label="R²"
          value={model.metrics.r2.toFixed(3)}
          hint="coefficient of determination"
          icon={Target}
          tone={model.metrics.r2 >= 0.85 ? 'positive' : 'warning'}
        />
        <StatCard
          label="MAPE"
          value={formatPercent(model.metrics.mapePct, 2)}
          hint="mean absolute percentage error"
          icon={Percent}
        />
        <StatCard
          label="Test samples"
          value={formatNumber(model.metrics.testSamples)}
          hint="held-out observations"
          icon={Database}
        />
        <StatCard
          label="Forecast horizon"
          value={`${model.horizonHours} h`}
          hint="next-day outlook"
          icon={Clock}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
        <Card title="Model information" subtitle={model.description}>
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Algorithm</dt>
              <dd className="text-slate-200">{model.info.algorithm}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Target / unit</dt>
              <dd className="text-slate-200">{model.unit}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Trained at</dt>
              <dd className="text-slate-200">{formatDateTime(model.info.trainedAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Training samples</dt>
              <dd className="text-slate-200">{formatNumber(model.info.trainSamples)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-[11px] text-slate-500">Features</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {model.info.features.map((feature) => (
                <Badge key={feature} tone="neutral">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Actual vs prediction" subtitle={`${model.name} · next ${model.horizonHours} hours`}>
          <ForecastChart
            rows={model.points}
            horizonHours={model.horizonHours}
            unit={model.unit}
            height={320}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            The dashed amber vertical line separates observed hours (left) from the forecast-only
            horizon (right), where the observed value is null. Metrics above are computed on{' '}
            {formatNumber(model.metrics.testSamples)} held-out test samples of this series.
          </p>
        </Card>
      </section>

      <Card title="Recent hours" subtitle="Last 12 points: observed versus predicted">
        <DataTable columns={pointColumns} rows={recentPoints} rowKey={(row) => row.label} />
      </Card>

      <Card title="Model comparison" subtitle="All three models on their own held-out test splits">
        <DataTable
          columns={modelColumns}
          rows={forecastModels}
          rowKey={(row) => row.id}
          initialSortKey="r2"
          initialSortDesc
        />
      </Card>

      <Card title="How the forecast feeds optimization" subtitle="Each model drives one term of the QUBO objective.">
        <ul className="space-y-2.5 text-xs leading-relaxed text-slate-400">
          <li className="flex gap-2">
            <Target className="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
            Demand forecast sizes the per-slot grid and charger capacity constraint.
          </li>
          <li className="flex gap-2">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
            Price forecast sets the energy-cost term (₹ per kWh at each time slot).
          </li>
          <li className="flex gap-2">
            <Sun className="mt-0.5 size-3.5 shrink-0 text-indigo-300" />
            Solar forecast drives the renewable bonus term, favouring sunnier slots.
          </li>
        </ul>
      </Card>
    </>
  )
}
