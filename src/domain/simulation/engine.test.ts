import { describe, expect, it } from 'vitest'
import { BASELINE_PARAMS, LINE_MODEL } from '@/data/demo/enterprise'
import { HISTORY } from '@/data/demo/history'
import { PRESET_SCENARIOS } from '@/data/demo/scenarios'
import { compareMetric, compareSummaries } from '../metrics'
import type { ScenarioParams } from '../types'
import { queueProfile, simulate, summarize } from './engine'
import { departureCv2, waitInQueue } from './queueing'
import { resourceSensitivity } from './sensitivity'

function withStage(params: ScenarioParams, id: string, patch: Partial<ScenarioParams['stages'][string]>): ScenarioParams {
  return { ...params, stages: { ...params.stages, [id]: { ...params.stages[id], ...patch } } }
}

const stage = (r: ReturnType<typeof simulate>, id: string) => r.stages.find((s) => s.stageId === id)!

describe('формулы очередей', () => {
  it('ожидание растёт с загрузкой и обращается в 0 без нагрузки', () => {
    const base = { ca2: 0.5, cs2: 0.5, servers: 2, te: 5 }
    expect(waitInQueue({ ...base, rho: 0 })).toBe(0)
    const w1 = waitInQueue({ ...base, rho: 0.6 })
    const w2 = waitInQueue({ ...base, rho: 0.9 })
    expect(w2).toBeGreaterThan(w1)
    expect(waitInQueue({ ...base, rho: 1 })).toBe(Number.POSITIVE_INFINITY)
  })

  it('М/М/1: формула совпадает с точным решением ρ/(1−ρ)·te', () => {
    const w = waitInQueue({ ca2: 1, cs2: 1, servers: 1, rho: 0.8, te: 10 })
    expect(w).toBeCloseTo((0.8 / 0.2) * 10, 6)
  })

  it('при загрузке 1 выходной поток повторяет вариацию обслуживания (c = 1)', () => {
    expect(departureCv2({ ca2: 0.9, cs2: 0.3, rho: 1, servers: 1 })).toBeCloseTo(0.3, 6)
  })
})

describe('базовый режим (демо-данные)', () => {
  const r = simulate(LINE_MODEL, BASELINE_PARAMS)

  it('ограничение линии — механообработка, она отмечена как узкое место', () => {
    expect(r.constraintStageId).toBe('machining')
    expect(stage(r, 'machining').status).toBe('bottleneck')
    expect(r.bottleneckCount).toBe(1)
  })

  it('ОТК в зоне риска, упаковка недогружена', () => {
    expect(stage(r, 'inspection').status).toBe('high')
    expect(stage(r, 'packaging').status).toBe('idle')
  })

  it('мощность считается как c·60·скорость·готовность / t', () => {
    const m = stage(r, 'machining')
    expect(m.capacityPerHour).toBeCloseTo((4 * 60 * 0.88) / 9, 6)
  })

  it('без перегрузки выпуск = нагрузка × выход годных', () => {
    expect(r.saturated).toBe(false)
    expect(r.outputPerHour).toBeCloseTo(23 * 0.97, 6)
    expect(r.planAttainment).toBeCloseTo(1, 6)
  })

  it('время цикла складывается из ожидания, обработки и транспорта', () => {
    const manual = r.stages.reduce((s, x) => s + x.waitMin + x.processMin + x.transportMin, 0)
    expect(r.cycleTimeMin).toBeCloseTo(manual, 6)
    expect(r.cycleTimeMin).toBeGreaterThan(60)
  })

  it('затраты: ресурсы + переменные, себестоимость включает материал', () => {
    const resources = Object.values(BASELINE_PARAMS.stages).reduce((s, p) => s + p.resources * p.costPerHour, 0)
    expect(r.operatingCostPerDay).toBeGreaterThan(resources * BASELINE_PARAMS.hoursPerDay)
    expect(r.costPerUnit).toBeCloseTo((r.operatingCostPerDay + r.materialCostPerDay) / r.outputPerDay, 6)
  })

  it('последний день истории совпадает с базовым сценарием', () => {
    const last = HISTORY[HISTORY.length - 1].result
    expect(last.outputPerDay).toBeCloseTo(r.outputPerDay, 6)
    expect(last.cycleTimeMin).toBeCloseTo(r.cycleTimeMin, 6)
  })
})

