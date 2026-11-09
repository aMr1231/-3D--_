/**
 * Цвета графиков. Категориальная палитра участков проверена валидатором (светлая тема, поверхность #fff):
 * полоса светлоты, порог насыщенности, CVD ΔE ≥ 8 для соседних, нормальное зрение ΔE ≥ 15, контраст ≥ 3:1.
 * Цвет закреплён за участком (сущностью), а не за порядком серии.
 */
export const STAGE_COLORS: Record<string, string> = {
  receiving: '#1b7fa6',
  preparation: '#eb6834',
  machining: '#6250d6',
  inspection: '#9c7a00',
  packaging: '#d55181',
  shipping: '#2f4f8f',
}

export const CHART = {
  primary: '#1b7fa6',
  primarySoft: '#a9cfdf',
  base: '#a3abb5',
  secondary: '#eb6834',
  neutral: '#c5cbd2',
  grid: '#f0f0f3',
  axis: '#e2e2e7',
  tick: '#8b8b94',
  ink: '#111113',
  muted: '#6b6b73',
  ok: '#2f8a57',
  warn: '#d4952b',
  crit: '#c0432d',
  idle: '#8794a8',
} as const

export const AXIS_TICK = { fill: CHART.tick, fontSize: 12 } as const
