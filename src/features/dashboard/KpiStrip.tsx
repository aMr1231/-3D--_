import type { ReactNode } from 'react'
import { Delta } from '@/components/ui/Delta'
import { Sparkline } from '@/components/ui/Sparkline'
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
    { key: 'throughput', label: 'Выпуск в час', value: formatNumber(result.outputPerHour, 1), unit: 'шт', metric: 'outputPerHour', series: (d) => d.result.outputPerHour },
    { key: 'cycle', label: 'Время изготовления', value: formatDuration(result.cycleTimeMin), metric: 'cycleTimeMin', series: (d) => d.result.cycleTimeMin },
    { key: 'utilization', label: 'Загрузка оборудования', value: formatPercent(result.avgUtilization, 0), metric: 'avgUtilization', series: (d) => d.result.avgUtilization },
    { key: 'cost', label: 'Затраты в сутки', value: formatRubCompact(result.operatingCostPerDay), metric: 'operatingCostPerDay', series: (d) => d.result.operatingCostPerDay },
  ]

  return (
    <dl aria-label="Ключевые показатели" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const values = k.series ? history.map(k.series) : []
        const delta =
          k.metric && k.series && previous.length ? compareMetric(k.metric, avg(previous.map(k.series)), k.series(history[history.length - 1])) : null
        return (
          <div key={k.key} className="min-w-0 rounded-2xl border border-line bg-surface p-6">
            <dt className="text-sm text-muted">{k.label}</dt>
            <dd className="mt-3 whitespace-nowrap">
              <span className="tnum text-kpi font-semibold text-ink">{k.value}</span>
              {k.unit && <span className="ml-1.5 text-sm text-muted">{k.unit}</span>}
            </dd>
            <dd className="mt-3 flex h-7 items-center justify-between gap-3">
              {delta ? <Delta delta={delta} showAbsolute={false} /> : <span className="text-sm text-muted">{k.note}</span>}
              {values.length > 1 && <Sparkline values={values} width={72} height={26} label={`Тренд: ${k.label}`} />}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
