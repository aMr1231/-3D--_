/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ. Предприятие вымышленное, значения синтетические,
 * подобраны так, чтобы быть внутренне согласованными. Чтобы подключить реальные данные,
 * замените содержимое этого файла (структура описана в src/domain/types.ts).
 */
import type { LineModel } from '@/domain/simulation/engine'
import type { Enterprise, ScenarioParams, StageDefinition } from '@/domain/types'

export const ENTERPRISE: Enterprise = {
  id: 'demo-plant',
  name: 'Демо-завод корпусных деталей',
  shortName: 'ДЗКД',
  site: 'Цех №1 · линия корпусов редукторов',
  product: {
    name: 'Корпус редуктора КР-160',
    unit: 'шт',
    materialCostPerUnit: 3200,
  },
  shiftsPerDay: 2,
  hoursPerShift: 8,
}

export const STAGES: StageDefinition[] = [
  {
    id: 'receiving',
    code: 'У-01',
    name: 'Приёмка сырья',
    shortName: 'Приёмка',
    description:
      'Входной контроль литых заготовок, проверка сертификатов, маркировка и размещение в адресном хранении.',
    area: 'Склад сырья',
    resourceKind: { one: 'приёмщик', few: 'приёмщика', many: 'приёмщиков' },
    equipment: ['Зона входного контроля', 'Стеллажи адресного хранения, 120 ячеек', 'Электропогрузчик'],
    availability: 0.95,
    yieldRate: 1,
    variableCostPerUnit: 18,
    transportMinToNext: 6,
    serviceCv2: 0.6,
  },
  {
    id: 'preparation',
    code: 'У-02',
    name: 'Подготовка материалов',
    shortName: 'Подготовка',
    description: 'Отрезка литников и прибылей, разметка базовых поверхностей, комплектация заготовок под партию.',
    area: 'Заготовительный участок',
    resourceKind: { one: 'станок', few: 'станка', many: 'станков' },
    equipment: ['Ленточнопильный станок ЛП-1', 'Ленточнопильный станок ЛП-2', 'Стол разметки'],
    availability: 0.92,
    yieldRate: 1,
    variableCostPerUnit: 110,
    transportMinToNext: 5,
    serviceCv2: 0.4,
  },
  {
    id: 'machining',
    code: 'У-03',
    name: 'Механическая обработка',
    shortName: 'Мехобработка',
    description:
      'Фрезерование и расточка посадочных отверстий на 5-осевых обрабатывающих центрах с ЧПУ за одну установку.',
    area: 'Механический участок',
    resourceKind: { one: 'обрабатывающий центр', few: 'обрабатывающих центра', many: 'обрабатывающих центров' },
    equipment: ['Обрабатывающие центры ОЦ-1…ОЦ-4 (5 осей)', 'Централизованная подача СОЖ', 'Инструментальная кладовая'],
    availability: 0.88,
    yieldRate: 1,
    variableCostPerUnit: 360,
    transportMinToNext: 4,
    serviceCv2: 0.35,
  },
  {
    id: 'inspection',
    code: 'У-04',
    name: 'Контроль качества',
    shortName: 'ОТК',
    description:
      'Измерение геометрии на координатно-измерительной машине и визуальный контроль. Несоответствующие изделия отбраковываются.',
    area: 'Лаборатория ОТК',
    resourceKind: { one: 'пост контроля', few: 'поста контроля', many: 'постов контроля' },
    equipment: ['Координатно-измерительная машина (КИМ)', 'Пост визуального контроля', 'Термостатированное помещение'],
    availability: 0.94,
    yieldRate: 0.97,
    variableCostPerUnit: 45,
    transportMinToNext: 3,
    serviceCv2: 0.5,
  },
  {
    id: 'packaging',
    code: 'У-05',
    name: 'Упаковка',
    shortName: 'Упаковка',
    description: 'Консервация, упаковка в стандартизированную тару, маркировка и формирование паллет.',
    area: 'Участок упаковки',
    resourceKind: { one: 'пост упаковки', few: 'поста упаковки', many: 'постов упаковки' },
    equipment: ['Приводной конвейер', 'Два поста упаковки', 'Принтер этикеток'],
    availability: 0.96,
    yieldRate: 1,
    variableCostPerUnit: 230,
    transportMinToNext: 5,
    serviceCv2: 0.3,
  },
  {
    id: 'shipping',
    code: 'У-06',
    name: 'Отгрузка',
    shortName: 'Отгрузка',
    description: 'Комплектация заказов, оформление документов и погрузка паллет в транспорт по графику окон отгрузки.',
    area: 'Отгрузочный док',
    resourceKind: { one: 'бригада', few: 'бригады', many: 'бригад' },
    equipment: ['Докшелтер с уравнительной платформой', 'Зона комплектации', 'Электроштабелёр'],
    availability: 0.95,
    yieldRate: 1,
    variableCostPerUnit: 85,
    transportMinToNext: 0,
    serviceCv2: 0.5,
  },
]

export const LINE_MODEL: LineModel = { enterprise: ENTERPRISE, stages: STAGES }

/** Текущие (базовые) параметры линии — соответствуют последнему дню истории. */
export const BASELINE_PARAMS: ScenarioParams = {
  loadPerHour: 23,
  hoursPerDay: ENTERPRISE.shiftsPerDay * ENTERPRISE.hoursPerShift,
  stages: {
    receiving: { resources: 2, opTimeMin: 4.0, speedFactor: 1, costPerHour: 950 },
    preparation: { resources: 2, opTimeMin: 4.0, speedFactor: 1, costPerHour: 1750 },
    machining: { resources: 4, opTimeMin: 9.0, speedFactor: 1, costPerHour: 4300 },
    inspection: { resources: 2, opTimeMin: 4.5, speedFactor: 1, costPerHour: 2600 },
    packaging: { resources: 2, opTimeMin: 2.5, speedFactor: 1, costPerHour: 880 },
    shipping: { resources: 1, opTimeMin: 1.6, speedFactor: 1, costPerHour: 1500 },
  },
}

export function getStage(id: string | null | undefined): StageDefinition | undefined {
  return id ? STAGES.find((s) => s.id === id) : undefined
}

export function stageIndex(id: string): number {
  return STAGES.findIndex((s) => s.id === id)
}
