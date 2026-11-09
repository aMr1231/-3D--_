import { History, SlidersHorizontal } from 'lucide-react'
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
      title="Последние расчёты сценариев"
      subtitle="Изменение к базовому режиму"
      flush
      actions={
        <ButtonLink to="/scenarios" size="xs" variant="ghost" icon={<SlidersHorizontal />}>
          Все сценарии
        </ButtonLink>
      }
    >
      {recent.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="Расчётов пока нет"
          description="Измените параметры линии в разделе «Сценарии» и запустите расчёт — результат появится здесь."
          action={
            <ButtonLink to="/scenarios" variant="primary" size="sm">
              Открыть сценарии
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {recent.map((run) => {
            const exists = scenarios.some((s) => s.id === run.scenarioId)
            const deltas = compareSummaries(run.baselineSummary, run.summary, ['cycleTimeMin', 'outputPerDay', 'costPerUnit'])
            const content = (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-13 font-medium text-ink">{run.scenarioName}</span>
                  <span className="shrink-0 text-2xs text-faint">{formatRelative(run.ranAt)}</span>
                </div>
                <dl className="mt-1.5 grid grid-cols-3 gap-2 text-2xs text-muted">
                  {[
                    ['Цикл', deltas[0]],
                    ['Выпуск', deltas[1]],
                    ['Себест.', deltas[2]],
                  ].map(([label, d]) => (
                    <div key={label as string}>
                      <dt>{label as string}</dt>
                      <dd>
                        <Delta delta={d as (typeof deltas)[number]} showAbsolute={false} />
                      </dd>
                    </div>
                  ))}
                </dl>
                {!exists && <p className="mt-1 text-2xs text-faint">Сценарий удалён</p>}
              </>
            )
            return (
              <li key={run.id}>
                {exists ? (
                  <Link to={`/scenarios?id=${run.scenarioId}`} className="block px-4 py-3 hover:bg-subtle/60">
                    {content}
                  </Link>
                ) : (
                  <div className="px-4 py-3 opacity-70">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
