import clsx from 'clsx'
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { Panel } from '@/components/ui/Panel'
import { LINE_MODEL } from '@/data/demo/enterprise'
import { COMPARISON_METRICS, METRICS } from '@/domain/metrics'
import { summarize } from '@/domain/simulation/engine'
import type { Scenario } from '@/domain/types'
import { getSimulation } from '@/hooks/useSimulation'

/** Сравнение всех сохранённых сценариев: лучший вариант по каждой метрике отмечен. */
export function ScenarioComparison({ scenarios, selectedId }: { scenarios: Scenario[]; selectedId: string }) {
  const columns = scenarios.map((s) => {
    const r = getSimulation(s.params)
    const sum = summarize(r)
    const constraint = LINE_MODEL.stages.find((d) => d.id === r.constraintStageId)!
    return { scenario: s, sum, constraint }
  })

  return (
    <Panel
      title="Сравнение сценариев"
      flush
    >
      <div className="scrollbar-thin overflow-x-auto pb-2">
        <table className="w-full text-meta" style={{ minWidth: 220 + columns.length * 150 }}>
          <caption className="sr-only">Показатели сохранённых сценариев</caption>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="sticky left-0 z-10 w-[220px] bg-surface px-5 py-3 text-left font-medium md:px-6">Показатель</th>
              {columns.map(({ scenario }) => (
                <th
                  key={scenario.id}
                  scope="col"
                  className={clsx('px-3 py-3 text-right align-bottom font-medium', scenario.id === selectedId && 'bg-accent-soft text-ink')}
                >
                  <Link to={`/scenarios?id=${scenario.id}`} className="hover:text-accent">
                    {scenario.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_METRICS.map((key) => {
              const def = METRICS[key]
              const values = columns.map((c) => c.sum[key])
              const best =
                def.direction === 'neutral' ? null : def.direction === 'lower' ? Math.min(...values) : Math.max(...values)
              const allSame = values.every((v) => Math.abs(v - values[0]) < 1e-6)
              const max = Math.max(...values.map(Math.abs), 1e-9)
              return (
                <tr key={key} className="border-b border-line last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-surface px-5 py-2.5 text-left text-meta font-normal text-ink-2 md:px-6">
                    {def.label}
                  </th>
                  {columns.map((c, i) => {
                    const v = values[i]
                    const isBest = best !== null && !allSame && Math.abs(v - best) < 1e-6
                    return (
                      <td key={c.scenario.id} className={clsx('px-3 py-2 text-right', c.scenario.id === selectedId && 'bg-accent-soft/50')}>
                        <div className="flex items-center justify-end gap-1">
                          {isBest && <Check className="size-3.5 text-ok" aria-label="лучшее значение" />}
                          <span className={clsx('tnum text-meta whitespace-nowrap', isBest ? 'font-semibold text-ink' : 'text-ink-2')}>{def.format(v)}</span>
                        </div>
                        <div className="mt-1 ml-auto h-[3px] w-full max-w-[110px] rounded-full bg-sunken">
                          <div className="ml-auto h-full rounded-full bg-data-base" style={{ width: `${(Math.abs(v) / max) * 100}%` }} />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-surface px-5 py-2.5 text-left text-meta font-normal text-ink-2 md:px-6">
                Ограничение линии
              </th>
              {columns.map((c) => (
                <td key={c.scenario.id} className={clsx('px-3 py-2.5 text-right text-meta text-ink-2', c.scenario.id === selectedId && 'bg-accent-soft/50')}>
                  {c.constraint.shortName}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
