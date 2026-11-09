/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ: 3D-тур.
 * Карта точек интереса: точка → участок процесса → метрики двойника → кейс лучшей практики.
 * Координаты — в метрах в системе сцены (ось X — вдоль потока, Z — поперёк цеха, Y — вверх).
 * Значения кейсов демонстрационные и помечены так в интерфейсе.
 */
import type { CameraView, PointOfInterest, TourRoute, Vec3 } from '@/domain/types'

export interface ZoneLayout {
  stageId: string
  /** Центр зоны на полу (x, z). */
  center: [number, number]
  /** Размер зоны (по X, по Z). */
  size: [number, number]
}

/** Планировка цеха: 68 × 32 м, поток слева направо. */
export const HALL = { width: 68, depth: 32, height: 8 } as const

export const ZONES: ZoneLayout[] = [
  { stageId: 'receiving', center: [-27.5, -1], size: [12, 26] },
  { stageId: 'preparation', center: [-15, -1], size: [10, 26] },
  { stageId: 'machining', center: [0, -1], size: [18, 26] },
  { stageId: 'inspection', center: [14.5, -1], size: [9, 26] },
  { stageId: 'packaging', center: [23.5, -1], size: [9, 26] },
  { stageId: 'shipping', center: [31, -1], size: [6, 26] },
]

/** Линия межоперационного транспорта (по ней движутся изделия). */
export const FLOW_PATH: Vec3[] = [
  [-31, 0.55, 9],
  [31.5, 0.55, 9],
]

export const OVERVIEW_VIEW: CameraView = { position: [2, 50, 54], target: [0, 0, -2] }

function viewFor(x: number, z = -1, distance = 1): CameraView {
  return {
    position: [x + 9 * distance, 13 * distance, z + 17 * distance],
    target: [x, 1.2, z],
  }
}

