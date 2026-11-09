import clsx from 'clsx'
import { Lock, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Delta } from '@/components/ui/Delta'
import { OverflowMenu } from '@/components/ui/Menu'
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

export function ScenarioList({ scenarios, selectedId, dirty, onSelect, onCreate, onReset }: ScenarioListProps) {
  const base = summarize(BASELINE_RESULT)
  const groups: { title: string; items: Scenario[] }[] = [
    { title: 'Базовый режим', items: scenarios.filter((s) => s.kind === 'baseline') },
    { title: 'Демонстрационные', items: scenarios.filter((s) => s.kind === 'preset') },
    { title: 'Мои сценарии', items: scenarios.filter((s) => s.kind === 'user') },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-3">
        <h2 className="text-15 font-semibold text-ink">Сценарии</h2>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="secondary" icon={<Plus />} onClick={onCreate}>
            Новый
          </Button>
          <OverflowMenu
            label="Действия со списком сценариев"
            items={[{ key: 'reset', label: 'Сбросить демо-сценарии', icon: <RotateCcw />, tone: 'danger', onSelect: onReset }]}
          />
        </div>
      </div>
      <nav aria-label="Список сценариев" className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-2 pt-2 pb-6">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-2.5 pb-1.5 text-13 font-medium text-faint">{g.title}</p>
            {g.items.length === 0 ? (
              <p className="px-2.5 py-1 text-13 text-muted">Пока нет — нажмите «Новый».</p>
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
                        className={clsx('w-full rounded-lg px-2.5 py-2 text-left transition-colors', active ? 'bg-sunken' : 'hover:bg-subtle')}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">{s.name}</span>
                          {active && dirty && (
                            <span className="size-2 shrink-0 rounded-full bg-warn-mark" title="Есть несохранённые изменения">
                              <span className="sr-only">Есть несохранённые изменения</span>
                            </span>
                          )}
                          {s.kind === 'baseline' && !(active && dirty) && <Lock className="size-3.5 shrink-0 text-faint" aria-label="Только чтение" />}
                        </span>
                        {s.kind !== 'baseline' && (
                          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-13 text-muted">
                            <span className="flex items-center gap-1">
                              выпуск <Delta delta={dOut} showAbsolute={false} />
                            </span>
                            <span className="flex items-center gap-1">
                              цикл <Delta delta={dCycle} showAbsolute={false} />
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
    </div>
  )
}
