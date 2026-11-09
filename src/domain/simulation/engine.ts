import { MODEL } from '@/config/app'
import { classifyUtilization } from '../status'
import type {
  Enterprise,
  KpiSummary,
  ScenarioParams,
  SimulationResult,
  StageDefinition,
  StageResult,
} from '../types'
import { departureCv2, waitInQueue } from './queueing'

/** Модель линии: предприятие и упорядоченный список участков (порядок = маршрут изделия). */
export interface LineModel {
  enterprise: Enterprise
  stages: StageDefinition[]
}

/**
 * Аналитический расчёт последовательной производственной линии.
 *
 * 1. Эффективное время операции: tₑ = t / (скорость · готовность).
 * 2. Мощность участка: μ = c · 60 / tₑ, шт/ч.
 * 3. Поток идёт по маршруту: участок обрабатывает min(поступление, μ),
 *    излишек копится перед ним как задел (участок перегружен).
 * 4. Ожидание — формула G/G/c (см. queueing.ts) + накопление задела за сутки.
 * 5. Время цикла = Σ(ожидание + обработка + транспорт); НЗП — по закону Литтла.
 * 6. Затраты: ресурсы оплачиваются всё рабочее время, переменные — за обработанные единицы.
 */
export function simulate(model: LineModel, params: ScenarioParams): SimulationResult {
  const hours = params.hoursPerDay
  let flow = Math.max(params.loadPerHour, 0)
  let ca2: number = MODEL.arrivalCv2
  let yieldProduct = 1

  const stages: StageResult[] = model.stages.map((def, index) => {
    const p = params.stages[def.id]
    if (!p) throw new Error(`Нет параметров для участка «${def.id}»`)

    const resources = Math.max(0, Math.round(p.resources))
    const te = p.opTimeMin / (Math.max(p.speedFactor, 0.01) * def.availability)
    const capacity = resources > 0 && te > 0 ? (resources * 60) / te : 0

    const inflow = flow
    const processed = Math.min(inflow, capacity)
    const saturated = inflow > capacity + 1e-9
    const utilization = capacity > 0 ? processed / capacity : inflow > 0 ? 1 : 0

    const rhoForQueue = Math.min(utilization, MODEL.maxRhoInQueueFormula)
    const steadyWait = waitInQueue({ ca2, cs2: def.serviceCv2, rho: rhoForQueue, servers: resources, te })
    const backlogGrowth = saturated ? inflow - capacity : 0
    // Задел растёт линейно в течение суток: в среднем (λ − μ) · H / 2 единиц ждут дополнительно.
    const avgBacklog = (backlogGrowth * hours) / 2
    const backlogWait = saturated && capacity > 0 ? (avgBacklog / capacity) * 60 : 0

    const steadyQueue = (processed / 60) * steadyWait
    const queueLength = steadyQueue + avgBacklog
    const inService = capacity > 0 ? (processed * te) / 60 : 0
    const transportMin = index < model.stages.length - 1 ? def.transportMinToNext : 0

    const resourceCostPerHour = resources * p.costPerHour
    const variableCostPerHour = processed * def.variableCostPerUnit

    const outflow = processed * def.yieldRate
    const result: StageResult = {
      stageId: def.id,
      effectiveOpTimeMin: te,
      capacityPerHour: capacity,
      inflowPerHour: inflow,
      processedPerHour: processed,
      outflowPerHour: outflow,
      utilization,
      idleShare: 1 - utilization,
      saturated,
      backlogGrowthPerHour: backlogGrowth,
      waitMin: steadyWait + backlogWait,
      processMin: te,
      transportMin,
      queueLength,
      steadyQueueLength: steadyQueue,
      wip: queueLength + inService,
      status: classifyUtilization(utilization, saturated),
      resourceCostPerHour,
      variableCostPerHour,
      costPerUnit: processed > 0 ? (resourceCostPerHour + variableCostPerHour) / processed : 0,
      idleCostPerHour: resourceCostPerHour * (1 - utilization),
      arrivalCv2: ca2,
    }

    ca2 = departureCv2({ ca2, cs2: def.serviceCv2, rho: utilization, servers: resources })
    flow = outflow
    yieldProduct *= def.yieldRate
    return result
  })

  const outputPerHour = flow
  const outputPerDay = outputPerHour * hours
  const plannedOutputPerDay = params.loadPerHour * yieldProduct * hours

  const cycleTimeMin = stages.reduce((sum, s) => sum + s.waitMin + s.processMin + s.transportMin, 0)
  const transportWip = stages.reduce((sum, s) => sum + (s.processedPerHour * s.transportMin) / 60, 0)
  const wip = stages.reduce((sum, s) => sum + s.wip, 0) + transportWip

  const totalResources = stages.reduce((sum, s) => sum + (params.stages[s.stageId]?.resources ?? 0), 0)
  const avgUtilization =
    totalResources > 0
      ? stages.reduce((sum, s) => sum + s.utilization * (params.stages[s.stageId]?.resources ?? 0), 0) /
        totalResources
      : 0

  const constraint = stages.reduce((max, s) => (s.utilization > max.utilization + 1e-9 ? s : max), stages[0])

  const operatingCostPerDay = stages.reduce((sum, s) => sum + (s.resourceCostPerHour + s.variableCostPerHour) * hours, 0)
  const materialCostPerDay = (stages[0]?.processedPerHour ?? 0) * model.enterprise.product.materialCostPerUnit * hours
  const idleCostPerDay = stages.reduce((sum, s) => sum + s.idleCostPerHour * hours, 0)

  return {
    params,
    stages,
    outputPerHour,
    outputPerDay,
    plannedOutputPerDay,
    planAttainment: plannedOutputPerDay > 0 ? outputPerDay / plannedOutputPerDay : 0,
    shortfallPerDay: Math.max(plannedOutputPerDay - outputPerDay, 0),
    cycleTimeMin,
    wip,
    avgUtilization,
    constraintStageId: constraint.stageId,
    constraintUtilization: constraint.utilization,
    bottleneckCount: stages.filter((s) => s.status === 'bottleneck').length,
    riskCount: stages.filter((s) => s.status === 'high').length,
    idleCount: stages.filter((s) => s.status === 'idle').length,
    saturated: stages.some((s) => s.saturated),
    operatingCostPerDay,
    materialCostPerDay,
    costPerUnit: outputPerDay > 0 ? (operatingCostPerDay + materialCostPerDay) / outputPerDay : 0,
    conversionCostPerUnit: outputPerDay > 0 ? operatingCostPerDay / outputPerDay : 0,
    idleCostPerDay,
  }
}

export function summarize(result: SimulationResult): KpiSummary {
  return {
    outputPerHour: result.outputPerHour,
    outputPerDay: result.outputPerDay,
    cycleTimeMin: result.cycleTimeMin,
    avgUtilization: result.avgUtilization,
    constraintStageId: result.constraintStageId,
    constraintUtilization: result.constraintUtilization,
    costPerUnit: result.costPerUnit,
    operatingCostPerDay: result.operatingCostPerDay,
    wip: result.wip,
    shortfallPerDay: result.shortfallPerDay,
    bottleneckCount: result.bottleneckCount,
  }
}

/** Профиль очередей перед участками в течение суток (установившаяся очередь + накопление задела). */
export function queueProfile(result: SimulationResult, stepHours = 1): Array<{ hour: number } & Record<string, number>> {
  const points: Array<{ hour: number } & Record<string, number>> = []
  const hours = result.params.hoursPerDay
  for (let t = 0; t <= hours + 1e-9; t += stepHours) {
    const point: { hour: number } & Record<string, number> = { hour: Math.round(t * 100) / 100 }
    for (const s of result.stages) {
      point[s.stageId] = s.steadyQueueLength + s.backlogGrowthPerHour * t
    }
    points.push(point)
  }
  return points
}
