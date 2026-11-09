import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/config/app'
import { LINE_MODEL, STAGES } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID, PRESET_SCENARIOS } from '@/data/demo/scenarios'
import { simulate, summarize } from '@/domain/simulation/engine'
import type { KpiSummary, Scenario, ScenarioParams, ScenarioRun } from '@/domain/types'
import { sanitizePersisted } from './persistence'

const BASELINE = PRESET_SCENARIOS.find((s) => s.id === BASELINE_SCENARIO_ID)!
const MAX_RUNS = 30
const STAGE_IDS = STAGES.map((s) => s.id)

export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e8).toString(16)
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

function seedRuns(): ScenarioRun[] {
  const now = Date.now()
  const offsetsHours: Record<string, number> = { 'preset-peak-plan': 3, 'preset-cnc5': 26, 'preset-peak': 50 }
  return PRESET_SCENARIOS.filter((s) => s.kind === 'preset')
    .map((s) => ({ ...runScenario(s), ranAt: new Date(now - (offsetsHours[s.id] ?? 72) * 3600_000).toISOString() }))
    .sort((a, b) => b.ranAt.localeCompare(a.ranAt))
}

export function nextScenarioName(scenarios: Scenario[]): string {
  const used = new Set(scenarios.map((s) => s.name))
  let n = 1
  while (used.has(`Сценарий ${n}`)) n++
  return `Сценарий ${n}`
}

interface ScenarioState {
  scenarios: Scenario[]
  runs: ScenarioRun[]
  /** Сценарий, отображаемый в двойнике и 3D-туре. */
  activeScenarioId: string
  /** true — сохранённые данные были повреждены и восстановлены по умолчанию. */
  storageRecovered: boolean
  createScenario: (input: { name: string; description: string; params: ScenarioParams }) => Scenario
  updateScenario: (id: string, patch: Partial<Pick<Scenario, 'name' | 'description' | 'params'>>) => void
  duplicateScenario: (id: string) => Scenario | null
  deleteScenario: (id: string) => void
  setActiveScenario: (id: string) => void
  recordRun: (run: ScenarioRun) => void
  clearRuns: () => void
  resetDemo: () => void
  acknowledgeRecovery: () => void
}

function defaults() {
  return {
    scenarios: PRESET_SCENARIOS,
    runs: seedRuns(),
    activeScenarioId: BASELINE_SCENARIO_ID,
    storageRecovered: false,
  }
}

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set, get) => ({
      ...defaults(),
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
        return scenario
      },
      updateScenario: (id, patch) => {
        if (id === BASELINE_SCENARIO_ID) return
        set({
          scenarios: get().scenarios.map((s) =>
            s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
          ),
        })
      },
      duplicateScenario: (id) => {
        const source = get().scenarios.find((s) => s.id === id)
        if (!source) return null
        return get().createScenario({
          name: `${source.name} — копия`,
          description: source.description,
          params: structuredClone(source.params),
        })
      },
      deleteScenario: (id) => {
        if (id === BASELINE_SCENARIO_ID) return
        set({
          scenarios: get().scenarios.filter((s) => s.id !== id),
          activeScenarioId: get().activeScenarioId === id ? BASELINE_SCENARIO_ID : get().activeScenarioId,
        })
      },
      setActiveScenario: (id) => {
        if (get().scenarios.some((s) => s.id === id)) set({ activeScenarioId: id })
      },
      recordRun: (run) => set({ runs: [run, ...get().runs].slice(0, MAX_RUNS) }),
      clearRuns: () => set({ runs: [] }),
      resetDemo: () => set({ ...defaults() }),
      acknowledgeRecovery: () => set({ storageRecovered: false }),
    }),
    {
      name: STORAGE_KEYS.scenarios,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        scenarios: s.scenarios.filter((x) => x.kind !== 'baseline'),
        runs: s.runs,
        activeScenarioId: s.activeScenarioId,
      }),
      migrate: (persisted) => persisted as never,
      onRehydrateStorage: () => (_state, error) => {
        if (error) useScenarioStore.setState({ storageRecovered: true })
      },
      // Проверяем сохранённые данные: повреждённые записи отбрасываются, базовый сценарий всегда из кода.
      merge: (persisted, current) => {
        const clean = sanitizePersisted(persisted, BASELINE, STAGE_IDS)
        if (!clean) return current
        return {
          ...current,
          scenarios: clean.scenarios,
          runs: clean.runs,
          activeScenarioId: clean.activeScenarioId,
          storageRecovered: clean.recovered,
        }
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
