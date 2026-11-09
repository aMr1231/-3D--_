import { describe, expect, it } from 'vitest'
import { STAGES } from '@/data/demo/enterprise'
import { PRESET_SCENARIOS } from '@/data/demo/scenarios'
import { sanitizePersisted } from './persistence'

const baseline = PRESET_SCENARIOS[0]
const ids = STAGES.map((s) => s.id)
const preset = PRESET_SCENARIOS[1]

describe('восстановление сохранённых сценариев', () => {
  it('корректные данные проходят без изменений, базовый сценарий берётся из кода', () => {
    const r = sanitizePersisted({ scenarios: [preset], runs: [], activeScenarioId: preset.id }, baseline, ids)!
    expect(r.scenarios.map((s) => s.id)).toEqual([baseline.id, preset.id])
    expect(r.activeScenarioId).toBe(preset.id)
    expect(r.recovered).toBe(false)
  })

  it('повреждённый сценарий отбрасывается и отмечается восстановление', () => {
    const broken = { ...preset, id: 'x', params: { ...preset.params, loadPerHour: 'много' } }
    const r = sanitizePersisted({ scenarios: [preset, broken], runs: [] }, baseline, ids)!
    expect(r.scenarios.map((s) => s.id)).toEqual([baseline.id, preset.id])
    expect(r.recovered).toBe(true)
  })

  it('недопустимые значения параметров (0 ресурсов, отрицательное время) отклоняются', () => {
    const bad = {
      ...preset,
      id: 'y',
      params: { ...preset.params, stages: { ...preset.params.stages, machining: { ...preset.params.stages.machining, resources: 0 } } },
    }
    const r = sanitizePersisted({ scenarios: [bad], runs: [] }, baseline, ids)!
    expect(r.scenarios).toHaveLength(1)
    expect(r.recovered).toBe(true)
  })

  it('подменённый «базовый» сценарий из хранилища игнорируется', () => {
    const fake = { ...baseline, params: { ...baseline.params, loadPerHour: 99 } }
    const r = sanitizePersisted({ scenarios: [fake], runs: [] }, baseline, ids)!
    expect(r.scenarios[0].params.loadPerHour).toBe(baseline.params.loadPerHour)
  })

  it('неизвестный активный сценарий заменяется базовым; мусор вместо объекта — состояние по умолчанию', () => {
    expect(sanitizePersisted({ scenarios: [], runs: [], activeScenarioId: 'нет' }, baseline, ids)!.activeScenarioId).toBe(baseline.id)
    expect(sanitizePersisted('мусор', baseline, ids)).toBeNull()
    expect(sanitizePersisted({ scenarios: 'x', runs: null }, baseline, ids)!.recovered).toBe(true)
  })
})
