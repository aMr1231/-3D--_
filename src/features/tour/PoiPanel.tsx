import { ArrowRight, ChartColumn, ChevronLeft, ChevronRight, SlidersHorizontal, Workflow } from 'lucide-react'
import { ButtonLink, Button } from '@/components/ui/Button'
import { SidePanel } from '@/components/ui/SidePanel'
import { StageCode, StatusIndicator } from '@/components/ui/Status'
import { getStage } from '@/data/demo/enterprise'
import { TOUR_ROUTE } from '@/data/demo/tour'
import { formatDuration, formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import type { PoiMetricKey, PointOfInterest, SimulationResult } from '@/domain/types'

interface PoiPanelProps {
  poi: PointOfInterest
  result: SimulationResult
  scenarioName: string
  canOpenTwin: boolean
  routeMode: boolean
  onClose: () => void
  onStep: (dir: -1 | 1) => void
}

const FINANCIAL: PoiMetricKey[] = ['costPerUnit']

/** Карточка точки интереса: рассказ для экскурсии + живые метрики модели + кейс + переход к процессу. */
export function PoiPanel({ poi, result, scenarioName, canOpenTwin, routeMode, onClose, onStep }: PoiPanelProps) {
  const def = getStage(poi.stageId)
  const s = poi.stageId ? result.stages.find((x) => x.stageId === poi.stageId) : undefined
  const p = poi.stageId ? result.params.stages[poi.stageId] : undefined
  const index = TOUR_ROUTE.stops.indexOf(poi.id)
  const metrics = poi.metrics.filter((m) => m !== 'status' && (canOpenTwin || !FINANCIAL.includes(m)))

  const metricValue = (m: PoiMetricKey): { label: string; value: string } | null => {
    if (!s || !p || !def) return null
    switch (m) {
      case 'utilization':
        return { label: 'Загрузка', value: formatPercent(s.utilization) }
      case 'capacity':
        return { label: 'Мощность', value: `${formatNumber(s.capacityPerHour, 1)} шт/ч` }
      case 'throughput':
        return { label: 'Производительность', value: `${formatNumber(s.processedPerHour, 1)} шт/ч` }
      case 'wait':
        return { label: 'Ожидание', value: formatDuration(s.waitMin) }
      case 'resources':
        return { label: 'Ресурсы', value: `${p.resources} ${plural(p.resources, def.resourceKind)}` }
      case 'costPerUnit':
        return { label: 'Операция', value: `${formatRub(s.costPerUnit)}/шт` }
      default:
        return null
    }
  }

  const c = poi.practiceCase
  const caseDelta = c ? c.metric.after - c.metric.before : 0
  const caseShare = c && c.metric.before !== 0 ? Math.abs(caseDelta / c.metric.before) : 0

  return (
    <SidePanel
      open
      onClose={onClose}
      label={`Точка интереса: ${poi.title}`}
      compactMobile
      onSwipe={routeMode ? onStep : undefined}
      eyebrow={
        <>
          <span className="text-2xs font-medium text-muted">
            Остановка {index + 1} из {TOUR_ROUTE.stops.length}
          </span>
          {def && <StageCode>{def.code}</StageCode>}
          {s && canOpenTwin && <StatusIndicator status={s.status} variant="pill" />}
        </>
      }
      title={poi.title}
      headerExtra={<p className="text-xs text-muted">{poi.subtitle}</p>}
      footer={
        <div className="space-y-2">
          {poi.stageId && canOpenTwin && (
            <div className="grid grid-cols-3 gap-1.5">
              <ButtonLink to={`/twin?stage=${poi.stageId}`} size="sm" variant="primary" icon={<Workflow />} className="px-1.5">
                Процесс
              </ButtonLink>
              <ButtonLink to={`/analytics?stage=${poi.stageId}`} size="sm" variant="secondary" icon={<ChartColumn />} className="px-1.5">
                Метрики
              </ButtonLink>
              <ButtonLink to={`/scenarios?focus=${poi.stageId}`} size="sm" variant="secondary" icon={<SlidersHorizontal />} className="px-1.5">
                Сценарий
              </ButtonLink>
            </div>
          )}
          {routeMode && (
            <div className="flex items-center justify-between gap-2">
              <Button size="sm" variant="ghost" icon={<ChevronLeft />} onClick={() => onStep(-1)} disabled={index <= 0}>
                Назад
              </Button>
              <span className="tnum text-xs text-muted">
                {index + 1} / {TOUR_ROUTE.stops.length}
              </span>
              <Button size="sm" variant="secondary" onClick={() => onStep(1)} disabled={index >= TOUR_ROUTE.stops.length - 1}>
                Далее <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4 px-4 py-3.5">
        <p className="text-13 leading-relaxed text-ink-2">{poi.description}</p>

        {s && metrics.length > 0 && (
          <section aria-labelledby="poi-metrics">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <h3 id="poi-metrics" className="label-caps">
                Показатели участка
              </h3>
              <span className="truncate text-2xs text-faint" title={scenarioName}>
                модель · {scenarioName}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
              {metrics.map((m) => {
                const v = metricValue(m)
                if (!v) return null
                return (
                  <div key={m} className="bg-surface px-3 py-2">
                    <dt className="text-2xs text-muted">{v.label}</dt>
                    <dd className="tnum mt-0.5 text-13 font-semibold text-ink">{v.value}</dd>
                  </div>
                )
              })}
            </dl>
          </section>
        )}

        {!poi.stageId && (
          <section>
            <h3 className="label-caps mb-1.5">Линия сегодня</h3>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
              <div className="bg-surface px-3 py-2">
                <dt className="text-2xs text-muted">Выпуск</dt>
                <dd className="tnum mt-0.5 text-13 font-semibold text-ink">{formatNumber(result.outputPerDay, 0)} шт/сут</dd>
              </div>
              <div className="bg-surface px-3 py-2">
                <dt className="text-2xs text-muted">Время цикла</dt>
                <dd className="tnum mt-0.5 text-13 font-semibold text-ink">{formatDuration(result.cycleTimeMin)}</dd>
              </div>
            </dl>
          </section>
        )}

        <section>
          <h3 className="label-caps mb-1.5">Факты</h3>
          <ul className="space-y-1 text-13 text-ink-2">
            {poi.facts.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </section>

        {c && (
          <section aria-labelledby={`case-${c.id}`} className="rounded-md border border-line">
            <div className="flex items-center justify-between gap-2 border-b border-line bg-subtle/70 px-3 py-1.5">
              <h3 id={`case-${c.id}`} className="text-xs font-semibold text-ink">
                Лучшая практика
              </h3>
              <span className="rounded-[3px] border border-warn-mark/40 bg-warn-soft px-1.5 text-2xs text-warn">демо-кейс</span>
            </div>
            <div className="space-y-2 px-3 py-2.5">
              <p className="text-13 font-medium text-ink">{c.title}</p>
              <p className="text-xs text-muted">{c.summary}</p>
              <div className="flex items-center gap-2 rounded-md bg-subtle px-2.5 py-2 text-xs">
                <span className="text-muted">{c.metric.label}</span>
                <span className="ml-auto tnum text-muted line-through decoration-faint">
                  {formatNumber(c.metric.before, c.metric.before % 1 ? 1 : 0)} {c.metric.unit}
                </span>
                <ArrowRight className="size-3 text-faint" aria-hidden />
                <span className="tnum font-semibold text-ink">
                  {formatNumber(c.metric.after, c.metric.after % 1 ? 1 : 0)} {c.metric.unit}
                </span>
                <span className={(c.metric.lowerIsBetter ? caseDelta < 0 : caseDelta > 0) ? 'tnum font-medium text-ok' : 'tnum font-medium text-crit'}>
                  {caseDelta < 0 ? '−' : '+'}
                  {formatPercent(caseShare)}
                </span>
              </div>
            </div>
          </section>
        )}

        {!canOpenTwin && poi.stageId && (
          <p className="rounded-md bg-subtle px-3 py-2 text-xs text-muted">
            Показатели рассчитаны цифровым двойником линии. Подробный анализ процесса доступен сотрудникам предприятия.
          </p>
        )}
      </div>
    </SidePanel>
  )
}
