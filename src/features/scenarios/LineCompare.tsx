import clsx from 'clsx'
import { STATUS_ICON, STATUS_SOFT, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatSigned } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'

interface LineCompareProps {
  base: SimulationResult
  alt: SimulationResult
  /** Ключ расчёта — перезапускает подсветку изменившихся участков. */
  runKey: string
}

/**
 * «До / после» на уровне линии: две строки участков (база и сценарий) со статусом и загрузкой.
 * Ограничение линии обведено; как читать — в «Справке».
 */
export function LineCompare({ base, alt, runKey }: LineCompareProps) {
  const rows = [
    { key: 'base', label: 'База', r: base },
    { key: 'alt', label: 'Сценарий', r: alt },
  ]
  return (
    <section aria-labelledby="line-compare">
      <h3 id="line-compare" className="text-13 font-semibold text-ink-2">
        Линия: база → сценарий
      </h3>
      <div className="mt-3 grid grid-cols-[64px_repeat(6,minmax(0,1fr))] gap-1.5">
        <span />
        {STAGES.map((s) => (
          <span key={s.id} className="code-tag truncate text-center text-faint" title={s.name}>
            {s.code}
          </span>
        ))}
        {rows.map((row) => (
          <div key={row.key} className="contents">
            <span className="self-center text-13 text-muted">{row.label}</span>
            {row.r.stages.map((st, i) => {
              const Icon = STATUS_ICON[st.status]
              const isConstraint = row.r.constraintStageId === st.stageId
              const changed = row.key === 'alt' && base.stages[i].status !== st.status
              return (
                <div
                  key={`${st.stageId}-${row.key === 'alt' ? runKey : 'b'}`}
                  className={clsx(
                    'flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-2',
                    STATUS_SOFT[st.status],
                    isConstraint && 'ring-2 ring-current ring-inset',
                    changed && 'change-flash',
                  )}
                  title={`${STAGES[i].name}: ${STATUS_META[st.status].label}, ${formatPercent(st.utilization, 1)}${isConstraint ? ' · ограничение линии' : ''}`}
                >
                  <Icon className={clsx('size-3.5', STATUS_TEXT[st.status])} aria-hidden />
                  <span className="tnum text-xs font-semibold text-ink">{formatPercent(st.utilization)}</span>
                  {isConstraint && <span className="sr-only">ограничение линии</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Из чего сложилось изменение времени цикла: вклад каждого участка (ожидание + обработка + транспорт). */
export function CycleDelta({ base, alt }: { base: SimulationResult; alt: SimulationResult }) {
  const rows = STAGES.map((s, i) => {
    const b = base.stages[i]
    const a = alt.stages[i]
    const delta = a.waitMin + a.processMin + a.transportMin - (b.waitMin + b.processMin + b.transportMin)
    return { id: s.id, name: s.shortName, delta }
  })
  const total = alt.cycleTimeMin - base.cycleTimeMin
  const max = Math.max(...rows.map((r) => Math.abs(r.delta)), 1)
  if (Math.abs(total) < 0.5 && rows.every((r) => Math.abs(r.delta) < 0.5)) return null

  return (
    <section aria-labelledby="cycle-delta">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="cycle-delta" className="text-13 font-semibold text-ink-2">
          Время цикла по участкам
        </h3>
        <span className={clsx('tnum text-13 font-semibold', total < 0 ? 'text-ok' : 'text-crit')}>{formatSigned(total, formatDuration)}</span>
      </div>
      <ul className="mt-3 space-y-2" aria-label="Вклад участков в изменение времени цикла">
        {rows.map((r) => {
          const share = (Math.abs(r.delta) / max) * 50
          const better = r.delta < 0
          return (
            <li key={r.id} className="grid grid-cols-[96px_minmax(0,1fr)_72px] items-center gap-3 text-13">
              <span className="truncate text-muted">{r.name}</span>
              <span className="relative h-2 rounded-full bg-subtle" aria-hidden>
                <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                {Math.abs(r.delta) >= 0.05 && (
                  <span
                    className={clsx('absolute inset-y-0 rounded-full', better ? 'bg-ok' : 'bg-crit')}
                    style={better ? { right: '50%', width: `${share}%` } : { left: '50%', width: `${share}%` }}
                  />
                )}
              </span>
              <span className={clsx('tnum text-right font-medium', Math.abs(r.delta) < 0.05 ? 'text-faint' : better ? 'text-ok' : 'text-crit')}>
                {Math.abs(r.delta) < 0.05 ? '0' : formatSigned(r.delta, (v) => (v >= 10 ? formatDuration(v) : `${formatNumber(v, 1)} мин`))}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
