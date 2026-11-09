import type { Scenario, ScenarioParams, ScenarioRun } from '@/domain/types'

/** Проверка и очистка данных, восстановленных из localStorage (данные могли быть изменены вручную или повреждены). */

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

export function isValidParams(p: unknown, stageIds: string[]): p is ScenarioParams {
  if (!p || typeof p !== 'object') return false
  const params = p as ScenarioParams
  if (!isFiniteNumber(params.loadPerHour) || !isFiniteNumber(params.hoursPerDay)) return false
  if (params.loadPerHour < 0 || params.hoursPerDay <= 0 || params.hoursPerDay > 24) return false
  if (!params.stages || typeof params.stages !== 'object') return false
  return stageIds.every((id) => {
    const sp = params.stages[id]
    return (
      !!sp &&
      isFiniteNumber(sp.resources) &&
      sp.resources >= 1 &&
      isFiniteNumber(sp.opTimeMin) &&
      sp.opTimeMin > 0 &&
      isFiniteNumber(sp.speedFactor) &&
      sp.speedFactor > 0 &&
      isFiniteNumber(sp.costPerHour) &&
      sp.costPerHour >= 0
    )
  })
}

export function isValidScenario(s: unknown, stageIds: string[]): s is Scenario {
  if (!s || typeof s !== 'object') return false
  const sc = s as Scenario
  return typeof sc.id === 'string' && typeof sc.name === 'string' && isValidParams(sc.params, stageIds)
}

export function isValidRun(r: unknown): r is ScenarioRun {
  if (!r || typeof r !== 'object') return false
  const run = r as ScenarioRun
  return (
    typeof run.id === 'string' &&
    typeof run.scenarioId === 'string' &&
    typeof run.ranAt === 'string' &&
    !!run.summary &&
    isFiniteNumber(run.summary.outputPerDay) &&
    !!run.baselineSummary
  )
}

export interface SanitizedState {
  scenarios: Scenario[]
  runs: ScenarioRun[]
  activeScenarioId: string
  recovered: boolean
}

/**
 * Возвращает очищенное состояние: базовый сценарий всегда из кода, некорректные записи отброшены,
 * `recovered = true`, если что-то пришлось отбросить.
 */
export function sanitizePersisted(persisted: unknown, baseline: Scenario, stageIds: string[]): SanitizedState | null {
  if (!persisted || typeof persisted !== 'object') return null
  const p = persisted as { scenarios?: unknown; runs?: unknown; activeScenarioId?: unknown }
  const rawScenarios = Array.isArray(p.scenarios) ? p.scenarios : null
  const rawRuns = Array.isArray(p.runs) ? p.runs : null

  const candidates = (rawScenarios ?? []).filter((s) => !(s && typeof s === 'object' && (s as Scenario).kind === 'baseline'))
  const validScenarios = candidates.filter((s): s is Scenario => isValidScenario(s, stageIds))
  const validRuns = (rawRuns ?? []).filter(isValidRun)

  const recovered =
    rawScenarios === null ||
    rawRuns === null ||
    validScenarios.length !== candidates.length ||
    validRuns.length !== (rawRuns?.length ?? 0)

  const scenarios = [baseline, ...validScenarios]
  const activeScenarioId =
    typeof p.activeScenarioId === 'string' && scenarios.some((s) => s.id === p.activeScenarioId) ? p.activeScenarioId : baseline.id

  return { scenarios, runs: validRuns, activeScenarioId, recovered }
}
