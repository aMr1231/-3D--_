import type { ReactNode } from 'react'
import { Delta } from '@/components/ui/Delta'
import { Sparkline } from '@/components/ui/Sparkline'
import type { HistoryDay } from '@/data/demo/history'
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRub,
  formatRubCompact,
  plural,
} from '@/domain/format'
import { compareMetric, type MetricKey } from '@/domain/metrics'
import type { SimulationResult } from '@/domain/types'

interface KpiStripProps {
  result: SimulationResult
  /** История за выбранный период (последний элемент = текущий день). */
  history: HistoryDay[]
}

interface Kpi {
  key: string
  label: string
  value: string
  unit?: string
  sub?: ReactNode
  metric?: MetricKey
  series?: (d: HistoryDay) => number
}

const avg = (values: number[]) => values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1)

/**
 * Полоса показателей: текущее значение по модели, изменение к среднему за предыдущие дни периода
 * и тренд периода. Одна рамка с разделителями — показатели читаются как единая сводка.
 */
export function KpiStrip({ result, history }: KpiStripProps) {
  const previous = history.slice(0, -1)
  const periodLabel = `к ср. за ${previous.length} ${plural(previous.length, { one: 'день', few: 'дня', many: 'дней' })}`

  const kpis: Kpi[] = [
    {
      key: 'throughput',
      label: 'Производительность',
      value: formatNumber(result.outputPerHour, 1),
      unit: 'шт/ч',
      metric: 'outputPerHour',
      series: (d) => d.result.outputPerHour,
    },
    {
      key: 'cycle',
      label: 'Среднее время цикла',
      value: formatDuration(result.cycleTimeMin),
      metric: 'cycleTimeMin',
      series: (d) => d.result.cycleTimeMin,
    },
    {
      key: 'wip',
      label: 'Незавершённое производство',
      value: formatNumber(result.wip, 0),
      unit: 'шт',
      sub: <>задел на линии</>,
      metric: 'wip',
      series: (d) => d.result.wip,
    },
    {
      key: 'utilization',
      label: 'Загрузка оборудования',
      value: formatPercent(result.avgUtilization, 1),
      sub: <>макс. {formatPercent(result.constraintUtilization)}</>,
      metric: 'avgUtilization',
      series: (d) => d.result.avgUtilization,
    },
    {
      key: 'cost',
      label: 'Операционные затраты',
      value: formatRubCompact(result.operatingCostPerDay),
      unit: '/сут',
      sub: <>{formatRub(result.conversionCostPerUnit)} на изделие</>,
      metric: 'operatingCostPerDay',
      series: (d) => d.result.operatingCostPerDay,
    },
    {
      key: 'bottlenecks',
      label: 'Участки с перегрузкой',
      value: String(result.bottleneckCount),
      sub: (
        <>
          ещё {result.riskCount} в зоне риска · {result.idleCount} с простоем
        </>
      ),
    },
  ]

  return (
    <section aria-label="Ключевые показатели" className="overflow-hidden rounded-lg border border-line bg-line">
      <dl className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const values = k.series ? history.map(k.series) : []
          const delta = k.metric && k.series && previous.length ? compareMetric(k.metric, avg(previous.map(k.series)), k.series(history[history.length - 1])) : null
          return (
            <div key={k.key} className="flex min-w-0 flex-col gap-1.5 bg-surface px-4 py-3.5">
              <dt className="truncate text-xs text-muted">{k.label}</dt>
              <dd className="whitespace-nowrap">
                <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] text-ink">{k.value}</span>
                {k.unit && <span className="ml-1 text-xs text-muted">{k.unit}</span>}
              </dd>
              <dd className="flex min-h-6 items-center justify-between gap-2 text-xs text-muted">
                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
                  {delta ? (
                    <>
                      <Delta delta={delta} showAbsolute={false} />
                      <span className="truncate text-faint">{periodLabel}</span>
                    </>
                  ) : (
                    k.sub
                  )}
                </span>
                {values.length > 1 && (
                  <span className="shrink-0">
                    <Sparkline values={values} width={56} height={22} label={`Тренд: ${k.label}`} />
                  </span>
                )}
              </dd>
              {delta && k.sub && <dd className="-mt-1 text-xs text-faint">{k.sub}</dd>}
            </div>
          )
        })}
      </dl>
    </section>
  )
}
