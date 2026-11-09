/**
 * Формулы теории очередей для многоканального участка G/G/c
 * (аппроксимация Кингмана — Сакасегавы и уравнение связи потоков, Hopp & Spearman, «Factory Physics»).
 * Все функции чистые и детерминированные.
 */

export interface QueueInput {
  /** Квадрат коэффициента вариации поступления. */
  ca2: number
  /** Квадрат коэффициента вариации обслуживания. */
  cs2: number
  /** Загрузка 0..1 (должна быть < 1). */
  rho: number
  /** Число параллельных ресурсов. */
  servers: number
  /** Эффективное время обслуживания одной единицы, мин. */
  te: number
}

/**
 * Среднее ожидание в очереди, мин:
 * Wq ≈ (ca² + cs²) / 2 · ρ^(√(2(c+1)) − 1) / (c · (1 − ρ)) · te
 */
export function waitInQueue({ ca2, cs2, rho, servers, te }: QueueInput): number {
  if (rho <= 0 || servers <= 0 || te <= 0) return 0
  if (rho >= 1) return Number.POSITIVE_INFINITY
  const variability = (ca2 + cs2) / 2
  const utilizationTerm = Math.pow(rho, Math.sqrt(2 * (servers + 1)) - 1) / (servers * (1 - rho))
  return variability * utilizationTerm * te
}

/**
 * Квадрат коэффициента вариации выходящего потока (передаётся на следующий участок):
 * cd² = 1 + (1 − ρ²)(ca² − 1) + ρ²(cs² − 1) / √c
 */
export function departureCv2({ ca2, cs2, rho, servers }: Omit<QueueInput, 'te'>): number {
  if (servers <= 0) return ca2
  const r = Math.min(Math.max(rho, 0), 1)
  const value = 1 + (1 - r * r) * (ca2 - 1) + (r * r * (cs2 - 1)) / Math.sqrt(servers)
  return Math.max(value, 0)
}
