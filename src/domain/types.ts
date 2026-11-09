/**
 * Доменная модель: предприятие → участки (этапы процесса) → ресурсы → сценарии → результаты расчёта,
 * а также объекты 3D-тура (точки интереса, маршрут, кейсы) и пользователи.
 * Эти типы — контракт между демо-данными, движком расчёта и интерфейсом.
 */

export type StageId = string

/** Склонения единицы ресурса: «1 станок», «2 станка», «5 станков». */
export interface PluralForms {
  one: string
  few: string
  many: string
}

export interface Enterprise {
  id: string
  name: string
  shortName: string
  site: string
  product: {
    name: string
    unit: string
    /** Стоимость материала (заготовки) на единицу запуска, ₽. */
    materialCostPerUnit: number
  }
  shiftsPerDay: number
  hoursPerShift: number
}

/** Неизменяемые характеристики участка (паспорт этапа процесса). */
export interface StageDefinition {
  id: StageId
  /** Код участка на мнемосхеме, например «У-03». */
  code: string
  name: string
  shortName: string
  description: string
  /** Помещение / зона цеха. */
  area: string
  resourceKind: PluralForms
  equipment: string[]
  /** Техническая готовность оборудования (0..1): доля времени без отказов и переналадок. */
  availability: number
  /** Доля годных на выходе участка (0..1). Меньше 1 — на участке отбраковка. */
  yieldRate: number
  /** Переменные затраты на обработку единицы (инструмент, энергия, расходники), ₽. */
  variableCostPerUnit: number
  /** Время транспортировки к следующему участку, мин. */
  transportMinToNext: number
  /** Квадрат коэффициента вариации времени обработки. */
  serviceCv2: number
}

/** Изменяемые параметры участка — то, что пользователь меняет в сценарии. */
export interface StageParams {
  /** Количество параллельных ресурсов (станков, постов, бригад). */
  resources: number
  /** Норма времени операции на единицу одним ресурсом, мин. */
  opTimeMin: number
  /** Скорость обработки относительно нормы (1 = 100 %). */
  speedFactor: number
  /** Стоимость часа работы одного ресурса, ₽. */
  costPerHour: number
}

export interface ScenarioParams {
  /** Производственная нагрузка: запуск заготовок в час. */
  loadPerHour: number
  /** Рабочих часов в сутки. */
  hoursPerDay: number
  stages: Record<StageId, StageParams>
}

export type ScenarioKind = 'baseline' | 'preset' | 'user'

export interface Scenario {
  id: string
  name: string
  description: string
  kind: ScenarioKind
  params: ScenarioParams
  createdAt: string
  updatedAt: string
}

export type StageStatus = 'bottleneck' | 'high' | 'normal' | 'idle'

export interface StageResult {
  stageId: StageId
  /** Эффективное время на единицу с учётом скорости и готовности, мин. */
  effectiveOpTimeMin: number
  /** Мощность участка, шт/ч. */
  capacityPerHour: number
  /** Поступление на участок, шт/ч. */
  inflowPerHour: number
  /** Фактически обработано, шт/ч. */
  processedPerHour: number
  /** Выход годных на следующий участок, шт/ч. */
  outflowPerHour: number
  utilization: number
  idleShare: number
  /** Участок перегружен: поступление выше мощности, задел растёт. */
  saturated: boolean
  /** Скорость роста задела перед участком при перегрузке, шт/ч. */
  backlogGrowthPerHour: number
  /** Среднее ожидание в очереди, мин. */
  waitMin: number
  /** Время обработки единицы (эффективное), мин. */
  processMin: number
  transportMin: number
  /** Средняя очередь перед участком за сутки, шт. */
  queueLength: number
  /** Установившаяся (стохастическая) часть очереди без накопления задела, шт. */
  steadyQueueLength: number
  /** Незавершённое производство на участке (очередь + в обработке), шт. */
  wip: number
  status: StageStatus
  /** Расходы на ресурсы участка, ₽/ч (платятся и в простое). */
  resourceCostPerHour: number
  variableCostPerHour: number
  /** Стоимость операции на одну обработанную единицу, ₽. */
  costPerUnit: number
  /** Стоимость простаивающих ресурсов, ₽/ч. */
  idleCostPerHour: number
  /** Квадрат коэффициента вариации поступления на участок. */
  arrivalCv2: number
}

export interface SimulationResult {
  params: ScenarioParams
  stages: StageResult[]
  /** Выпуск годных, шт/ч. */
  outputPerHour: number
  outputPerDay: number
  /** План выпуска годных при заданной нагрузке, шт/сут. */
  plannedOutputPerDay: number
  planAttainment: number
  /** Недовыпуск относительно плана, шт/сут. */
  shortfallPerDay: number
  /** Время производственного цикла, мин. */
  cycleTimeMin: number
  wip: number
  /** Средневзвешенная загрузка ресурсов (по числу ресурсов). */
  avgUtilization: number
  /** Ограничение линии — участок с максимальной загрузкой. */
  constraintStageId: StageId
  constraintUtilization: number
  bottleneckCount: number
  riskCount: number
  idleCount: number
  saturated: boolean
  operatingCostPerDay: number
  materialCostPerDay: number
  /** Полная себестоимость годной единицы (операции + материал), ₽. */
  costPerUnit: number
  /** Стоимость переработки годной единицы (без материала), ₽. */
  conversionCostPerUnit: number
  idleCostPerDay: number
}

/** Сводка показателей для журнала прогонов и сравнения. */
export interface KpiSummary {
  outputPerHour: number
  outputPerDay: number
  cycleTimeMin: number
  avgUtilization: number
  constraintStageId: StageId
  constraintUtilization: number
  costPerUnit: number
  operatingCostPerDay: number
  wip: number
  shortfallPerDay: number
  bottleneckCount: number
}

export interface ScenarioRun {
  id: string
  scenarioId: string
  scenarioName: string
  ranAt: string
  durationMs: number
  summary: KpiSummary
  baselineSummary: KpiSummary
}

/* ───────────── 3D-тур ───────────── */

export type Vec3 = [number, number, number]

export interface CameraView {
  position: Vec3
  target: Vec3
}

/** Кейс / лучшая практика, привязанная к участку и метрике. */
export interface PracticeCase {
  id: string
  title: string
  summary: string
  metric: {
    label: string
    before: number
    after: number
    unit: string
    /** true — уменьшение значения является улучшением. */
    lowerIsBetter: boolean
  }
}

export type PoiMetricKey = 'utilization' | 'capacity' | 'throughput' | 'wait' | 'resources' | 'costPerUnit' | 'status'

export interface PointOfInterest {
  id: string
  /** Связанный этап процесса. Отсутствует у обзорных точек. */
  stageId?: StageId
  title: string
  subtitle: string
  description: string
  /** Позиция метки в сцене. */
  anchor: Vec3
  view: CameraView
  metrics: PoiMetricKey[]
  practiceCase?: PracticeCase
  /** Ключевые факты для экскурсии. */
  facts: string[]
  media?: { src: string; alt: string }[]
}

export interface TourRoute {
  id: string
  name: string
  description: string
  stops: string[]
}

/* ───────────── Пользователи ───────────── */

export type Role = 'manager' | 'guest'

/** Пользователь, как его возвращает сервер авторизации (без персональных данных). */
export interface AppUser {
  id: number
  login: string
  role: Role
}

export const ROLE_LABEL: Record<Role, string> = {
  manager: 'Руководитель',
  guest: 'Гость экскурсии',
}

export const ROLE_ACCESS: Record<Role, string> = {
  manager: 'Полный доступ',
  guest: 'Только 3D-тур',
}