describe('монотонность и предсказуемость', () => {
  const base = simulate(LINE_MODEL, BASELINE_PARAMS)

  it('+1 ресурс снижает загрузку участка и не увеличивает время цикла', () => {
    const r = simulate(LINE_MODEL, withStage(BASELINE_PARAMS, 'machining', { resources: 5 }))
    expect(stage(r, 'machining').utilization).toBeLessThan(stage(base, 'machining').utilization)
    expect(r.cycleTimeMin).toBeLessThan(base.cycleTimeMin)
  })

  it('+1 ОЦ переносит ограничение на ОТК и увеличивает затраты', () => {
    const r = simulate(LINE_MODEL, withStage(BASELINE_PARAMS, 'machining', { resources: 5 }))
    expect(r.constraintStageId).toBe('inspection')
    expect(r.operatingCostPerDay).toBeGreaterThan(base.operatingCostPerDay)
  })

  it('рост нагрузки повышает загрузку всех участков', () => {
    const r = simulate(LINE_MODEL, { ...BASELINE_PARAMS, loadPerHour: 24 })
    for (const s of r.stages) expect(s.utilization).toBeGreaterThanOrEqual(stage(base, s.stageId).utilization)
  })

  it('ускорение обработки сокращает время операции и загрузку', () => {
    const r = simulate(LINE_MODEL, withStage(BASELINE_PARAMS, 'inspection', { speedFactor: 1.2 }))
    expect(stage(r, 'inspection').processMin).toBeLessThan(stage(base, 'inspection').processMin)
    expect(stage(r, 'inspection').utilization).toBeLessThan(stage(base, 'inspection').utilization)
  })

  it('рост ставки ресурса увеличивает себестоимость линейно', () => {
    const r = simulate(LINE_MODEL, withStage(BASELINE_PARAMS, 'packaging', { costPerHour: 880 + 100 }))
    const expected = base.operatingCostPerDay + 2 * 100 * BASELINE_PARAMS.hoursPerDay
    expect(r.operatingCostPerDay).toBeCloseTo(expected, 6)
  })

  it('расчёт детерминирован: одинаковые параметры дают одинаковый результат', () => {
    expect(simulate(LINE_MODEL, BASELINE_PARAMS)).toEqual(simulate(LINE_MODEL, BASELINE_PARAMS))
  })
})

describe('перегрузка (λ > μ)', () => {
  const peak = PRESET_SCENARIOS.find((s) => s.id === 'preset-peak')!
  const r = simulate(LINE_MODEL, peak.params)

  it('выпуск ограничен мощностью узкого места, растёт задел', () => {
    const m = stage(r, 'machining')
    expect(r.saturated).toBe(true)
    expect(m.saturated).toBe(true)
    expect(m.processedPerHour).toBeCloseTo(m.capacityPerHour, 6)
    expect(m.backlogGrowthPerHour).toBeCloseTo(26.5 - m.capacityPerHour, 6)
    expect(r.shortfallPerDay).toBeGreaterThan(0)
    expect(r.planAttainment).toBeLessThan(1)
  })

  it('очередь перед узким местом растёт в течение суток', () => {
    const profile = queueProfile(r)
    expect(profile[profile.length - 1].machining).toBeGreaterThan(profile[0].machining)
  })

  it('комплексный сценарий устраняет перегрузку', () => {
    const plan = PRESET_SCENARIOS.find((s) => s.id === 'preset-peak-plan')!
    const rp = simulate(LINE_MODEL, plan.params)
    expect(rp.saturated).toBe(false)
    expect(rp.bottleneckCount).toBe(0)
    expect(rp.outputPerDay).toBeGreaterThan(r.outputPerDay)
  })
})

describe('сравнение сценариев', () => {
  it('направление улучшения учитывает смысл метрики', () => {
    expect(compareMetric('cycleTimeMin', 120, 90).verdict).toBe('better')
    expect(compareMetric('outputPerDay', 350, 340).verdict).toBe('worse')
    expect(compareMetric('costPerUnit', 5000, 5001).verdict).toBe('same')
    expect(compareMetric('avgUtilization', 0.7, 0.6).verdict).toBe('changed')
  })

  it('сравнение базы с самой собой не даёт изменений', () => {
    const s = summarize(simulate(LINE_MODEL, BASELINE_PARAMS))
    expect(compareSummaries(s, s).every((d) => d.verdict === 'same')).toBe(true)
  })
})

describe('чувствительность', () => {
  it('нельзя убрать последний ресурс; +1 на узком месте сокращает цикл', () => {
    const rows = resourceSensitivity(LINE_MODEL, BASELINE_PARAMS)
    const shipMinus = rows.find((r) => r.stageId === 'shipping' && r.change === -1)!
    expect(shipMinus.feasible).toBe(false)
    const base = simulate(LINE_MODEL, BASELINE_PARAMS)
    const machPlus = rows.find((r) => r.stageId === 'machining' && r.change === 1)!
    expect(machPlus.summary!.cycleTimeMin).toBeLessThan(base.cycleTimeMin)
  })
})
