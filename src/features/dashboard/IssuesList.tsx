import { Lightbulb, SlidersHorizontal, Workflow } from 'lucide-react'
import { useMemo } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { StageCode, StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL, getStage } from '@/data/demo/enterprise'
import { buildInsights } from '@/domain/insights'
import type { SimulationResult } from '@/domain/types'
import { CircleCheck } from 'lucide-react'

/** Перегрузки и простои с рекомендациями, рассчитанными перерасчётом модели. */
export function IssuesList({ result }: { result: SimulationResult }) {
  const insights = useMemo(() => buildInsights(LINE_MODEL, result.params, result), [result])

  return (
    <Panel
      title="Перегрузки и резервы"
      subtitle="Рекомендации рассчитаны моделью: ±1 ресурс на участке"
      flush
      className="flex flex-col"
      bodyClassName="flex-1"
    >
      {insights.length === 0 ? (
        <EmptyState icon={<CircleCheck />} title="Отклонений нет" description="Все участки работают в диапазоне 50–85 % загрузки." />
      ) : (
        <ul className="divide-y divide-line">
          {insights.map((ins) => {
            const def = getStage(ins.stageId)!
            return (
              <li key={ins.stageId} className="space-y-2 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StageCode>{def.code}</StageCode>
                      <span className="truncate text-13 font-medium text-ink">{def.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{ins.finding}</p>
                  </div>
                  <StatusIndicator status={ins.status} variant="pill" />
                </div>
                <p className="flex gap-1.5 rounded-md bg-subtle px-2.5 py-2 text-xs text-ink-2">
                  <Lightbulb className="mt-px size-3.5 shrink-0 text-accent" aria-hidden />
                  <span>{ins.recommendation}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <ButtonLink to={`/twin?stage=${ins.stageId}`} size="xs" variant="secondary" icon={<Workflow />}>
                    На схеме
                  </ButtonLink>
                  <ButtonLink
                    to={`/scenarios?focus=${ins.stageId}${ins.sensitivity && ins.actionable ? `&delta=${ins.sensitivity.change}` : ''}`}
                    size="xs"
                    variant="quiet"
                    icon={<SlidersHorizontal />}
                  >
                    Смоделировать
                  </ButtonLink>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
