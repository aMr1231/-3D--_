import clsx from 'clsx'
import { X } from 'lucide-react'
import { useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { SegmentedControl, Select } from '@/components/ui/Controls'
import { Page, PageHeader } from '@/components/ui/Panel'
import { STATUS_TEXT } from '@/components/ui/Status'
import { STAGES, getStage } from '@/data/demo/enterprise'
import { HISTORY } from '@/data/demo/history'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { useSimulation } from '@/hooks/useSimulation'
import { useScenarioStore } from '@/store/scenarios'
import { PerformanceTrend } from '../dashboard/PerformanceTrend'
import { RecentRuns } from '../dashboard/RecentRuns'
import { AnalyticsInfo } from './AnalyticsInfo'
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
  const [period, setPeriod] = useState<'7' | '14' | '30'>('14')

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
  const constraintStatus = result.stages.find((s) => s.stageId === result.constraintStageId)!.status

  const stats = [
    { label: 'Выпуск', value: formatNumber(result.outputPerDay, 0), unit: 'шт/сут' },
    { label: 'Время цикла', value: formatDuration(result.cycleTimeMin) },
    { label: 'Себестоимость', value: formatRub(result.costPerUnit) },
    { label: 'Ограничение', value: constraint.shortName, extra: formatPercent(result.constraintUtilization) },
  ]

  return (
    <Page>
      <PageHeader
        title="Аналитика"
        actions={
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Фильтры аналитики">
            <label htmlFor={scenarioSelectId} className="sr-only">
              Сценарий
            </label>
            <Select
              id={scenarioSelectId}
              value={scenario.id}
              onChange={(e) => update('scenario', e.target.value === BASELINE_SCENARIO_ID ? null : e.target.value)}
              className="w-full sm:w-[220px]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <label htmlFor={stageSelectId} className="sr-only">
              Выделить участок
            </label>
            <Select id={stageSelectId} value={highlight ?? ''} onChange={(e) => update('stage', e.target.value || null)} className="w-full sm:w-[200px]">
              <option value="">Все участки</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {highlight && (
              <Button variant="ghost" size="icon" onClick={() => update('stage', null)} aria-label="Сбросить выделение участка" title="Сбросить выделение">
                <X />
              </Button>
            )}
          </div>
        }
      />

      <section aria-label="Сводка сценария" className="rounded-xl border border-line bg-surface p-5 md:p-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 sm:gap-y-6 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex min-w-0 items-baseline justify-between gap-4 sm:block">
              <dt className="truncate text-meta text-muted">{s.label}</dt>
              <dd className="flex items-baseline gap-2 whitespace-nowrap sm:mt-2">
                <span className="tnum text-xl font-semibold text-ink sm:text-kpi">{s.value}</span>
                {s.unit && <span className="text-sm text-muted">{s.unit}</span>}
                {s.extra && <span className={clsx('tnum text-sm font-medium', STATUS_TEXT[constraintStatus])}>{s.extra}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <PerformanceTrend
        history={HISTORY.slice(-Number(period))}
        actions={
          <SegmentedControl
            label="Период"
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7', label: '7 дн.' },
              { value: '14', label: '14 дн.' },
              { value: '30', label: '30 дн.' },
            ]}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CapacityChart result={result} highlight={highlight} />
        <UtilizationChart result={result} highlight={highlight} />
        <CycleBreakdownChart result={result} highlight={highlight} />
        <QueueProfileChart result={result} highlight={highlight} />
      </div>

      <SensitivityTable result={result} highlight={highlight} scenarioId={scenario.id} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ScenarioComparison scenarios={scenarios} selectedId={scenario.id} />
        <CostStructure result={result} highlight={highlight} />
      </div>

      <RecentRuns />
      <AnalyticsInfo result={result} scenarioName={scenario.name} scenarioCount={scenarios.length} />
    </Page>
  )
}
