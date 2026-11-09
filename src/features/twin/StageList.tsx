import clsx from 'clsx'
import { ArrowDown } from 'lucide-react'
import { Meter, STATUS_ICON, STATUS_TEXT, StageCode } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'
import { LAYERS, type TwinLayer } from './layers'

interface StageListProps {
  result: SimulationResult
  layer: TwinLayer
  selectedStageId: string | null
  onSelect: (id: string) => void
}

/** Вертикальная мнемосхема — основной вид на телефоне и доступная альтернатива холсту. */
export function StageList({ result, layer, selectedStageId, onSelect }: StageListProps) {
  return (
    <ol className="mx-auto max-w-[560px] space-y-0 p-4" aria-label="Участки линии по ходу процесса">
      <li className="mb-2 flex items-center justify-between rounded-md border border-dashed border-[#b9c1ca] bg-[#fbfbfc] px-3 py-2 text-xs">
        <span className="text-muted">Запуск в производство</span>
        <span className="tnum font-semibold text-ink">{formatNumber(result.params.loadPerHour, 1)} шт/ч</span>
      </li>
      {STAGES.map((def, i) => {
        const s = result.stages[i]
        const Icon = STATUS_ICON[s.status]
        const active = def.id === selectedStageId
        return (
          <li key={def.id}>
            <div className="flex justify-center py-1 text-faint" aria-hidden>
              <ArrowDown className="size-3.5" />
              {s.queueLength >= 1 && (
                <span className={clsx('ml-1 text-2xs', s.status === 'bottleneck' ? 'text-crit' : 'text-muted')}>
                  очередь {formatNumber(s.queueLength, 0)} шт
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelect(def.id)}
              aria-pressed={active}
              className={clsx(
                'w-full rounded-lg border bg-surface px-3 py-2.5 text-left transition-shadow',
                s.status === 'bottleneck' ? 'border-crit/60' : s.status === 'high' ? 'border-warn-mark/60' : 'border-line',
                active && 'shadow-[0_0_0_3px_var(--color-accent-line)]',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <StageCode>{def.code}</StageCode>
                  <span className="truncate text-13 font-semibold text-ink">{def.name}</span>
                </span>
                <span className={clsx('flex shrink-0 items-center gap-1 text-2xs font-medium', STATUS_TEXT[s.status])}>
                  <Icon className="size-3.5" aria-hidden /> {STATUS_META[s.status].short}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Meter value={s.utilization} status={s.status} className="flex-1" />
                <span className="tnum w-24 text-right text-xs text-ink-2">
                  {LAYERS[layer].label.toLowerCase()} {LAYERS[layer].format(LAYERS[layer].value(s))}
                </span>
              </div>
              <p className="tnum mt-1.5 text-2xs text-muted">
                {formatNumber(s.processedPerHour, 1)} / {formatNumber(s.capacityPerHour, 1)} шт/ч · загрузка {formatPercent(s.utilization)} ·{' '}
                {result.params.stages[def.id].resources} ед.
              </p>
            </button>
          </li>
        )
      })}
      <li className="mt-2 flex items-center justify-between rounded-md border border-dashed border-[#b9c1ca] bg-[#fbfbfc] px-3 py-2 text-xs">
        <span className="text-muted">Отгрузка заказчикам</span>
        <span className="tnum font-semibold text-ink">{formatNumber(result.outputPerDay, 0)} шт/сут</span>
      </li>
    </ol>
  )
}
