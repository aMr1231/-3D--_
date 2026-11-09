import type { ReactNode } from 'react'
import { Delta } from '@/components/ui/Delta'
import { Sparkline } from '@/components/ui/Sparkline'
import { STAGES } from '@/data/demo/enterprise'
import type { HistoryDay } from '@/data/demo/history'
import { formatDuration, formatNumber, formatPercent, formatRubCompact } from '@/domain/format'
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
  /** Короткая подпись, если нет изменения к периоду. */
  note?: ReactNode
  metric?: MetricKey
  series?: (d: HistoryDay) => number
}

const avg = (values: number[]) => values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1)

/**
 * Ключевые показатели: значение, изменение к среднему за предыдущие дни периода и тренд.
 * Как читать изменение и вспомогательные значения — в «Справке».
 */
export function KpiStrip({ result, history }: KpiStripProps) {
  const previous = history.slice(0, -1)

  const kpis: Kpi[] = [
    { key: 'throughput', label: 'Производительность', value: formatNumber(result.outputPerHour, 1), unit: 'шт/ч', metric: 'outputPerHour', series: (d) => d.result.outputPerHour },
    { key: 'cycle', label: 'Время цикла', value: formatDuration(result.cycleTimeMin), metric: 'cycleTimeMin', series: (d) => d.result.cycleTimeMin },
    { key: 'wip', label: 'Незавершённое пр-во', value: formatNumber(result.wip, 0), unit: 'шт', metric: 'wip', series: (d) => d.result.wip },
    { key: 'utilization', label: 'Загрузка', value: formatPercent(result.avgUtilization, 1), metric: 'avgUtilization', series: (d) => d.result.avgUtilization },
    { key: 'cost', label: 'Затраты', value: formatRubCompact(result.operatingCostPerDay), unit: '/сут', metric: 'operatingCostPerDay', series: (d) => d.result.operatingCostPerDay },
    { key: 'bottlenecks', label: 'Перегрузки', value: String(result.bottleneckCount), note: `из ${STAGES.length} участков` },
  ]

  return (
    <section aria-label="Ключевые показатели" className="rounded-xl border border-line bg-surface p-5 md:p-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const values = k.series ? history.map(k.series) : []
          const delta =
            k.metric && k.series && previous.length ? compareMetric(k.metric, avg(previous.map(k.series)), k.series(history[history.length - 1])) : null
          return (
            <div key={k.key} className="min-w-0">
              <dt className="truncate text-13 text-muted">{k.label}</dt>
              <dd className="mt-2 whitespace-nowrap">
                <span className="tnum text-kpi font-semibold text-ink">{k.value}</span>
                {k.unit && <span className="ml-1 text-sm text-muted">{k.unit}</span>}
              </dd>
              <dd className="mt-2 flex h-6 items-center justify-between gap-2">
                {delta ? <Delta delta={delta} showAbsolute={false} /> : <span className="truncate text-13 text-muted">{k.note}</span>}
                {values.length > 1 && <Sparkline values={values} width={56} height={22} label={`Тренд: ${k.label}`} />}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
