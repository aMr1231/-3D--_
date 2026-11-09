import { Footprints, Hand, LocateFixed, MousePointerClick, Route, TriangleExclamationPoint, X } from 'lucide-react'
import { lazy, Suspense, useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScenarioPicker } from '@/components/ScenarioPicker'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { PageSkeleton } from '@/components/ui/Feedback'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { TOUR_ROUTE, getPoi, poiForStage } from '@/data/demo/tour'
import { useIsMobile, usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { BASELINE_RESULT, useSimulation } from '@/hooks/useSimulation'
import { useAuthStore } from '@/store/auth'
import { BASELINE_SCENARIO, useActiveScenario } from '@/store/scenarios'
import { FloorPlan } from './FloorPlan'
import { PoiPanel } from './PoiPanel'
import { SceneBoundary, detectWebGL } from './SceneBoundary'

const FactoryScene = lazy(() => import('./scene/FactoryScene').then((m) => ({ default: m.FactoryScene })))

type Mode = 'free' | 'route'

/**
 * 3D-тур. URL: ?poi=<точка интереса или id участка>.
 * Связь «объект 3D → процесс → метрика»: клик по зоне или метке открывает карточку с живыми метриками
 * модели и переходами в двойник, аналитику и сценарии.
 */
export default function TourPage() {
  const [search, setSearch] = useSearchParams()
  const role = useAuthStore((s) => s.user?.role ?? 'guest')
  const isManager = role === 'manager'
  const active = useActiveScenario()
  const scenario = isManager ? active : BASELINE_SCENARIO
  const result = useSimulation(scenario.params)
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()

  const [webgl] = useState(detectWebGL)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<Mode>('free')
  const [nonce, setNonce] = useState(0)

  const poiParam = search.get('poi')
  const poi = getPoi(poiParam) ?? (poiParam ? poiForStage(poiParam) : undefined)
  const unknownPoi = poiParam && !poi ? poiParam : null

  const selectPoi = useCallback(
    (id: string | null) => {
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('poi', id)
          else next.delete('poi')
          return next
        },
        { replace: true },
      )
    },
    [setSearch],
  )

  const selectStage = useCallback((stageId: string) => selectPoi(poiForStage(stageId)?.id ?? null), [selectPoi])

  const step = (dir: -1 | 1) => {
    const i = poi ? TOUR_ROUTE.stops.indexOf(poi.id) : -1
    const next = TOUR_ROUTE.stops[Math.min(Math.max(i + dir, 0), TOUR_ROUTE.stops.length - 1)]
    selectPoi(next)
  }

  const changeMode = (m: Mode) => {
    setMode(m)
    if (m === 'route' && !poi) selectPoi(TOUR_ROUTE.stops[0])
  }

  const speedRatio = BASELINE_RESULT.outputPerHour > 0 ? result.outputPerHour / BASELINE_RESULT.outputPerHour : 1
  const fallback = (reason: string) => (
    <div className="scrollbar-thin flex h-full flex-col items-center justify-center gap-4 overflow-auto bg-subtle p-4">
      <p className="flex max-w-[560px] items-start gap-2 rounded-md border border-warn-mark/40 bg-warn-soft px-3 py-2 text-xs text-warn" role="status">
        <TriangleExclamationPoint className="mt-px size-3.5 shrink-0" aria-hidden />
        {reason} Показан план цеха — точки интереса, метрики и переходы работают так же.
      </p>
      <div className="w-full max-w-[860px] rounded-lg border border-line bg-surface p-3">
        <FloorPlan result={result} selectedPoiId={poi?.id ?? null} onSelect={selectPoi} showStatus={isManager} />
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line bg-surface px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink sm:text-xl">3D-тур по производству</h1>
            <p className="hidden text-13 text-muted sm:block">
              {isManager
                ? 'Цех №1 в объёме: выберите участок или метку — откроются живые метрики двойника и переход к процессу.'
                : 'Виртуальная экскурсия по линии выпуска корпусов редукторов.'}
            </p>
          </div>
          <div className="flex w-full flex-nowrap items-end gap-2 sm:w-auto sm:flex-wrap">
            {isManager && <ScenarioPicker className="min-w-0 flex-1 sm:w-[220px] sm:flex-none" />}
            <div className="shrink-0">
              <span className="mb-1 block text-2xs text-muted max-sm:sr-only">Режим</span>
              <SegmentedControl
                label="Режим тура"
                value={mode}
                onChange={changeMode}
                options={[
                  { value: 'free', label: <span className="max-sm:sr-only">Свободный осмотр</span>, icon: <Hand />, title: 'Свободный осмотр' },
                  { value: 'route', label: <span className="max-sm:sr-only">Маршрут</span>, icon: <Route />, title: 'Маршрут экскурсии' },
                ]}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<LocateFixed />}
              aria-label="Общий вид"
              title="Общий вид"
              className="shrink-0"
              onClick={() => {
                selectPoi(null)
                setNonce((n) => n + 1)
              }}
            >
              <span className="max-sm:hidden">Общий вид</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-[#e9ecef]">
        {unknownPoi && (
          <div role="alert" className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md border border-warn-mark/50 bg-warn-soft px-3 py-2 text-13 text-warn shadow-sm">
            <TriangleExclamationPoint className="size-4" aria-hidden />
            Точка «{unknownPoi}» не найдена.
            <Button size="xs" variant="ghost" onClick={() => selectPoi(null)} icon={<X />}>
              Сбросить
            </Button>
          </div>
        )}

        {!webgl ? (
          fallback('Браузер или устройство не поддерживает WebGL.')
        ) : (
          <SceneBoundary fallback={() => fallback('Не удалось инициализировать 3D-сцену.')}>
            <Suspense fallback={<PageSkeleton variant="canvas" />}>
              <div className="absolute inset-0">
                <FactoryScene
                  result={result}
                  view={poi?.view ?? null}
                  viewNonce={nonce}
                  selectedPoiId={poi?.id ?? null}
                  selectedStageId={poi?.stageId ?? null}
                  onSelectPoi={selectPoi}
                  onSelectStage={selectStage}
                  onReady={() => setReady(true)}
                  isMobile={isMobile}
                  reducedMotion={reducedMotion}
                  speedRatio={speedRatio}
                  showStatus={isManager}
                  panelOpen={!!poi}
                />
              </div>
            </Suspense>
            {!ready && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <PageSkeleton variant="canvas" />
              </div>
            )}
          </SceneBoundary>
        )}

        {webgl && ready && (
          <>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden max-w-[300px] -translate-x-1/2 data-[hidden=true]:!hidden rounded-md border border-line bg-surface/90 px-3 py-2 text-2xs text-muted md:block" data-hidden={!!poi || mode === 'route'}>
              <p className="flex items-center gap-1.5">
                <MousePointerClick className="size-3.5" aria-hidden /> Клик по зоне или метке — карточка участка
              </p>
              <p className="mt-0.5">Вращение — левая кнопка · сдвиг — правая · масштаб — колесо</p>
            </div>
            <div className="absolute bottom-3 left-3 z-10 hidden w-[300px] rounded-lg border border-line bg-surface/95 p-2 shadow-sm lg:block">
              <p className="mb-1 flex items-center justify-between px-1 text-2xs text-muted">
                <span>План цеха · {TOUR_ROUTE.stops.length} точек</span>
                {isManager && scenario.id !== BASELINE_SCENARIO_ID && <span className="truncate text-accent">{scenario.name}</span>}
              </p>
              <FloorPlan result={result} selectedPoiId={poi?.id ?? null} onSelect={selectPoi} showStatus={isManager} compact />
            </div>
            {mode === 'route' && !poi && (
              <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
                <Button variant="primary" icon={<Footprints />} onClick={() => selectPoi(TOUR_ROUTE.stops[0])}>
                  Начать маршрут
                </Button>
              </div>
            )}
          </>
        )}

        {poi && (
          <PoiPanel
            key={poi.id}
            poi={poi}
            result={result}
            scenarioName={scenario.name}
            canOpenTwin={isManager}
            routeMode={mode === 'route'}
            onClose={() => selectPoi(null)}
            onStep={step}
          />
        )}
      </div>
    </div>
  )
}
