import clsx from 'clsx'
import { RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ParamField } from '@/components/ui/Controls'
import { StageCode, StatusIndicator } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import type { ScenarioParams, SimulationResult, StageParams } from '@/domain/types'
import { RANGES, stageParamsEqual } from './params'

interface ParameterEditorProps {
  draft: ScenarioParams
  base: ScenarioParams
  onChange: (next: ScenarioParams) => void
  /** Последний расчёт — для подсказок по участкам. */
  calculated: SimulationResult | null
  stale: boolean
  focusStageId: string | null
}

export function ParameterEditor({ draft, base, onChange, calculated, stale, focusStageId }: ParameterEditorProps) {
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!focusStageId) return
    const el = refs.current[focusStageId]
    if (!el) return
    const id = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
    return () => window.clearTimeout(id)
  }, [focusStageId])

  const setStage = (id: string, patch: Partial<StageParams>) =>
    onChange({ ...draft, stages: { ...draft.stages, [id]: { ...draft.stages[id], ...patch } } })

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-line bg-surface p-4" aria-labelledby="global-params">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 id="global-params" className="text-13 font-semibold text-ink">
            Производственная нагрузка
          </h3>
          <span className="tnum text-xs text-muted">
            запуск {formatNumber(draft.loadPerHour * draft.hoursPerDay, 0)} заготовок/сут
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ParamField
            label="Запуск заготовок"
            unit="шт/ч"
            digits={1}
            value={draft.loadPerHour}
            baseValue={base.loadPerHour}
            {...RANGES.loadPerHour}
            onChange={(v) => onChange({ ...draft, loadPerHour: v })}
            format={(v) => formatNumber(v, 1)}
            hint="Интенсивность запуска заготовок в производство"
          />
          <ParamField
            label="Рабочих часов в сутки"
            unit="ч"
            value={draft.hoursPerDay}
            baseValue={base.hoursPerDay}
            {...RANGES.hoursPerDay}
            onChange={(v) => onChange({ ...draft, hoursPerDay: v })}
          />
        </div>
      </section>

      {STAGES.map((def, i) => {
        const p = draft.stages[def.id]
        const b = base.stages[def.id]
        const changed = !stageParamsEqual(p, b)
        const r = calculated?.stages[i]
        const focused = focusStageId === def.id
        return (
          <section
            key={def.id}
            ref={(el) => {
              refs.current[def.id] = el
            }}
            aria-labelledby={`stage-${def.id}`}
            className={clsx(
              'rounded-lg border bg-surface p-4 transition-shadow',
              focused ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-line)]' : changed ? 'border-accent-line' : 'border-line',
            )}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <StageCode>{def.code}</StageCode>
                <h3 id={`stage-${def.id}`} className="truncate text-13 font-semibold text-ink">
                  {def.name}
                </h3>
                {changed && <span className="rounded-[3px] bg-accent-soft px-1.5 py-px text-2xs font-medium text-accent">изменён</span>}
              </div>
              <div className="flex items-center gap-3">
                {r && (
                  <span className={clsx('flex items-center gap-2 text-xs', stale && 'opacity-50')} title={stale ? 'Результат устарел — пересчитайте' : undefined}>
                    <StatusIndicator status={r.status} variant="icon" />
                    <span className="tnum text-muted">
                      загрузка <span className="font-medium text-ink-2">{formatPercent(r.utilization)}</span>
                    </span>
                  </span>
                )}
                {changed && (
                  <button
                    type="button"
                    onClick={() => setStage(def.id, { ...b })}
                    className="flex items-center gap-1 text-2xs text-muted hover:text-ink"
                  >
                    <RotateCcw className="size-3" aria-hidden /> к базе
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 2xl:grid-cols-4">
              <ParamField
                label={`Ресурсы, ${plural(p.resources, def.resourceKind)}`}
                value={p.resources}
                baseValue={b.resources}
                {...RANGES.resources}
                onChange={(v) => setStage(def.id, { resources: v })}
              />
              <ParamField
                label="Скорость обработки"
                unit="%"
                value={Math.round(p.speedFactor * 100)}
                baseValue={Math.round(b.speedFactor * 100)}
                {...RANGES.speedPercent}
                onChange={(v) => setStage(def.id, { speedFactor: v / 100 })}
                hint="Режимы, оснастка, программы: 120 % — операция выполняется на 20 % быстрее нормы"
              />
              <ParamField
                label="Время операции"
                unit="мин"
                digits={1}
                value={p.opTimeMin}
                baseValue={b.opTimeMin}
                {...RANGES.opTimeMin}
                onChange={(v) => setStage(def.id, { opTimeMin: v })}
                format={(v) => formatNumber(v, 1)}
                hint="Норма времени на одно изделие одним ресурсом"
              />
              <ParamField
                label="Стоимость ресурса"
                unit="₽/ч"
                value={p.costPerHour}
                baseValue={b.costPerHour}
                {...RANGES.costPerHour}
                onChange={(v) => setStage(def.id, { costPerHour: v })}
                format={(v) => formatRub(v)}
              />
            </div>
          </section>
        )
      })}
    </div>
  )
}
