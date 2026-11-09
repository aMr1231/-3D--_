import { formatDuration, formatPercent, formatRub } from '@/domain/format'
import type { StageResult } from '@/domain/types'

export type TwinLayer = 'utilization' | 'wait' | 'cost'

export const LAYERS: Record<TwinLayer, { label: string; hint: string; value: (s: StageResult) => number; format: (v: number) => string }> = {
  utilization: {
    label: 'Загрузка',
    hint: 'Доля времени, когда ресурсы участка заняты',
    value: (s) => s.utilization,
    format: (v) => formatPercent(v),
  },
  wait: {
    label: 'Ожидание',
    hint: 'Среднее время ожидания в очереди перед участком',
    value: (s) => s.waitMin,
    format: formatDuration,
  },
  cost: {
    label: 'Стоимость',
    hint: 'Стоимость операции на одно изделие',
    value: (s) => s.costPerUnit,
    format: (v) => formatRub(v),
  },
}
