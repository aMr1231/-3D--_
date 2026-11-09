import type { KpiSummary, ScenarioParams, StageId } from '../types'
import { simulate, summarize, type LineModel } from './engine'

export interface SensitivityRow {
  stageId: StageId
  /** Изменение числа ресурсов: +1 или −1. */
  change: 1 | -1
  /** Можно ли применить изменение (нельзя убрать последний ресурс). */
  feasible: boolean
  resourcesAfter: number
  stageUtilizationAfter: number
  summary: KpiSummary | null
}

/**
 * Анализ чувствительности: для каждого участка пересчитываем линию с ресурсом +1 и −1.
 * Это реальный перерасчёт модели, а не эвристика.
 */
export function resourceSensitivity(model: LineModel, params: ScenarioParams): SensitivityRow[] {
  const rows: SensitivityRow[] = []
  for (const stage of model.stages) {
    const current = params.stages[stage.id]
    for (const change of [1, -1] as const) {
      const resourcesAfter = current.resources + change
      if (resourcesAfter < 1) {
        rows.push({
          stageId: stage.id,
          change,
          feasible: false,
          resourcesAfter,
          stageUtilizationAfter: Number.NaN,
          summary: null,
        })
        continue
      }
      const next: ScenarioParams = {
        ...params,
        stages: { ...params.stages, [stage.id]: { ...current, resources: resourcesAfter } },
      }
      const result = simulate(model, next)
      rows.push({
        stageId: stage.id,
        change,
        feasible: true,
        resourcesAfter,
        stageUtilizationAfter: result.stages.find((s) => s.stageId === stage.id)?.utilization ?? 0,
        summary: summarize(result),
      })
    }
  }
  return rows
}
