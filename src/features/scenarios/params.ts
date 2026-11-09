import type { ScenarioParams, StageParams } from '@/domain/types'

/** Допустимые диапазоны параметров в редакторе сценария. */
export const RANGES = {
  loadPerHour: { min: 10, max: 40, step: 0.5 },
  hoursPerDay: { min: 8, max: 24, step: 1 },
  resources: { min: 1, max: 8, step: 1 },
  speedPercent: { min: 50, max: 150, step: 5 },
  opTimeMin: { min: 0.5, max: 30, step: 0.1 },
  costPerHour: { min: 300, max: 12000, step: 50 },
} as const

export function stageParamsEqual(a: StageParams, b: StageParams): boolean {
  return (
    a.resources === b.resources &&
    Math.abs(a.opTimeMin - b.opTimeMin) < 1e-9 &&
    Math.abs(a.speedFactor - b.speedFactor) < 1e-9 &&
    a.costPerHour === b.costPerHour
  )
}

export function paramsEqual(a: ScenarioParams, b: ScenarioParams): boolean {
  if (a === b) return true
  if (Math.abs(a.loadPerHour - b.loadPerHour) > 1e-9 || a.hoursPerDay !== b.hoursPerDay) return false
  const keys = new Set([...Object.keys(a.stages), ...Object.keys(b.stages)])
  for (const k of keys) {
    if (!a.stages[k] || !b.stages[k] || !stageParamsEqual(a.stages[k], b.stages[k])) return false
  }
  return true
}

/** Количество изменённых параметров относительно базы. */
export function countChanges(base: ScenarioParams, draft: ScenarioParams): number {
  let n = 0
  if (Math.abs(base.loadPerHour - draft.loadPerHour) > 1e-9) n++
  if (base.hoursPerDay !== draft.hoursPerDay) n++
  for (const [id, b] of Object.entries(base.stages)) {
    const d = draft.stages[id]
    if (!d) continue
    if (b.resources !== d.resources) n++
    if (Math.abs(b.opTimeMin - d.opTimeMin) > 1e-9) n++
    if (Math.abs(b.speedFactor - d.speedFactor) > 1e-9) n++
    if (b.costPerHour !== d.costPerHour) n++
  }
  return n
}
