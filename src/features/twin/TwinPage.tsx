import { List, Network, TriangleExclamationPoint, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScenarioPicker } from '@/components/ScenarioPicker'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { Delta } from '@/components/ui/Delta'
import { STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { getStage } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { compareSummaries, type MetricKey } from '@/domain/metrics'
import { summarize } from '@/domain/simulation/engine'
import { STATUS_META } from '@/domain/status'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { BASELINE_RESULT, useSimulation } from '@/hooks/useSimulation'
import { useActiveScenario } from '@/store/scenarios'
import { LAYERS, type TwinLayer } from './layers'
import { ProcessFlow } from './ProcessFlow'
import { StageDetails } from './StageDetails'
import { StageList } from './StageList'

export default function TwinPage() {
  const [search, setSearch] = useSearchParams()
  const isMobile = useIsMobile()
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
      <div className="shrink-0 space-y-3 border-b border-line bg-surface px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink sm:text-xl">Цифровой двойник</h1>
            <p className="hidden text-13 text-muted sm:block">
              Мнемосхема линии: {isBaseline ? 'базовый режим' : `сценарий «${scenario.name}»`}. Выберите участок, чтобы открыть паспорт.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <ScenarioPicker className="w-full sm:w-[220px]" />
            <div>
              <span className="mb-1 block text-2xs text-muted max-sm:sr-only">Слой</span>
              <SegmentedControl
                label="Показатель на схеме"
                value={layer}
                onChange={setLayer}
                options={(Object.keys(LAYERS) as TwinLayer[]).map((k) => ({ value: k, label: LAYERS[k].label, title: LAYERS[k].hint }))}
              />
            </div>
            <div>
              <span className="mb-1 block text-2xs text-muted max-sm:sr-only">Вид</span>
              <SegmentedControl
                label="Вид схемы"
                value={view}
                onChange={setView}
                options={[
                  { value: 'flow', label: 'Схема', icon: <Network /> },
                  { value: 'list', label: 'Список', icon: <List /> },
                ]}
              />
            </div>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-13">
          <div className="flex items-center gap-2">
            <CIcon className={`size-4 ${STATUS_TEXT[constraint.status]}`} aria-hidden />
            <dt className="text-muted">Ограничение линии</dt>
            <dd className="font-medium text-ink">
              {constraintDef.code} {constraintDef.shortName} · {formatPercent(constraint.utilization)}
              <span className="ml-1 font-normal text-muted">({STATUS_META[constraint.status].label.toLowerCase()})</span>
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
          {!isBaseline && <span className="hidden text-2xs text-faint sm:inline">изменения — к базовому режиму</span>}
        </dl>
      </div>

      <div className="relative min-h-0 flex-1">
        {unknownStage && (
          <div role="alert" className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md border border-warn-mark/50 bg-warn-soft px-3 py-2 text-13 text-warn shadow-sm">
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
            {!isMobile && <TwinLegend layer={layer} />}
          </div>
        ) : (
          <div className="scrollbar-thin absolute inset-0 overflow-y-auto bg-canvas">
            <StageList result={result} layer={layer} selectedStageId={selectedDef?.id ?? null} onSelect={(id) => select(id)} />
          </div>
        )}

        {selectedDef && <StageDetails key={selectedDef.id} def={selectedDef} result={result} onClose={() => select(null)} />}
      </div>
    </div>
  )
}

function TwinLegend({ layer }: { layer: TwinLayer }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[260px] rounded-md border border-line bg-surface/95 px-3 py-2.5 text-2xs text-muted shadow-sm">
      <p className="mb-1.5 font-medium text-ink-2">Обозначения</p>
      <ul className="space-y-1">
        {(['bottleneck', 'high', 'normal', 'idle'] as const).map((st) => {
          const Icon = STATUS_ICON[st]
          return (
            <li key={st} className="flex items-center gap-1.5">
              <Icon className={`size-3.5 ${STATUS_TEXT[st]}`} aria-hidden /> {STATUS_META[st].label}
            </li>
          )
        })}
        <li className="flex items-center gap-1.5 pt-1">
          <span className="h-[3px] w-4 rounded bg-[#8a95a1]" aria-hidden /> поток, шт/ч; толщина — очередь
        </li>
        {layer !== 'utilization' && (
          <li className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded bg-data-1" aria-hidden /> {LAYERS[layer].label.toLowerCase()} к максимуму по линии
          </li>
        )}
      </ul>
    </div>
  )
}
