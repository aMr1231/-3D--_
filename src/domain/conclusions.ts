import { formatDuration, formatNumber, formatPercent, formatRub, formatSigned } from './format'
import type { LineModel } from './simulation/engine'
import type { SimulationResult } from './types'

export interface Conclusion {
  tone: 'better' | 'worse' | 'neutral'
  text: string
}

/** Текстовые выводы сравнения «база → сценарий», построенные по рассчитанным значениям. */
export function describeChange(model: LineModel, base: SimulationResult, alt: SimulationResult): Conclusion[] {
  const out: Conclusion[] = []
  const name = (id: string) => {
    const d = model.stages.find((s) => s.id === id)!
    return `${d.code} ${d.shortName}`
  }

  const dOut = alt.outputPerDay - base.outputPerDay
  if (Math.abs(dOut) >= 0.5) {
    out.push({
      tone: dOut > 0 ? 'better' : 'worse',
      text: `Выпуск ${formatNumber(base.outputPerDay, 0)} → ${formatNumber(alt.outputPerDay, 0)} шт/сут (${formatSigned(dOut, (v) => formatNumber(v, 0))}).`,
    })
  } else {
    out.push({ tone: 'neutral', text: `Выпуск не меняется: ${formatNumber(alt.outputPerDay, 0)} шт/сут — линия уже выпускает всё, что запускается.` })
  }

  if (alt.saturated) {
    out.push({
      tone: 'worse',
      text: `Перегрузка: план ${formatNumber(alt.plannedOutputPerDay, 0)} шт/сут не выполняется, недовыпуск ${formatNumber(alt.shortfallPerDay, 0)} шт/сут.`,
    })
  } else if (base.saturated) {
    out.push({ tone: 'better', text: 'Перегрузка устранена: линия выполняет план при заданной нагрузке.' })
  }

  const dCycle = alt.cycleTimeMin - base.cycleTimeMin
  if (Math.abs(dCycle) >= 1) {
    out.push({
      tone: dCycle < 0 ? 'better' : 'worse',
      text: `Время цикла ${formatDuration(base.cycleTimeMin)} → ${formatDuration(alt.cycleTimeMin)} (${formatSigned(dCycle, formatDuration)}).`,
    })
  }

  if (alt.constraintStageId !== base.constraintStageId) {
    out.push({
      tone: 'neutral',
      text: `Ограничение линии смещается: ${name(base.constraintStageId)} (${formatPercent(base.constraintUtilization)}) → ${name(alt.constraintStageId)} (${formatPercent(alt.constraintUtilization)}).`,
    })
  } else {
    const dU = alt.constraintUtilization - base.constraintUtilization
    if (Math.abs(dU) >= 0.005) {
      out.push({
        tone: dU < 0 ? 'better' : 'worse',
        text: `Загрузка ограничения ${name(alt.constraintStageId)}: ${formatPercent(base.constraintUtilization)} → ${formatPercent(alt.constraintUtilization)}.`,
      })
    }
  }

  const dCost = alt.costPerUnit - base.costPerUnit
  if (Math.abs(dCost) >= 1) {
    out.push({
      tone: dCost < 0 ? 'better' : 'worse',
      text: `Себестоимость изделия ${formatRub(base.costPerUnit)} → ${formatRub(alt.costPerUnit)} (${formatSigned((dCost / base.costPerUnit) * 100, (v) => formatNumber(v, 1))} %).`,
    })
  }

  if (alt.bottleneckCount === 0 && base.bottleneckCount > 0) {
    out.push({ tone: 'better', text: 'Перегруженных участков (загрузка ≥ 95 %) не остаётся.' })
  } else if (alt.bottleneckCount > base.bottleneckCount) {
    out.push({ tone: 'worse', text: `Перегруженных участков становится больше: ${base.bottleneckCount} → ${alt.bottleneckCount}.` })
  }
  return out
}
