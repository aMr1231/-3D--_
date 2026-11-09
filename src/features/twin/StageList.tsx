import clsx from 'clsx'
import { ArrowDown } from 'lucide-react'
import { Meter, STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber } from '@/domain/format'
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
    <ol className="mx-auto max-w-[560px] px-4 py-6" aria-label="Участки линии по ходу процесса">
      <li className="flex items-center justify-between rounded-xl border border-dashed border-line-strong px-4 py-3 text-meta">
        <span className="text-muted">Запуск в производство</span>
        <span className="tnum font-semibold text-ink">{formatNumber(result.params.loadPerHour, 1)} шт/ч</span>
      </li>
      {STAGES.map((def, i) => {
        const s = result.stages[i]
        const Icon = STATUS_ICON[s.status]
        const active = def.id === selectedStageId
        return (
          <li key={def.id}>
            <div className="flex items-center justify-center gap-1 py-1.5 text-faint" aria-hidden>
              <ArrowDown className="size-4" />
              {s.queueLength >= 1 && (
                <span className={clsx('text-meta', s.status === 'bottleneck' ? 'text-crit' : 'text-muted')}>очередь {formatNumber(s.queueLength, 0)} шт</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSelect(def.id)}
              aria-pressed={active}
              className={clsx(
                'w-full rounded-xl border bg-surface px-4 py-3.5 text-left transition-shadow',
                s.status === 'bottleneck' ? 'border-crit/60' : s.status === 'high' ? 'border-warn-mark/60' : 'border-line',
                active && 'shadow-[0_0_0_3px_var(--color-accent-line)]',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">{def.name}</span>
                <span className={clsx('flex shrink-0 items-center gap-1 text-meta font-medium', STATUS_TEXT[s.status])}>
                  <Icon className="size-4" aria-hidden /> {STATUS_META[s.status].short}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Meter value={s.utilization} status={s.status} className="flex-1" />
                <span className="tnum min-w-16 text-right text-sm font-medium text-ink-2">{LAYERS[layer].format(LAYERS[layer].value(s))}</span>
              </div>
            </button>
          </li>
        )
      })}
      <li className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-line-strong px-4 py-3 text-meta">
        <span className="text-muted">Отгрузка заказчикам</span>
        <span className="tnum font-semibold text-ink">{formatNumber(result.outputPerDay, 0)} шт/сут</span>
      </li>
    </ol>
  )
}
