import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/config/app'
import { LINE_MODEL, STAGES } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID, PRESET_SCENARIOS } from '@/data/demo/scenarios'
import { simulate, summarize } from '@/domain/simulation/engine'
import type { KpiSummary, Scenario, ScenarioParams, ScenarioRun } from '@/domain/types'
import { ApiError, api } from '@/lib/api'
import { sanitizePersisted } from './persistence'
import { toast } from './toast'

const BASELINE = PRESET_SCENARIOS.find((s) => s.id === BASELINE_SCENARIO_ID)!
const MAX_RUNS = 30
const STAGE_IDS = STAGES.map((s) => s.id)

export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.floor(Math.random() * 1e12).toString(16)
  return `${prefix}-${random}`
}

export const BASELINE_SUMMARY: KpiSummary = summarize(simulate(LINE_MODEL, BASELINE.params))

/** Прогон сценария: реальный расчёт модели с замером времени. */
export function runScenario(scenario: Pick<Scenario, 'id' | 'name' | 'params'>): ScenarioRun {
  const started = performance.now()
  const summary = summarize(simulate(LINE_MODEL, scenario.params))
  const durationMs = performance.now() - started
  return {
    id: newId('run'),
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    ranAt: new Date().toISOString(),
    durationMs,
    summary,
    baselineSummary: BASELINE_SUMMARY,
  }
}

export function nextScenarioName(scenarios: Scenario[]): string {
  const used = new Set(scenarios.map((s) => s.name))
  let n = 1
  while (used.has(`Сценарий ${n}`)) n++
  return `Сценарий ${n}`
}

/**
 * Изменение применяется в интерфейсе сразу, запрос к серверу уходит в фоне.
 * Если сервер отказал — изменение откатывается и показывается причина.
 */
