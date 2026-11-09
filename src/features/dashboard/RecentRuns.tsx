import { History } from 'lucide-react'
import { Link } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { Delta } from '@/components/ui/Delta'
import { EmptyState } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { formatRelative } from '@/domain/format'
import { compareSummaries } from '@/domain/metrics'
import { useScenarioStore } from '@/store/scenarios'

/** Последние прогоны сценариев с изменениями к базовому режиму. */
export function RecentRuns() {
  const runs = useScenarioStore((s) => s.runs)
  const scenarios = useScenarioStore((s) => s.scenarios)
  const recent = runs.slice(0, 5)

  return (
    <Panel
      title="Последние расчёты"
      flush
      actions={
        <ButtonLink to="/scenarios" size="xs" variant="ghost">
          Все сценарии
        </ButtonLink>
      }
    >
      {recent.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Расчётов пока нет"
          description="Запустите расчёт в разделе «Сценарии» — результат появится здесь."
          action={
            <ButtonLink to="/scenarios" variant="primary" size="sm">
              Открыть сценарии
            </ButtonLink>
          }
        />
      ) : (
        <ul className="px-2 pb-2">
          {recent.map((run) => {
            const exists = scenarios.some((s) => s.id === run.scenarioId)
            const deltas = compareSummaries(run.baselineSummary, run.summary, ['cycleTimeMin', 'outputPerDay', 'costPerUnit'])
            const content = (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-ink">{run.scenarioName}</span>
                  <span className="shrink-0 text-meta text-faint">
                    {formatRelative(run.ranAt)}
                    {!exists && ' · удалён'}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-3 text-meta text-muted">
                  {[
                    ['Цикл', deltas[0]],
                    ['Выпуск', deltas[1]],
                    ['Себест.', deltas[2]],
                  ].map(([label, d]) => (
                    <div key={label as string} className="min-w-0">
                      <dt>{label as string}</dt>
                      <dd className="mt-0.5">
                        <Delta delta={d as (typeof deltas)[number]} showAbsolute={false} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            )
            return (
              <li key={run.id}>
                {exists ? (
                  <Link to={`/scenarios?id=${run.scenarioId}`} className="block rounded-lg px-3 py-3 hover:bg-subtle">
                    {content}
                  </Link>
                ) : (
                  <div className="px-3 py-3 opacity-60">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
