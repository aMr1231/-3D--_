/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ: предустановленные сценарии.
 * Показывают, как узкое место «переезжает» между участками при изменениях.
 */
import type { Scenario, ScenarioParams } from '@/domain/types'
import { BASELINE_PARAMS } from './enterprise'

export const BASELINE_SCENARIO_ID = 'baseline'

function withStages(base: ScenarioParams, patch: Partial<Record<string, Partial<ScenarioParams['stages'][string]>>>): ScenarioParams {
  const stages = { ...base.stages }
  for (const [id, value] of Object.entries(patch)) {
    stages[id] = { ...stages[id], ...value }
  }
  return { ...base, stages }
}

const CREATED = '2026-01-12T09:00:00.000Z'

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: BASELINE_SCENARIO_ID,
    name: 'Базовый режим',
    description: 'Текущие параметры линии: 2 смены, запуск 23 заготовки в час, 4 обрабатывающих центра.',
    kind: 'baseline',
    params: BASELINE_PARAMS,
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'preset-cnc5',
    name: '+1 обрабатывающий центр',
    description: 'Ввод пятого ОЦ на механическом участке при текущей нагрузке.',
    kind: 'preset',
    params: withStages(BASELINE_PARAMS, { machining: { resources: 5 } }),
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'preset-peak',
    name: 'Пиковая нагрузка +15 %',
    description: 'Новый контракт: запуск 26,5 заготовки в час без изменения ресурсов.',
    kind: 'preset',
    params: { ...BASELINE_PARAMS, loadPerHour: 26.5 },
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'preset-peak-plan',
    name: 'Пик: ОЦ-5 и ускорение ОТК',
    description:
      'Комплекс мер под новый контракт: пятый ОЦ, оптимизированные программы измерений КИМ (+20 %), новое полотно пил (+15 %).',
    kind: 'preset',
    params: withStages(
      { ...BASELINE_PARAMS, loadPerHour: 26.5 },
      {
        machining: { resources: 5 },
        inspection: { speedFactor: 1.2 },
        preparation: { speedFactor: 1.15 },
      },
    ),
    createdAt: CREATED,
    updatedAt: CREATED,
  },
]
