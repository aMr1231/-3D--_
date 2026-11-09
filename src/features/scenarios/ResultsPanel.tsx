import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, Calculator, CircleDot, TriangleExclamationPoint } from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Button } from '@/components/ui/Button'
import { Delta } from '@/components/ui/Delta'
import { EmptyState } from '@/components/ui/Feedback'
import { LINE_MODEL } from '@/data/demo/enterprise'
import { describeChange } from '@/domain/conclusions'
import { formatDateTime, formatNumber } from '@/domain/format'
import { COMPARISON_METRICS, METRICS, compareSummaries } from '@/domain/metrics'
import { summarize } from '@/domain/simulation/engine'
import type { SimulationResult } from '@/domain/types'
import { CycleDelta, LineCompare } from './LineCompare'

export interface Calculation {
  result: SimulationResult
  ranAt: string
  durationMs: number
  /** saved — показан результат сохранённых параметров; run — расчёт запущен пользователем. */
  source: 'saved' | 'run'
}

function formatMs(ms: number) {
  return ms < 0.1 ? '< 0,1 мс' : `${formatNumber(ms, ms < 10 ? 1 : 0)} мс`
}

interface ResultsPanelProps {
  base: SimulationResult
  calculation: Calculation | null
  stale: boolean
  running: boolean
  scenarioName: string
  onRun: () => void
}

const TONE = {
  better: { icon: ArrowUpRight, cls: 'text-ok' },
  worse: { icon: ArrowDownRight, cls: 'text-crit' },
  neutral: { icon: CircleDot, cls: 'text-muted' },
}

export function ResultsPanel({ base, calculation, stale, running, scenarioName, onRun }: ResultsPanelProps) {
  if (!calculation) {
    return (
      <EmptyState
        icon={<Calculator />}
        title="Расчёт ещё не выполнен"
        description="Измените параметры и нажмите «Рассчитать» — модель пересчитает время цикла, выпуск, загрузку и стоимость."
        action={
          <Button variant="primary" onClick={onRun} loading={running} icon={<Calculator />}>
            Рассчитать
          </Button>
        }
      />
    )
  }

  const r = calculation.result
  const deltas = compareSummaries(summarize(base), summarize(r), COMPARISON_METRICS)
  const conclusions = describeChange(LINE_MODEL, base, r)

  return (
    <div className={clsx('space-y-4 transition-opacity', (stale || running) && 'opacity-60')} aria-busy={running}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-13 text-muted">
          <span className="font-medium text-ink-2">База</span> → <span className="font-medium text-ink">{scenarioName}</span>
        </p>
        <p className="tnum text-2xs text-faint">
          {calculation.source === 'saved' ? 'по сохранённым параметрам' : formatDateTime(calculation.ranAt)} · расчёт {formatMs(calculation.durationMs)}
        </p>
      </div>

      {stale && (
        <div className="flex items-start gap-2 rounded-md border border-warn-mark/40 bg-warn-soft px-3 py-2 text-xs text-warn">
          <TriangleExclamationPoint className="mt-px size-3.5 shrink-0" aria-hidden />
          <span className="flex-1">Параметры изменены после расчёта — результаты устарели.</span>
          <Button size="xs" variant="secondary" onClick={onRun} loading={running}>
            Пересчитать
          </Button>
        </div>
      )}

      <section aria-label="Выводы">
        <ul className="space-y-1.5">
          {conclusions.map((c, i) => {
            const t = TONE[c.tone]
            return (
              <li key={i} className="flex gap-2 text-13 text-ink-2">
                <t.icon className={clsx('mt-0.5 size-3.5 shrink-0', t.cls)} aria-hidden />
                <span>{c.text}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <LineCompare base={base} alt={r} runKey={calculation.ranAt} />

      <section aria-label="Сравнение показателей" className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-13">
          <caption className="sr-only">Базовый сценарий и изменённый сценарий</caption>
          <thead>
            <tr className="bg-subtle text-xs text-muted">
              <th scope="col" className="px-3 py-2 text-left font-medium">Показатель</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">База</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Сценарий</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {deltas.map((d) => {
              const def = METRICS[d.key]
              return (
                <tr key={d.key} className="border-t border-line">
                  <th scope="row" className="px-3 py-2 text-left text-xs font-normal text-ink-2" title={def.hint}>
                    {def.short}
                  </th>
                  <td className="tnum px-2 py-2 text-right text-xs whitespace-nowrap text-muted">{def.format(d.base)}</td>
                  <td className="tnum px-2 py-2 text-right text-xs font-medium whitespace-nowrap text-ink">
                    <AnimatedNumber value={d.value} format={def.format} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span key={calculation.ranAt} className={d.verdict === 'same' ? undefined : 'change-flash inline-block rounded px-1'}>
                      <Delta delta={d} showShare={false} />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <CycleDelta base={base} alt={r} />
    </div>
  )
}
