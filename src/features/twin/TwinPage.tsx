import { List, Network, TriangleExclamationPoint, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScenarioPicker } from '@/components/ScenarioPicker'
import { Button } from '@/components/ui/Button'
import { CanvasHeader } from '@/components/ui/Panel'
import { SegmentedControl } from '@/components/ui/Controls'
import { Delta } from '@/components/ui/Delta'
import { STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { getStage } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { compareSummaries, type MetricKey } from '@/domain/metrics'
import { summarize } from '@/domain/simulation/engine'
import { BASELINE_RESULT, useSimulation } from '@/hooks/useSimulation'
import { useActiveScenario } from '@/store/scenarios'
import { LAYERS, type TwinLayer } from './layers'
import { ProcessFlow } from './ProcessFlow'
import { StageDetails } from './StageDetails'
import { StageList } from './StageList'
import { TwinInfo } from './TwinInfo'

export default function TwinPage() {
  const [search, setSearch] = useSearchParams()
  const [view, setView] = useState<'flow' | 'list'>(() => (window.matchMedia('(max-width: 767px)').matches ? 'list' : 'flow'))
  const [layer, setLayer] = useState<TwinLayer>('utilization')

  const scenario = useActiveScenario()
  const result = useSimulation(scenario.params)
  const isBaseline = scenario.id === BASELINE_SCENARIO_ID

  const stageParam = search.get('stage')
  const selectedDef = getStage(stageParam)
  const unknownStage = stageParam && !selectedDef ? stageParam : null

  const select = useCallback(
    (id: string | null) => {
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('stage', id)
          else next.delete('stage')
          return next
        },
        { replace: true },
      )
    },
    [setSearch],
  )

  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const CIcon = STATUS_ICON[constraint.status]
  const deltas = isBaseline ? null : compareSummaries(summarize(BASELINE_RESULT), summarize(result), ['outputPerDay', 'cycleTimeMin', 'costPerUnit'])
  const deltaFor = (k: MetricKey) => deltas?.find((d) => d.key === k)

  const summary = [
    { key: 'outputPerDay' as const, label: 'Выпуск', value: `${formatNumber(result.outputPerDay, 0)} шт/сут` },
    { key: 'cycleTimeMin' as const, label: 'Время цикла', value: formatDuration(result.cycleTimeMin) },
    { key: 'costPerUnit' as const, label: 'Себестоимость', value: formatRub(result.costPerUnit) },
  ]

  return (
    <div className="flex h-full flex-col">
      <CanvasHeader
        title="Цифровой двойник"
        controls={
          <>
            <ScenarioPicker className="w-full sm:w-[220px]" />
            <SegmentedControl
              label="Показатель на схеме"
              value={layer}
              onChange={setLayer}
              options={(Object.keys(LAYERS) as TwinLayer[]).map((k) => ({ value: k, label: LAYERS[k].label }))}
            />
            <SegmentedControl
              label="Вид схемы"
              value={view}
              onChange={setView}
              options={[
                { value: 'flow', label: <span className="sr-only">Схема</span>, icon: <Network />, title: 'Схема' },
                { value: 'list', label: <span className="sr-only">Список</span>, icon: <List />, title: 'Список' },
              ]}
            />
          </>
        }
      >
        <dl className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CIcon className={`size-4 ${STATUS_TEXT[constraint.status]}`} aria-hidden />
            <dt className="text-muted">Ограничение</dt>
            <dd className="font-medium text-ink">
              {constraintDef.shortName} <span className={`tnum ${STATUS_TEXT[constraint.status]}`}>{formatPercent(constraint.utilization)}</span>
            </dd>
          </div>
          {summary.map((m) => {
            const d = deltaFor(m.key)
            return (
              <div key={m.key} className="hidden items-center gap-2 sm:flex">
                <dt className="text-muted">{m.label}</dt>
                <dd className="tnum font-medium text-ink">{m.value}</dd>
                {d && <Delta delta={d} showAbsolute={false} />}
              </div>
            )
          })}
        </dl>
      </CanvasHeader>

      <div className="relative min-h-0 flex-1">
        {unknownStage && (
          <div role="alert" className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-warn-mark/50 bg-warn-soft px-3 py-2 text-sm text-warn shadow-overlay">
            <TriangleExclamationPoint className="size-4" aria-hidden />
            Участок «{unknownStage}» не найден в модели.
            <Button size="xs" variant="ghost" onClick={() => select(null)} icon={<X />}>
              Сбросить
            </Button>
          </div>
        )}

        {view === 'flow' ? (
          <div className="absolute inset-0">
            <ProcessFlow result={result} layer={layer} selectedStageId={selectedDef?.id ?? null} onSelect={select} />
          </div>
        ) : (
          <div className="scrollbar-thin absolute inset-0 overflow-y-auto bg-canvas">
            <StageList result={result} layer={layer} selectedStageId={selectedDef?.id ?? null} onSelect={(id) => select(id)} />
          </div>
        )}

        {selectedDef && <StageDetails key={selectedDef.id} def={selectedDef} result={result} onClose={() => select(null)} />}
      </div>
      <TwinInfo result={result} scenarioName={isBaseline ? null : scenario.name} layer={layer} />
    </div>
  )
}
