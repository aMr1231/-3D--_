import clsx from 'clsx'
import { CircleCheck, SlidersHorizontal, Workflow } from 'lucide-react'
import { useMemo } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL, getStage } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRubCompact } from '@/domain/format'
import { buildInsights, type StageInsight } from '@/domain/insights'
import type { SimulationResult } from '@/domain/types'

/** Что происходит и что сделать — простыми словами (точные расчёты остаются в паспорте участка и аналитике). */
function explain(ins: StageInsight, result: SimulationResult): { problem: string; advice: string } {
  const def = getStage(ins.stageId)!
  const s = result.stages.find((x) => x.stageId === ins.stageId)!
  const after = ins.sensitivity?.summary

  if (ins.status === 'bottleneck' || ins.status === 'high') {
    const problem = s.saturated
      ? `Участок не успевает: поступает ${formatNumber(s.inflowPerHour, 1)} шт/ч, а обрабатывается ${formatNumber(s.capacityPerHour, 1)} шт/ч.`
      : s.queueLength >= 1
        ? `Загружен на ${formatPercent(s.utilization)}. Перед ним копится очередь — около ${formatNumber(s.queueLength, 0)} шт, ожидание ${formatDuration(s.waitMin)}.`
        : `Загружен на ${formatPercent(s.utilization)} — запаса мощности почти нет.`
    if (!after) return { problem, advice: 'Проверьте участок на схеме двойника.' }
    const faster = result.cycleTimeMin - after.cycleTimeMin
    const more = after.outputPerDay - result.outputPerDay
    const effect = [
      faster >= 1 ? `изделия будут проходить линию на ${formatDuration(faster)} быстрее` : null,
      more >= 1 ? `выпуск вырастет на ${formatNumber(more, 0)} шт в сутки` : null,
    ].filter(Boolean)
    return {
      problem,
      advice: effect.length
        ? `Добавьте 1 ${def.resourceKind.one} — ${effect.join(', ')}.`
        : 'Добавление ресурса почти ничего не даст — узкое место в другом участке.',
    }
  }

  const problem = `Загружен только на ${formatPercent(s.utilization)} — ресурсы простаивают ${formatPercent(s.idleShare)} времени.`
  if (!after || !ins.sensitivity?.feasible) return { problem, advice: 'Резерв пригодится, если нагрузка вырастет.' }
  return ins.actionable
    ? { problem, advice: `Можно убрать 1 ресурс и экономить ${formatRubCompact(result.operatingCostPerDay - after.operatingCostPerDay)} в сутки.` }
    : { problem, advice: 'Резерв лучше сохранить: без него участок перегрузится в пик.' }
}

const COLS = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' } as const

/** Что требует внимания: участки с перегрузкой или простоем и понятный совет по каждому. */
export function IssuesList({ result }: { result: SimulationResult }) {
  const insights = useMemo(() => buildInsights(LINE_MODEL, result.params, result), [result])

  return (
    <section aria-labelledby="issues-title" className="space-y-4">
      <h2 id="issues-title" className="text-heading font-semibold text-ink">
        Что требует внимания
      </h2>
      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-6 text-sm text-ink-2">
          <CircleCheck className="size-5 shrink-0 text-ok" aria-hidden />
          Все участки работают с нормальной загрузкой — ничего делать не нужно.
        </div>
      ) : (
        <ul className={clsx('grid gap-4', COLS[Math.min(insights.length, 3) as 1 | 2 | 3])}>
          {insights.map((ins) => {
            const def = getStage(ins.stageId)!
            const { problem, advice } = explain(ins, result)
            return (
              <li key={ins.stageId} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-heading leading-snug font-semibold text-ink">{def.name}</h3>
                  <StatusIndicator status={ins.status} variant="pill" />
                </div>
                <p className="text-sm text-muted">{problem}</p>
                <p className="text-sm text-ink">{advice}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <ButtonLink
                    to={`/scenarios?focus=${ins.stageId}${ins.sensitivity && ins.actionable ? `&delta=${ins.sensitivity.change}` : ''}`}
                    size="sm"
                    variant="secondary"
                    icon={<SlidersHorizontal />}
                  >
                    Проверить на модели
                  </ButtonLink>
                  <ButtonLink to={`/twin?stage=${ins.stageId}`} size="sm" variant="ghost" icon={<Workflow />}>
                    На схеме
                  </ButtonLink>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
