import { useCallback, useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Select } from '@/components/ui/Controls'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { getStage } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { BASELINE_SCENARIO, nextScenarioName, useScenarioStore } from '@/store/scenarios'
import { toast } from '@/store/toast'
import { ScenarioList } from './ScenarioList'
import { ScenarioWorkbench } from './ScenarioWorkbench'

/**
 * Моделирование сценариев: список сценариев, редактор параметров и сравнение с базой.
 * URL: ?id=<сценарий>&focus=<участок>&delta=<±1 ресурс — предложение с обзора>.
 */
export default function ScenariosPage() {
  const [search, setSearch] = useSearchParams()
  const scenarios = useScenarioStore((s) => s.scenarios)
  const createScenario = useScenarioStore((s) => s.createScenario)
  const resetDemo = useScenarioStore((s) => s.resetDemo)

  const [dirty, setDirty] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const selectId = useId()

  const idParam = search.get('id')
  const scenario = scenarios.find((s) => s.id === idParam) ?? scenarios.find((s) => s.id === BASELINE_SCENARIO_ID) ?? BASELINE_SCENARIO
  const focusParam = search.get('focus')
  const focusStageId = getStage(focusParam)?.id ?? null
  const deltaParam = Number(search.get('delta'))
  const suggestion = focusStageId && (deltaParam === 1 || deltaParam === -1) ? { stageId: focusStageId, delta: deltaParam } : null

  const go = useCallback(
    (id: string) => {
      setSearch({ id }, { replace: false })
      setDirty(false)
    },
    [setSearch],
  )

  const openScenario = useCallback(
    (id: string, force = false) => {
      if (id === scenario.id && !suggestion) return
      if (dirty && !force) {
        setPendingId(id)
        return
      }
      go(id)
    },
    [dirty, go, scenario.id, suggestion],
  )

  const createNew = () => {
    const created = createScenario({
      name: nextScenarioName(scenarios),
      description: 'Копия базового режима для экспериментов.',
      params: structuredClone(BASELINE_SCENARIO.params),
    })
    toast.success('Создан новый сценарий', 'Параметры скопированы из базового режима.')
    openScenario(created.id, true)
  }

  const scenarioSelect = (
    <div className="mb-3 xl:hidden">
      <label htmlFor={selectId} className="mb-1 block text-2xs text-muted">
        Сценарий
      </label>
      <Select id={selectId} size="sm" value={scenario.id} onChange={(e) => openScenario(e.target.value)} className="w-full sm:w-[320px]">
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
    </div>
  )

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-[272px] shrink-0 border-r border-line bg-surface xl:block">
        <ScenarioList
          scenarios={scenarios}
          selectedId={scenario.id}
          dirty={dirty}
          onSelect={(id) => openScenario(id)}
          onCreate={createNew}
          onReset={() => setConfirmReset(true)}
        />
      </aside>

      <div className="min-w-0 flex-1">
        <ScenarioWorkbench
          key={`${scenario.id}:${suggestion ? `${suggestion.stageId}${suggestion.delta}` : ''}`}
          scenario={scenario}
          suggestion={suggestion}
          focusStageId={focusStageId}
          scenarioSelect={scenarioSelect}
          onDirtyChange={setDirty}
          onOpenScenario={openScenario}
        />
      </div>

      <ConfirmDialog
        open={pendingId !== null}
        title="Перейти к другому сценарию?"
        description="Несохранённые изменения параметров текущего сценария будут потеряны."
        confirmLabel="Перейти без сохранения"
        tone="danger"
        onCancel={() => setPendingId(null)}
        onConfirm={() => {
          const id = pendingId
          setPendingId(null)
          if (id) go(id)
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Сбросить демо-сценарии?"
        description="Все сценарии и журнал расчётов будут удалены на сервере для всех руководителей, демонстрационные сценарии — восстановлены."
        confirmLabel="Сбросить"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          void resetDemo().then(() => go(BASELINE_SCENARIO_ID))
        }}
      />
    </div>
  )
}
