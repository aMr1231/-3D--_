import clsx from 'clsx'
import { Calculator, Copy, Lock, Pencil, RotateCcw, Save, Trash, Workflow } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { OverflowMenu } from '@/components/ui/Menu'
import { ConfirmDialog, NameDialog } from '@/components/ui/Dialog'
import { getStage } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { formatNumber, plural } from '@/domain/format'
import type { Scenario, ScenarioParams } from '@/domain/types'
import { BASELINE_RESULT, getSimulation } from '@/hooks/useSimulation'
import { nextScenarioName, runScenario, useScenarioStore } from '@/store/scenarios'
import { toast } from '@/store/toast'
import { ParameterEditor } from './ParameterEditor'
import { countChanges, paramsEqual } from './params'
import { ResultsPanel, type Calculation } from './ResultsPanel'
import { ScenariosInfo } from './ScenariosInfo'

interface ScenarioWorkbenchProps {
  scenario: Scenario
  /** Предлагаемое изменение ресурсов участка (переход «Смоделировать» с дашборда). */
  suggestion: { stageId: string; delta: number } | null
  focusStageId: string | null
  scenarioSelect?: React.ReactNode
  onDirtyChange: (dirty: boolean) => void
  onOpenScenario: (id: string, force?: boolean) => void
}

type NameDialogState = { mode: 'saveAs' | 'rename' } | null

function initialDraft(scenario: Scenario, suggestion: ScenarioWorkbenchProps['suggestion']): ScenarioParams {
  if (!suggestion) return scenario.params
  const current = scenario.params.stages[suggestion.stageId]
  if (!current) return scenario.params
  const resources = Math.min(Math.max(current.resources + suggestion.delta, 1), 8)
  return { ...scenario.params, stages: { ...scenario.params.stages, [suggestion.stageId]: { ...current, resources } } }
}

