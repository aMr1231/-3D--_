import { X } from 'lucide-react'
import { useId } from 'react'
import { useSearchParams } from 'react-router'
import { Select } from '@/components/ui/Controls'
import { PageHeader } from '@/components/ui/Panel'
import { STAGES, getStage } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { useSimulation } from '@/hooks/useSimulation'
import { useScenarioStore } from '@/store/scenarios'
import { QueueProfileChart } from './QueueProfileChart'
import { ScenarioComparison } from './ScenarioComparison'
import { SensitivityTable } from './SensitivityTable'
import { CapacityChart, CostStructure, CycleBreakdownChart, UtilizationChart } from './StageCharts'

/** Расширенная аналитика. URL: ?scenario=<id>&stage=<участок для подсветки>. */
export default function AnalyticsPage() {
  const [search, setSearch] = useSearchParams()
  const scenarios = useScenarioStore((s) => s.scenarios)
  const scenarioId = search.get('scenario')
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios.find((s) => s.id === BASELINE_SCENARIO_ID)!
  const result = useSimulation(scenario.params)
  const stage = getStage(search.get('stage'))
  const highlight = stage?.id ?? null
  const scenarioSelectId = useId()
  const stageSelectId = useId()

  const update = (key: string, value: string | null) =>
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const constraint = STAGES.find((s) => s.id === result.constraintStageId)!

  return (
    <div className="mx-auto max-w-[1480px] space-y-4 p-4 md:p-6">
      <PageHeader
        title="Аналитика"
        description={
          <>
            Сценарий «{scenario.name}»: выпуск {formatNumber(result.outputPerDay, 0)} шт/сут, время цикла {formatDuration(result.cycleTimeMin)},
            себестоимость {formatRub(result.costPerUnit)}. Ограничение линии — {constraint.code} {constraint.name} ({formatPercent(result.constraintUtilization)}).
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface px-4 py-3" role="group" aria-label="Фильтры аналитики">
        <div>
          <label htmlFor={scenarioSelectId} className="mb-1 block text-2xs text-muted">
            Сценарий
          </label>
          <Select id={scenarioSelectId} size="sm" value={scenario.id} onChange={(e) => update('scenario', e.target.value === BASELINE_SCENARIO_ID ? null : e.target.value)} className="w-[240px]">
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor={stageSelectId} className="mb-1 block text-2xs text-muted">
            Выделить участок
          </label>
          <Select id={stageSelectId} size="sm" value={highlight ?? ''} onChange={(e) => update('stage', e.target.value || null)} className="w-[240px]">
            <option value="">Все участки</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} {s.name}
              </option>
            ))}
          </Select>
        </div>
        {highlight && (
          <button type="button" onClick={() => update('stage', null)} className="mb-1 flex items-center gap-1 text-xs text-muted hover:text-ink">
            <X className="size-3.5" aria-hidden /> Сбросить выделение
          </button>
        )}
        <p className="mb-1 ml-auto text-2xs text-faint">Фильтры применяются ко всем графикам и таблицам ниже</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CapacityChart result={result} highlight={highlight} />
        <UtilizationChart result={result} highlight={highlight} />
        <CycleBreakdownChart result={result} highlight={highlight} />
        <QueueProfileChart result={result} highlight={highlight} />
      </div>

      <SensitivityTable result={result} highlight={highlight} scenarioId={scenario.id} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ScenarioComparison scenarios={scenarios} selectedId={scenario.id} />
        <CostStructure result={result} highlight={highlight} />
      </div>
    </div>
  )
}
