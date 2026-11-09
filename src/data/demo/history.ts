/**
 * ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ: история работы линии за 30 рабочих дней.
 * Заданы только ВХОДНЫЕ ряды (нагрузка и готовность оборудования по дням).
 * Все показатели (выпуск, время цикла, загрузка, затраты) вычисляются тем же движком,
 * что и сценарии, поэтому история согласована с моделью. Последний день = базовый режим.
 */
import { simulate } from '@/domain/simulation/engine'
import type { SimulationResult } from '@/domain/types'
import { BASELINE_PARAMS, LINE_MODEL } from './enterprise'

/** Запуск заготовок, шт/ч. */
const LOAD = [
  22.0, 22.4, 22.8, 23.0, 22.6, 22.0, 22.5, 23.2, 23.4, 23.0, 22.8, 23.0, 23.5, 23.6, 23.0, 22.4, 22.8, 23.0, 23.3,
  23.6, 23.8, 23.4, 23.0, 22.9, 23.1, 23.4, 23.6, 23.2, 23.0, 23.0,
]

/** Готовность обрабатывающих центров (доля времени без отказов и переналадок). */
const MACHINING_AVAILABILITY = [
  0.89, 0.88, 0.9, 0.87, 0.88, 0.86, 0.89, 0.88, 0.85, 0.88, 0.9, 0.88, 0.87, 0.74, 0.82, 0.88, 0.89, 0.88, 0.87,
  0.86, 0.88, 0.85, 0.89, 0.88, 0.87, 0.88, 0.86, 0.88, 0.89, 0.88,
]

/** Готовность КИМ на участке ОТК. */
const INSPECTION_AVAILABILITY = [
  0.94, 0.94, 0.93, 0.94, 0.94, 0.92, 0.94, 0.94, 0.94, 0.9, 0.94, 0.94, 0.94, 0.94, 0.94, 0.93, 0.94, 0.94, 0.94,
  0.92, 0.94, 0.94, 0.94, 0.94, 0.93, 0.94, 0.94, 0.94, 0.94, 0.94,
]

/** Значимые события периода (индекс дня → описание). */
const EVENTS: Record<number, string> = {
  13: 'Отказ шпинделя ОЦ-3, внеплановый ремонт 9 ч',
  14: 'Работа ОЦ-3 после ремонта на сниженных режимах',
  9: 'Калибровка КИМ, ОТК работает с ограничением',
}

export interface HistoryDay {
  date: string
  index: number
  load: number
  machiningAvailability: number
  inspectionAvailability: number
  event?: string
  result: SimulationResult
}

function workingDaysEndingAt(end: Date, count: number): Date[] {
  const days: Date[] = []
  const cursor = new Date(end)
  cursor.setHours(12, 0, 0, 0)
  while (days.length < count) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) days.unshift(new Date(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return days
}

function buildHistory(): HistoryDay[] {
  const dates = workingDaysEndingAt(new Date(), LOAD.length)
  return LOAD.map((load, index) => {
    const model = {
      ...LINE_MODEL,
      stages: LINE_MODEL.stages.map((s) =>
        s.id === 'machining'
          ? { ...s, availability: MACHINING_AVAILABILITY[index] }
          : s.id === 'inspection'
            ? { ...s, availability: INSPECTION_AVAILABILITY[index] }
            : s,
      ),
    }
    const result = simulate(model, { ...BASELINE_PARAMS, loadPerHour: load })
    return {
      date: dates[index].toISOString(),
      index,
      load,
      machiningAvailability: MACHINING_AVAILABILITY[index],
      inspectionAvailability: INSPECTION_AVAILABILITY[index],
      event: EVENTS[index],
      result,
    }
  })
}

export const HISTORY: HistoryDay[] = buildHistory()