export function ScenarioWorkbench({ scenario, suggestion, focusStageId, scenarioSelect, onDirtyChange, onOpenScenario }: ScenarioWorkbenchProps) {
  const navigate = useNavigate()
  const { updateScenario, createScenario, duplicateScenario, deleteScenario, recordRun, setActiveScenario, scenarios } = useScenarioStore()
  const isBaseline = scenario.id === BASELINE_SCENARIO_ID

  const [draft, setDraft] = useState<ScenarioParams>(() => initialDraft(scenario, suggestion))
  const [calculation, setCalculation] = useState<Calculation | null>(() => {
    const started = performance.now()
    const result = getSimulation(scenario.params)
    return { result, ranAt: scenario.updatedAt, durationMs: performance.now() - started, source: 'saved' }
  })
  const [calcParams, setCalcParams] = useState<ScenarioParams>(scenario.params)
  const [running, setRunning] = useState(false)
  const [mobileTab, setMobileTab] = useState<'params' | 'results'>('params')
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const runTimer = useRef<number | undefined>(undefined)

  const dirty = !paramsEqual(draft, scenario.params)
  const stale = !paramsEqual(draft, calcParams)
  const changes = useMemo(() => countChanges(scenario.params, draft), [scenario.params, draft])

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  useEffect(() => () => window.clearTimeout(runTimer.current), [])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  const run = () => {
    if (running) return
    setRunning(true)
    const params = draft
    // Небольшая пауза — чтобы состояние «идёт расчёт» было заметно; сам расчёт занимает доли миллисекунды.
    runTimer.current = window.setTimeout(() => {
      const runRecord = runScenario({ id: scenario.id, name: dirty ? `${scenario.name} · черновик` : scenario.name, params })
      recordRun(runRecord)
      setCalculation({ result: getSimulation(params), ranAt: runRecord.ranAt, durationMs: runRecord.durationMs, source: 'run' })
      setCalcParams(params)
      setRunning(false)
      setMobileTab('results')
      toast.success(
        'Расчёт выполнен',
        `Модель пересчитана за ${runRecord.durationMs < 0.1 ? '< 0,1' : formatNumber(runRecord.durationMs, 1)} мс. Прогон добавлен в журнал.`,
      )
    }, 320)
  }

  const save = () => {
    if (isBaseline) {
      setNameDialog({ mode: 'saveAs' })
      return
    }
    updateScenario(scenario.id, { params: draft })
    toast.success('Сценарий сохранён', `«${scenario.name}» обновлён на сервере.`)
  }

  const showOnTwin = () => {
    setActiveScenario(scenario.id)
    navigate('/twin')
  }

  const stageName = suggestion ? getStage(suggestion.stageId)?.name : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Шапка сценария: название и основные действия; второстепенные — в меню «…» */}
      <div className="shrink-0 border-b border-line bg-canvas px-4 py-4 md:px-6">
        {scenarioSelect}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-ink sm:text-title">{scenario.name}</h1>
              {isBaseline && <Lock className="size-4 shrink-0 text-faint" aria-label="Только чтение" />}
            </div>
            {scenario.description && <p className="mt-1 line-clamp-2 max-w-[680px] text-sm text-muted">{scenario.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {changes > 0 && (
              <span className="mr-1 text-13 text-muted" aria-live="polite">
                {changes} {plural(changes, { one: 'изменение', few: 'изменения', many: 'изменений' })}
                {!isBaseline && dirty ? ' · не сохранено' : ''}
              </span>
            )}
            {dirty && (
              <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={() => setDraft(scenario.params)}>
                Сбросить
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<Workflow />}
              onClick={showOnTwin}
              disabled={dirty}
              title={dirty ? 'Сохраните изменения, чтобы открыть сценарий на схеме и в 3D-туре' : 'Открыть сценарий на мнемосхеме'}
            >
              <span className="max-sm:sr-only">На схеме</span>
            </Button>
            {isBaseline ? (
              <Button size="sm" variant="secondary" icon={<Save />} onClick={() => setNameDialog({ mode: 'saveAs' })} disabled={!dirty}>
                Сохранить как новый
              </Button>
            ) : (
              <Button size="sm" variant="secondary" icon={<Save />} onClick={save} disabled={!dirty}>
                Сохранить
              </Button>
            )}
            <Button size="sm" variant="primary" icon={<Calculator />} onClick={run} loading={running}>
              {running ? 'Расчёт…' : 'Рассчитать'}
            </Button>
            <OverflowMenu
              label="Другие действия со сценарием"
              items={[
                ...(!isBaseline
                  ? [{ key: 'saveAs', label: 'Сохранить как новый', icon: <Save />, onSelect: () => setNameDialog({ mode: 'saveAs' }) }]
                  : []),
                ...(!isBaseline ? [{ key: 'rename', label: 'Переименовать', icon: <Pencil />, onSelect: () => setNameDialog({ mode: 'rename' }) }] : []),
                {
                  key: 'duplicate',
                  label: 'Дублировать',
                  icon: <Copy />,
                  disabled: dirty,
                  disabledHint: 'Сначала сохраните или сбросьте изменения',
                  onSelect: () => {
                    const copy = duplicateScenario(scenario.id)
                    if (copy) {
                      toast.success('Создана копия', `«${copy.name}»`)
                      onOpenScenario(copy.id, true)
                    }
                  },
                },
                ...(!isBaseline
                  ? [{ key: 'delete', label: 'Удалить', icon: <Trash />, tone: 'danger' as const, onSelect: () => setConfirmDelete(true) }]
                  : []),
              ]}
            />
          </div>
        </div>

        <SegmentedControl
          className="mt-4 flex w-full lg:hidden [&>button]:flex-1"
          label="Раздел"
          value={mobileTab}
          onChange={setMobileTab}
          options={[
            { value: 'params', label: 'Параметры' },
            { value: 'results', label: stale ? 'Результат · устарел' : 'Результат' },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className={clsx('scrollbar-thin h-full overflow-y-auto bg-canvas px-4 py-6 md:px-6', mobileTab !== 'params' && 'hidden lg:block')}>
          {suggestion && stageName && (
            <div className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink-2">
              Предложено с обзора: {suggestion.delta > 0 ? '+1' : '−1'} ресурс на участке «{stageName}». Нажмите «Рассчитать», чтобы
              увидеть эффект.
            </div>
          )}
          <ParameterEditor
            draft={draft}
            base={scenario.params}
            onChange={setDraft}
            calculated={calculation?.result ?? null}
            stale={stale}
            focusStageId={focusStageId}
          />
        </div>
        <aside
          aria-label="Результаты расчёта"
          className={clsx('scrollbar-thin h-full overflow-y-auto border-line bg-surface px-5 py-6 md:px-6 lg:border-l', mobileTab !== 'results' && 'hidden lg:block')}
        >
          <h2 className="mb-4 text-15 font-semibold text-ink">Сравнение с базовым режимом</h2>
          <ResultsPanel
            base={BASELINE_RESULT}
            calculation={calculation}
            stale={stale}
            running={running}
            scenarioName={dirty ? `${scenario.name} (черновик)` : scenario.name}
            onRun={run}
          />
        </aside>
      </div>

      <NameDialog
        open={nameDialog !== null}
        title={nameDialog?.mode === 'rename' ? 'Переименовать сценарий' : 'Сохранить как новый сценарий'}
        submitLabel={nameDialog?.mode === 'rename' ? 'Сохранить' : 'Создать сценарий'}
        initialName={nameDialog?.mode === 'rename' ? scenario.name : nextScenarioName(scenarios)}
        initialDescription={nameDialog?.mode === 'rename' ? scenario.description : ''}
        onCancel={() => setNameDialog(null)}
        onSubmit={({ name, description }) => {
          if (nameDialog?.mode === 'rename') {
            updateScenario(scenario.id, { name, description })
            toast.success('Сценарий переименован')
          } else {
            const created = createScenario({ name, description, params: draft })
            toast.success('Сценарий создан', `«${created.name}» сохранён на сервере и доступен другим руководителям.`)
            onOpenScenario(created.id, true)
          }
          setNameDialog(null)
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Удалить сценарий?"
        description={<>Сценарий «{scenario.name}» будет удалён на сервере для всех руководителей. Записи в журнале расчётов сохранятся.</>}
        confirmLabel="Удалить"
        tone="danger"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          deleteScenario(scenario.id)
          toast.info('Сценарий удалён', `«${scenario.name}»`)
          onOpenScenario(BASELINE_SCENARIO_ID, true)
        }}
      />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Есть несохранённые изменения"
        description="Если уйти со страницы, изменённые параметры сценария будут потеряны."
        confirmLabel="Уйти без сохранения"
        tone="danger"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
      <ScenariosInfo calculation={calculation} stale={stale} isBaseline={isBaseline} />
    </div>
  )
}
