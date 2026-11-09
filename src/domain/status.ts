import { STATUS_THRESHOLDS } from '@/config/app'
import type { StageStatus } from './types'

export function classifyUtilization(utilization: number, saturated = false): StageStatus {
  if (saturated || utilization >= STATUS_THRESHOLDS.bottleneck) return 'bottleneck'
  if (utilization >= STATUS_THRESHOLDS.high) return 'high'
  if (utilization < STATUS_THRESHOLDS.idle) return 'idle'
  return 'normal'
}

export const STATUS_META: Record<StageStatus, { label: string; short: string; description: string }> = {
  bottleneck: {
    label: 'Перегрузка',
    short: 'Перегрузка',
    description: 'Загрузка ≥ 95 % или поступление выше мощности: растут очередь и время цикла.',
  },
  high: {
    label: 'Высокая загрузка',
    short: 'Риск',
    description: 'Загрузка 85–95 %: любой простой оборудования приведёт к недовыпуску.',
  },
  normal: {
    label: 'Норма',
    short: 'Норма',
    description: 'Загрузка 50–85 %: есть резерв мощности.',
  },
  idle: {
    label: 'Недогрузка',
    short: 'Простой',
    description: 'Загрузка < 50 %: ресурсы большую часть времени простаивают.',
  },
}

/** Порядок «тяжести» для сортировки. */
export const STATUS_SEVERITY: Record<StageStatus, number> = {
  bottleneck: 3,
  high: 2,
  idle: 1,
  normal: 0,
}
