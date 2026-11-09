import { MODEL } from '@/config/app'
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRub,
  formatRubCompact,
  formatSmart,
} from './format'
import type { KpiSummary } from './types'

export type MetricKey =
  | 'cycleTimeMin'
  | 'outputPerDay'
  | 'outputPerHour'
  | 'avgUtilization'
  | 'constraintUtilization'
  | 'costPerUnit'
  | 'operatingCostPerDay'
  | 'wip'
  | 'shortfallPerDay'

export type MetricDirection = 'lower' | 'higher' | 'neutral'

export interface MetricDefinition {
  key: MetricKey
  label: string
  /** Короткая подпись для узких таблиц. */
  short: string
  hint: string
  direction: MetricDirection
  format: (value: number) => string
  /** Формат разницы (без знака). */
  formatDelta: (value: number) => string
}

const pp = (v: number) => `${formatNumber(v * 100, 1)} п.п.`

export const METRICS: Record<MetricKey, MetricDefinition> = {
  cycleTimeMin: {
    key: 'cycleTimeMin',
    short: 'Время цикла',
    label: 'Время цикла',
    hint: 'Среднее время прохождения изделия по линии: ожидание + обработка + транспорт',
    direction: 'lower',
    format: formatDuration,
    formatDelta: formatDuration,
  },
  outputPerDay: {
    key: 'outputPerDay',
    short: 'Выпуск, шт/сут',
    label: 'Выпуск, шт/сут',
    hint: 'Годные изделия за рабочие сутки',
    direction: 'higher',
    format: (v) => formatNumber(v, 0),
    formatDelta: (v) => formatNumber(v, 0),
  },
  outputPerHour: {
    key: 'outputPerHour',
    short: 'Произв., шт/ч',
    label: 'Производительность, шт/ч',
    hint: 'Годные изделия в час',
    direction: 'higher',
    format: (v) => formatNumber(v, 1),
    formatDelta: (v) => formatNumber(v, 1),
  },
  avgUtilization: {
    key: 'avgUtilization',
    short: 'Ср. загрузка',
    label: 'Средняя загрузка ресурсов',
    hint: 'Средневзвешенная по числу ресурсов. Рост — лучшее использование, но меньше резерва',
    direction: 'neutral',
    format: (v) => formatPercent(v, 1),
    formatDelta: pp,
  },
  constraintUtilization: {
    key: 'constraintUtilization',
    short: 'Загрузка огранич.',
    label: 'Загрузка ограничения',
    hint: 'Загрузка самого нагруженного участка (ограничения линии). Выше 95 % — перегрузка, очередь и риск недовыпуска',
    direction: 'lower',
    format: (v) => formatPercent(v, 1),
    formatDelta: pp,
  },
  costPerUnit: {
    key: 'costPerUnit',
    short: 'Себестоимость',
    label: 'Себестоимость, ₽/шт',
    hint: 'Операционные затраты и материал на одну годную единицу',
    direction: 'lower',
    format: (v) => formatRub(v),
    formatDelta: (v) => formatRub(v),
  },
  operatingCostPerDay: {
    key: 'operatingCostPerDay',
    short: 'Затраты, сут',
    label: 'Операционные затраты, сут',
    hint: 'Ресурсы (оплачиваются всё рабочее время) + переменные затраты, без материала',
    direction: 'lower',
    format: formatRubCompact,
    formatDelta: formatRubCompact,
  },
  wip: {
    key: 'wip',
    short: 'НЗП',
    label: 'Незавершённое производство',
    hint: 'Средний задел на линии, шт (закон Литтла)',
    direction: 'lower',
    format: (v) => `${formatSmart(v)} шт`,
    formatDelta: (v) => `${formatSmart(v)} шт`,
  },
  shortfallPerDay: {
    key: 'shortfallPerDay',
    short: 'Недовыпуск',
    label: 'Недовыпуск к плану',
    hint: 'Сколько годных изделий в сутки линия не успевает выпустить при заданной нагрузке',
    direction: 'lower',
    format: (v) => `${formatNumber(v, 0)} шт`,
    formatDelta: (v) => `${formatNumber(v, 0)} шт`,
  },
}

export const COMPARISON_METRICS: MetricKey[] = [
  'cycleTimeMin',
  'outputPerDay',
  'avgUtilization',
  'constraintUtilization',
  'costPerUnit',
  'operatingCostPerDay',
  'wip',
  'shortfallPerDay',
]

export type Verdict = 'better' | 'worse' | 'same' | 'changed'

export interface MetricDelta {
  key: MetricKey
  base: number
  value: number
  delta: number
  /** Относительное изменение (доля); null, если база = 0. */
  deltaShare: number | null
  verdict: Verdict
}

export function compareMetric(key: MetricKey, base: number, value: number): MetricDelta {
  const def = METRICS[key]
  const delta = value - base
  const deltaShare = Math.abs(base) > 1e-9 ? delta / Math.abs(base) : null
  const significant =
    deltaShare === null ? Math.abs(delta) > 1e-6 : Math.abs(deltaShare) >= MODEL.neutralDeltaShare
  let verdict: Verdict = 'same'
  if (significant) {
    if (def.direction === 'neutral') verdict = 'changed'
    else if (def.direction === 'lower') verdict = delta < 0 ? 'better' : 'worse'
    else verdict = delta > 0 ? 'better' : 'worse'
  }
  return { key, base, value, delta, deltaShare, verdict }
}

export function compareSummaries(
  base: KpiSummary,
  alt: KpiSummary,
  keys: MetricKey[] = COMPARISON_METRICS,
): MetricDelta[] {
  return keys.map((key) => compareMetric(key, base[key], alt[key]))
}
