import clsx from 'clsx'
import { Lock, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Delta } from '@/components/ui/Delta'
import { compareMetric } from '@/domain/metrics'
import { summarize } from '@/domain/simulation/engine'
import type { Scenario } from '@/domain/types'
import { BASELINE_RESULT, getSimulation } from '@/hooks/useSimulation'

interface ScenarioListProps {
  scenarios: Scenario[]
  selectedId: string
  dirty: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onReset: () => void
}

const KIND_LABEL = { baseline: 'База', preset: 'Демо', user: 'Мой' } as const

export function ScenarioList({ scenarios, selectedId, dirty, onSelect, onCreate, onReset }: ScenarioListProps) {
  const base = summarize(BASELINE_RESULT)
  const groups: { title: string; items: Scenario[] }[] = [
    { title: 'Базовый режим', items: scenarios.filter((s) => s.kind === 'baseline') },
    { title: 'Демонстрационные', items: scenarios.filter((s) => s.kind === 'preset') },
    { title: 'Мои сценарии', items: scenarios.filter((s) => s.kind === 'user') },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h2 className="text-13 font-semibold text-ink">Сценарии</h2>
        <Button size="xs" variant="secondary" icon={<Plus />} onClick={onCreate}>
          Новый
        </Button>
      </div>
      <nav aria-label="Список сценариев" className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-2 py-2.5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="label-caps px-2 pb-1">{g.title}</p>
            {g.items.length === 0 ? (
              <div className="mx-1 rounded-md border border-dashed border-line-strong px-3 py-3 text-xs text-muted">
                Своих сценариев пока нет. Нажмите «Новый» или измените параметры и сохраните как новый.
              </div>
            ) : (
              <ul className="space-y-0.5">
                {g.items.map((s) => {
                  const active = s.id === selectedId
                  const r = summarize(getSimulation(s.params))
                  const dOut = compareMetric('outputPerDay', base.outputPerDay, r.outputPerDay)
                  const dCycle = compareMetric('cycleTimeMin', base.cycleTimeMin, r.cycleTimeMin)
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(s.id)}
                        aria-current={active ? 'true' : undefined}
                        className={clsx(
                          'w-full rounded-md px-2.5 py-2 text-left transition-colors',
                          active ? 'bg-accent-soft ring-1 ring-accent-line' : 'hover:bg-subtle',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-13 font-medium text-ink">
                            {s.name}
                            {active && dirty && <span className="ml-1 text-warn" title="Есть несохранённые изменения">•</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-2xs text-faint">
                            {s.kind === 'baseline' && <Lock className="size-3" aria-label="только чтение" />}
                            {KIND_LABEL[s.kind]}
                          </span>
                        </span>
                        {s.kind !== 'baseline' && (
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-2xs text-muted">
                            <span className="flex items-center gap-1">
                              выпуск <Delta delta={dOut} showAbsolute={false} className="!text-2xs" />
                            </span>
                            <span className="flex items-center gap-1">
                              цикл <Delta delta={dCycle} showAbsolute={false} className="!text-2xs" />
                            </span>
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <div className="border-t border-line px-3 py-2.5">
        <Button size="xs" variant="ghost" icon={<RotateCcw />} onClick={onReset} className="text-muted">
          Сбросить демо-сценарии
        </Button>
      </div>
    </div>
  )
}
