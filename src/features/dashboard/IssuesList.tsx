import { CircleCheck, SlidersHorizontal, Workflow } from 'lucide-react'
import { useMemo } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL, getStage } from '@/data/demo/enterprise'
import { buildInsights } from '@/domain/insights'
import type { SimulationResult } from '@/domain/types'

/** Перегрузки и простои с рекомендациями, рассчитанными перерасчётом модели. */
export function IssuesList({ result }: { result: SimulationResult }) {
  const insights = useMemo(() => buildInsights(LINE_MODEL, result.params, result), [result])

  return (
    <Panel title="Перегрузки и резервы" flush>
      {insights.length === 0 ? (
        <EmptyState icon={<CircleCheck />} title="Отклонений нет" description="Все участки работают в диапазоне 50–85 % загрузки." />
      ) : (
        <ul className="divide-y divide-line pb-1">
          {insights.map((ins) => {
            const def = getStage(ins.stageId)!
            return (
              <li key={ins.stageId} className="space-y-3 px-5 py-5 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-ink">{def.name}</p>
                  <StatusIndicator status={ins.status} variant="pill" />
                </div>
                <p className="text-13 text-muted">{ins.finding}</p>
                <p className="text-13 text-ink-2">{ins.recommendation}</p>
                <div className="flex flex-wrap gap-2">
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