function sync(call: () => Promise<unknown>, rollback: () => void, failTitle: string) {
  call().catch((e) => {
    rollback()
    toast.error(failTitle, e instanceof ApiError ? e.message : 'Изменение не сохранено на сервере.')
  })
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ScenarioState {
  scenarios: Scenario[]
  runs: ScenarioRun[]
  /** Сценарий, отображаемый в двойнике и 3D-туре (настройка этого браузера). */
  activeScenarioId: string
  status: LoadStatus
  /** Загрузить сценарии и журнал прогонов с сервера (только для руководителя). */
  load: () => Promise<void>
  /** Перечитать данные без индикатора загрузки — после изменений другого руководителя. */
  refresh: () => Promise<void>
  /** Сбросить локальное состояние (при выходе из системы). */
  clear: () => void
  createScenario: (input: { name: string; description: string; params: ScenarioParams }) => Scenario
  updateScenario: (id: string, patch: Partial<Pick<Scenario, 'name' | 'description' | 'params'>>) => void
  duplicateScenario: (id: string) => Scenario | null
  deleteScenario: (id: string) => void
  setActiveScenario: (id: string) => void
  recordRun: (run: ScenarioRun) => void
  clearRuns: () => void
  resetDemo: () => Promise<void>
}

interface ServerData {
  scenarios: Scenario[]
  runs: ScenarioRun[]
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => {
      const apply = (data: ServerData) => {
        // Ответ сервера тоже проверяем: некорректные записи отбрасываются, базовый сценарий — из кода.
        const clean = sanitizePersisted({ ...data, activeScenarioId: get().activeScenarioId }, BASELINE, STAGE_IDS)
        if (!clean) return
        set({ scenarios: clean.scenarios, runs: clean.runs.slice(0, MAX_RUNS), activeScenarioId: clean.activeScenarioId, status: 'ready' })
      }

      return {
        scenarios: PRESET_SCENARIOS,
        runs: [],
        activeScenarioId: BASELINE_SCENARIO_ID,
        status: 'idle',

        load: async () => {
          set({ status: 'loading' })
          try {
            apply(await api<ServerData>('GET', '/api/scenarios'))
          } catch (e) {
            set({ status: 'error' })
            toast.error('Сценарии не загружены', e instanceof ApiError ? e.message : undefined)
          }
        },

        refresh: async () => {
          if (get().status !== 'ready') return
          try {
            apply(await api<ServerData>('GET', '/api/scenarios'))
          } catch {
            // Не критично: данные обновятся при следующей загрузке страницы.
          }
        },

        clear: () => set({ scenarios: PRESET_SCENARIOS, runs: [], status: 'idle' }),

        createScenario: ({ name, description, params }) => {
          const now = new Date().toISOString()
          const scenario: Scenario = {
            id: newId('sc'),
            name: name.trim() || nextScenarioName(get().scenarios),
            description: description.trim(),
            kind: 'user',
            params,
            createdAt: now,
            updatedAt: now,
          }
          set({ scenarios: [...get().scenarios, scenario] })
          sync(
            () => api('POST', '/api/scenarios', { id: scenario.id, name: scenario.name, description: scenario.description, params }),
            () => set({ scenarios: get().scenarios.filter((s) => s.id !== scenario.id) }),
            'Сценарий не создан',
          )
          return scenario
        },

        updateScenario: (id, patch) => {
          if (id === BASELINE_SCENARIO_ID) return
          const before = get().scenarios.find((s) => s.id === id)
          if (!before) return
          const after = { ...before, ...patch, updatedAt: new Date().toISOString() }
          set({ scenarios: get().scenarios.map((s) => (s.id === id ? after : s)) })
          sync(
            () => api('PUT', `/api/scenarios/${encodeURIComponent(id)}`, { name: after.name, description: after.description, params: after.params }),
            () => set({ scenarios: get().scenarios.map((s) => (s.id === id ? before : s)) }),
            'Изменения не сохранены',
          )
        },

        duplicateScenario: (id) => {
          const source = get().scenarios.find((s) => s.id === id)
          if (!source) return null
          return get().createScenario({
            name: `${source.name} — копия`.slice(0, 80),
            description: source.description,
            params: structuredClone(source.params),
          })
        },

        deleteScenario: (id) => {
          if (id === BASELINE_SCENARIO_ID) return
          const prev = get().scenarios
          const prevActive = get().activeScenarioId
          set({
            scenarios: prev.filter((s) => s.id !== id),
            activeScenarioId: prevActive === id ? BASELINE_SCENARIO_ID : prevActive,
          })
          sync(
            () => api('DELETE', `/api/scenarios/${encodeURIComponent(id)}`),
            () => set({ scenarios: prev, activeScenarioId: prevActive }),
            'Сценарий не удалён',
          )
        },

        setActiveScenario: (id) => {
          if (get().scenarios.some((s) => s.id === id)) set({ activeScenarioId: id })
        },

        recordRun: (run) => {
          set({ runs: [run, ...get().runs].slice(0, MAX_RUNS) })
          sync(
            () => api('POST', '/api/runs', run),
            () => set({ runs: get().runs.filter((r) => r.id !== run.id) }),
            'Прогон не записан в журнал',
          )
        },

        clearRuns: () => {
          const prev = get().runs
          set({ runs: [] })
          sync(() => api('DELETE', '/api/runs'), () => set({ runs: prev }), 'Журнал не очищен')
        },

        resetDemo: async () => {
          try {
            apply(await api<ServerData>('POST', '/api/scenarios/reset', {}))
            set({ activeScenarioId: BASELINE_SCENARIO_ID })
            toast.info('Демо-данные восстановлены')
          } catch (e) {
            toast.error('Сброс не выполнен', e instanceof ApiError ? e.message : undefined)
          }
        },
      }
    },
    {
      // В браузере хранится только выбор активного сценария; сами сценарии — на сервере.
      name: STORAGE_KEYS.activeScenario,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeScenarioId: s.activeScenarioId }),
      migrate: () => ({ activeScenarioId: BASELINE_SCENARIO_ID }),
      merge: (persisted, current) => {
        const id = (persisted as { activeScenarioId?: unknown } | undefined)?.activeScenarioId
        return { ...current, activeScenarioId: typeof id === 'string' ? id : BASELINE_SCENARIO_ID }
      },
    },
  ),
)

export function useScenario(id: string | null | undefined): Scenario | undefined {
  return useScenarioStore((s) => (id ? s.scenarios.find((x) => x.id === id) : undefined))
}

export function useActiveScenario(): Scenario {
  return useScenarioStore((s) => s.scenarios.find((x) => x.id === s.activeScenarioId) ?? BASELINE)
}

export { BASELINE as BASELINE_SCENARIO }
