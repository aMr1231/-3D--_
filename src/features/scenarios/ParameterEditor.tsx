import clsx from 'clsx'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ParamField } from '@/components/ui/Controls'
import { StatusIndicator } from '@/components/ui/Status'
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

/**
 * Редактор параметров: нагрузка линии и по карточке на участок.
 * Участки, которые не меняли, свёрнуты в одну строку с текущими значениями — раскрываются по нажатию.
 * Что означает каждый параметр — в «Справке».
 */
export function ParameterEditor({ draft, base, onChange, calculated, stale, focusStageId }: ParameterEditorProps) {
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(STAGES.filter((s) => s.id === focusStageId || !stageParamsEqual(draft.stages[s.id], base.stages[s.id])).map((s) => s.id)),
  )

  useEffect(() => {
    if (!focusStageId) return
    setOpen((prev) => (prev.has(focusStageId) ? prev : new Set(prev).add(focusStageId)))
    const el = refs.current[focusStageId]
    if (!el) return
    const id = window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
    return () => window.clearTimeout(id)
  }, [focusStageId])

  const setStage = (id: string, patch: Partial<StageParams>) =>
    onChange({ ...draft, stages: { ...draft.stages, [id]: { ...draft.stages[id], ...patch } } })

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allOpen = open.size === STAGES.length

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-line bg-surface p-5" aria-labelledby="global-params">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="global-params" className="text-sm font-semibold text-ink">
            Производственная нагрузка
          </h3>
          <span className="tnum text-meta text-muted">{formatNumber(draft.loadPerHour * draft.hoursPerDay, 0)} заготовок/сут</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <ParamField
            label="Запуск заготовок"
            unit="шт/ч"
            digits={1}
            value={draft.loadPerHour}
            baseValue={base.loadPerHour}
            {...RANGES.loadPerHour}
            onChange={(v) => onChange({ ...draft, loadPerHour: v })}
            format={(v) => formatNumber(v, 1)}
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

      <div className="flex items-center justify-between gap-3 px-1 pt-2">
        <h3 className="text-sm font-semibold text-ink">Участки</h3>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(STAGES.map((s) => s.id)))}
          className="text-meta font-medium text-muted hover:text-ink"
        >
          {allOpen ? 'Свернуть все' : 'Развернуть все'}
        </button>
      </div>

      {STAGES.map((def, i) => {
        const p = draft.stages[def.id]
        const b = base.stages[def.id]
        const changed = !stageParamsEqual(p, b)
        const r = calculated?.stages[i]
        const focused = focusStageId === def.id
        const isOpen = open.has(def.id)
        const panelId = `stage-params-${def.id}`
        return (
          <section
            key={def.id}
            ref={(el) => {
              refs.current[def.id] = el
            }}
            aria-labelledby={`stage-${def.id}`}
            className={clsx(
              'rounded-xl border bg-surface transition-shadow',
              focused ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-line)]' : changed ? 'border-accent-line' : 'border-line',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
              <button
                type="button"
                onClick={() => toggle(def.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="group flex min-w-[15rem] flex-1 items-start gap-2.5 text-left"
              >
                <ChevronDown
                  className={clsx('mt-0.5 size-4 shrink-0 text-faint transition-transform group-hover:text-ink', !isOpen && '-rotate-90')}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span id={`stage-${def.id}`} className="text-sm font-semibold text-ink">
                      {def.name}
                    </span>
                    {changed && (
                      <span className="size-2 shrink-0 rounded-full bg-accent" title="Параметры изменены">
                        <span className="sr-only">Параметры изменены</span>
                      </span>
                    )}
                  </span>
                  {!isOpen && (
                    <span className="tnum mt-1 flex flex-wrap gap-x-2 text-meta text-muted">
                      {[
                        `${p.resources} ${plural(p.resources, def.resourceKind)}`,
                        `скорость ${Math.round(p.speedFactor * 100)} %`,
                        `${formatNumber(p.opTimeMin, 1)} мин`,
                        `${formatRub(p.costPerHour)}/ч`,
                      ].map((part, idx, all) => (
                        <span key={idx} className="whitespace-nowrap">
                          {part}
                          {idx < all.length - 1 && <span className="ml-2 text-faint">·</span>}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
              {/* На узком экране загрузка уходит под название — с отступом под шеврон */}
              <div className="ml-[26px] flex items-center gap-4 sm:ml-0">
                {r && (
                  <span className={clsx('flex items-center gap-1.5 text-meta', stale && 'opacity-50')} title={stale ? 'Результат устарел — пересчитайте' : undefined}>
                    <StatusIndicator status={r.status} variant="icon" />
                    <span className="tnum text-muted">
                      загрузка <span className="font-medium text-ink-2">{formatPercent(r.utilization)}</span>
                    </span>
                  </span>
                )}
                {changed && (
                  <button type="button" onClick={() => setStage(def.id, { ...b })} className="flex items-center gap-1 text-meta text-muted hover:text-ink">
                    <RotateCcw className="size-3.5" aria-hidden /> Вернуть
                  </button>
                )}
              </div>
            </div>
            {isOpen && (
              <div id={panelId} className="grid gap-x-6 gap-y-5 px-5 pb-5 sm:grid-cols-2 2xl:grid-cols-4">
                <ParamField
                  label="Ресурсы"
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
            )}
          </section>
        )
      })}
    </div>
  )
}
