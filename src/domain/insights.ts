import { formatDuration, formatNumber, formatPercent, formatRubCompact, formatSigned } from './format'
import { resourceSensitivity, type SensitivityRow } from './simulation/sensitivity'
import type { LineModel } from './simulation/engine'
import { STATUS_SEVERITY } from './status'
import type { ScenarioParams, SimulationResult, StageId, StageStatus } from './types'

export interface StageInsight {
  stageId: StageId
  status: StageStatus
  /** Короткое описание проблемы. */
  finding: string
  /** Рекомендация, рассчитанная перерасчётом модели. */
  recommendation: string
  /** Эффект рекомендации положительный (стоит смоделировать). */
  actionable: boolean
  sensitivity?: SensitivityRow
}

/**
 * Находки по участкам с отклонениями: перегрузка, риск, простой.
 * Рекомендации не шаблонные — каждая получена перерасчётом линии с ±1 ресурсом.
 */
export function buildInsights(model: LineModel, params: ScenarioParams, result: SimulationResult): StageInsight[] {
  const rows = resourceSensitivity(model, params)
  const insights: StageInsight[] = []

  for (const s of result.stages) {
    if (s.status === 'normal') continue
    const def = model.stages.find((d) => d.id === s.stageId)!
    const resources = params.stages[s.stageId].resources

    if (s.status === 'bottleneck' || s.status === 'high') {
      const plus = rows.find((r) => r.stageId === s.stageId && r.change === 1)!
      const after = plus.summary!
      const dCycle = after.cycleTimeMin - result.cycleTimeMin
      const dOutput = after.outputPerDay - result.outputPerDay
      const dCost = (after.costPerUnit - result.costPerUnit) / result.costPerUnit
      const finding = s.saturated
        ? `Поступление ${formatNumber(s.inflowPerHour, 1)} шт/ч выше мощности ${formatNumber(s.capacityPerHour, 1)} шт/ч — задел растёт на ${formatNumber(s.backlogGrowthPerHour, 1)} шт/ч.`
        : `Загрузка ${formatPercent(s.utilization)}, очередь ≈ ${formatNumber(s.queueLength, 0)} шт, ожидание ${formatDuration(s.waitMin)}.`
      const parts = [
        `загрузка ${formatPercent(s.utilization)} → ${formatPercent(plus.stageUtilizationAfter)}`,
        `цикл ${formatSigned(dCycle, formatDuration)}`,
      ]
      if (Math.abs(dOutput) >= 1) parts.push(`выпуск ${formatSigned(dOutput, (v) => formatNumber(v, 0))} шт/сут`)
      parts.push(`себестоимость ${formatSigned(dCost * 100, (v) => formatNumber(v, 1))} %`)
      insights.push({
        stageId: s.stageId,
        status: s.status,
        finding,
        recommendation: `+1 ${def.resourceKind.one}: ${parts.join(', ')}.`,
        actionable: dCycle < -1 || dOutput >= 1,
        sensitivity: plus,
      })
    } else {
      const minus = rows.find((r) => r.stageId === s.stageId && r.change === -1)!
      const finding = `Загрузка ${formatPercent(s.utilization)}: ресурсы простаивают ${formatPercent(s.idleShare)} времени (${formatRubCompact(s.idleCostPerHour * params.hoursPerDay)}/сут).`
      if (!minus.feasible || !minus.summary) {
        insights.push({
          stageId: s.stageId,
          status: s.status,
          finding,
          recommendation: 'Единственный ресурс участка — сокращение невозможно; резерв можно использовать при росте нагрузки.',
          actionable: false,
        })
        continue
      }
      const overload = minus.stageUtilizationAfter >= 0.95 || minus.summary.outputPerDay < result.outputPerDay - 0.5
      const saving = result.operatingCostPerDay - minus.summary.operatingCostPerDay
      insights.push({
        stageId: s.stageId,
        status: s.status,
        finding,
        recommendation: overload
          ? `−1 ресурс (${resources} → ${resources - 1}) перегрузит участок: загрузка ${formatPercent(Math.min(minus.stageUtilizationAfter, 1))}. Резерв стоит сохранить под пиковую нагрузку.`
          : `−1 ресурс: загрузка → ${formatPercent(minus.stageUtilizationAfter)}, экономия ${formatRubCompact(saving)}/сут, цикл ${formatSigned(minus.summary.cycleTimeMin - result.cycleTimeMin, formatDuration)}.`,
        actionable: !overload,
        sensitivity: minus,
      })
    }
  }

  return insights.sort((a, b) => {
    const sev = STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status]
    if (sev !== 0) return sev
    const ua = result.stages.find((s) => s.stageId === a.stageId)!.utilization
    const ub = result.stages.find((s) => s.stageId === b.stageId)!.utilization
    return ub - ua
  })
}

/** Итоговая формулировка состояния линии. */
export function lineHealth(result: SimulationResult): { tone: StageStatus; title: string } {
  if (result.saturated) return { tone: 'bottleneck', title: 'Линия перегружена: выпуск ниже плана' }
  if (result.bottleneckCount > 0) return { tone: 'bottleneck', title: 'Линия работает с ограничением' }
  if (result.riskCount > 0) return { tone: 'high', title: 'Линия работает на пределе мощности' }
  return { tone: 'normal', title: 'Линия работает в штатном режиме' }
}
