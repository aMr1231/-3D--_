import { useMemo } from 'react'
import { LINE_MODEL } from '@/data/demo/enterprise'
import { BASELINE_SCENARIO_ID, PRESET_SCENARIOS } from '@/data/demo/scenarios'
import { simulate } from '@/domain/simulation/engine'
import type { ScenarioParams, SimulationResult } from '@/domain/types'

const cache = new WeakMap<ScenarioParams, SimulationResult>()

/** Расчёт с кешем по объекту параметров (параметры в хранилище неизменяемы). */
export function getSimulation(params: ScenarioParams): SimulationResult {
  let result = cache.get(params)
  if (!result) {
    result = simulate(LINE_MODEL, params)
    cache.set(params, result)
  }
  return result
}

export function useSimulation(params: ScenarioParams): SimulationResult {
  return useMemo(() => getSimulation(params), [params])
}

export const BASELINE_PARAMS_REF = PRESET_SCENARIOS.find((s) => s.id === BASELINE_SCENARIO_ID)!.params
export const BASELINE_RESULT: SimulationResult = getSimulation(BASELINE_PARAMS_REF)