export const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'overview',
    title: 'Цех №1: линия корпусов',
    subtitle: 'Обзор производства',
    description:
      'Линия выпускает корпуса редукторов КР-160: от литой заготовки до отгрузки заказчику. Изделие проходит шесть участков, связанных межоперационным транспортом. Цвет сигнальных ламп на оборудовании показывает загрузку участка по модели цифрового двойника.',
    anchor: [0, 9.5, -14],
    view: OVERVIEW_VIEW,
    metrics: [],
    facts: ['Площадь цеха 2 176 м²', 'Работа в 2 смены по 8 часов', '6 участков, 13 единиц ресурсов в базовом режиме'],
  },
  {
    id: 'receiving',
    stageId: 'receiving',
    title: 'Склад сырья и приёмка',
    subtitle: 'У-01 · Приёмка сырья',
    description:
      'Сюда поступают литые заготовки от поставщиков. Каждая партия проходит входной контроль, получает маркировку и размещается в адресной ячейке, чтобы её можно было быстро найти и передать на подготовку.',
    anchor: [-27.5, 5.2, -6],
    view: viewFor(-27.5, -3),
    metrics: ['status', 'utilization', 'throughput', 'wait', 'resources'],
    facts: ['120 ячеек адресного хранения', 'Входной контроль по сертификату и выборочным замерам'],
    practiceCase: {
      id: 'case-address-storage',
      title: 'Адресное хранение заготовок',
      summary: 'Каждой партии присваивается ячейка и штрихкод. Поиск заготовки больше не зависит от памяти кладовщика.',
      metric: { label: 'Время поиска партии', before: 12, after: 4, unit: 'мин', lowerIsBetter: true },
    },
  },
  {
    id: 'preparation',
    stageId: 'preparation',
    title: 'Заготовительный участок',
    subtitle: 'У-02 · Подготовка материалов',
    description:
      'На ленточнопильных станках отрезают литники и прибыли, затем размечают базовые поверхности. Подготовленные заготовки комплектуются под партию для механообработки.',
    anchor: [-15, 4.6, -3],
    view: viewFor(-15, -2),
    metrics: ['status', 'utilization', 'throughput', 'wait', 'costPerUnit'],
    facts: ['2 ленточнопильных станка', 'Комплектация партий по 12 заготовок'],
    practiceCase: {
      id: 'case-cutting',
      title: 'Оптимизация режимов резания',
      summary: 'Подбор полотна и подачи под сплав снизил время реза и износ инструмента.',
      metric: { label: 'Время реза заготовки', before: 4.7, after: 4.0, unit: 'мин', lowerIsBetter: true },
    },
  },
  {
    id: 'machining',
    stageId: 'machining',
    title: 'Механический участок',
    subtitle: 'У-03 · Механическая обработка',
    description:
      'Ключевой участок линии: 5-осевые обрабатывающие центры фрезеруют и растачивают корпус за одну установку. Это самая дорогая и самая загруженная операция — сигнальные колонны на станках показывают её статус по модели двойника.',
    anchor: [0, 6, -6],
    view: viewFor(0, -1, 1.15),
    metrics: ['status', 'utilization', 'capacity', 'throughput', 'wait', 'resources', 'costPerUnit'],
    facts: ['Обработка за одну установку', 'Точность посадочных отверстий — 7 квалитет'],
    practiceCase: {
      id: 'case-smed',
      title: 'Быстрая переналадка (SMED)',
      summary: 'Предварительная настройка инструмента вне станка и унифицированные приспособления сократили переналадку.',
      metric: { label: 'Переналадка ОЦ', before: 45, after: 28, unit: 'мин', lowerIsBetter: true },
    },
  },
  {
    id: 'inspection',
    stageId: 'inspection',
    title: 'Лаборатория ОТК',
    subtitle: 'У-04 · Контроль качества',
    description:
      'В термостатированном помещении геометрию корпуса измеряют на координатно-измерительной машине. Изделия с отклонениями отбраковываются — сейчас это около 3 % потока.',
    anchor: [14.5, 5.4, -4],
    view: viewFor(14.5, -2),
    metrics: ['status', 'utilization', 'throughput', 'wait', 'costPerUnit'],
    facts: ['Термостатирование 20 ± 1 °C', 'Выход годных 97 %'],
    practiceCase: {
      id: 'case-spc',
      title: 'Статистическое управление процессом',
      summary: 'Контрольные карты по ключевым размерам позволяют подналадить станок до появления брака.',
      metric: { label: 'Доля брака', before: 4.1, after: 3.0, unit: '%', lowerIsBetter: true },
    },
  },
  {
    id: 'packaging',
    stageId: 'packaging',
    title: 'Участок упаковки',
    subtitle: 'У-05 · Упаковка',
    description:
      'Годные корпуса консервируют, укладывают в стандартизированную тару и маркируют. Участок работает с запасом мощности: модель двойника показывает его как резерв при росте нагрузки.',
    anchor: [23.5, 4.2, -3],
    view: viewFor(23.5, -2),
    metrics: ['status', 'utilization', 'throughput', 'resources', 'costPerUnit'],
    facts: ['Приводной конвейер', 'Стандартная тара на 4 корпуса'],
    practiceCase: {
      id: 'case-packaging',
      title: 'Стандартизированная тара',
      summary: 'Ложементы под корпус исключили контакт изделий при транспортировке.',
      metric: { label: 'Повреждения при доставке', before: 0.8, after: 0, unit: '%', lowerIsBetter: true },
    },
  },
  {
    id: 'shipping',
    stageId: 'shipping',
    title: 'Отгрузочный док',
    subtitle: 'У-06 · Отгрузка',
    description:
      'Готовые паллеты комплектуются под заказы и грузятся в транспорт по графику окон отгрузки. Связь с моделью: выпуск линии определяет, сколько паллет отгружается за сутки.',
    anchor: [31, 5, -4],
    view: viewFor(31, -2),
    metrics: ['status', 'utilization', 'throughput', 'resources'],
    facts: ['Докшелтер с уравнительной платформой', 'Окна отгрузки по графику'],
    practiceCase: {
      id: 'case-dock',
      title: 'Окна отгрузки по графику',
      summary: 'Перевозчики бронируют слот заранее, док не простаивает в ожидании машин.',
      metric: { label: 'Простой транспорта у дока', before: 52, after: 34, unit: 'мин', lowerIsBetter: true },
    },
  },
]

export const TOUR_ROUTE: TourRoute = {
  id: 'product-route',
  name: 'Маршрут изделия',
  description: 'От заготовки до отгрузки: семь остановок по ходу производственного потока.',
  stops: ['overview', 'receiving', 'preparation', 'machining', 'inspection', 'packaging', 'shipping'],
}

export function getPoi(id: string | null | undefined): PointOfInterest | undefined {
  return id ? POINTS_OF_INTEREST.find((p) => p.id === id) : undefined
}

export function poiForStage(stageId: string): PointOfInterest | undefined {
  return POINTS_OF_INTEREST.find((p) => p.stageId === stageId)
}
