import type { ReactNode } from 'react'

export interface TooltipRow {
  key: string
  label: string
  value: string
  color: string
  /** Ключ серии: линия или прямоугольник (как в легенде). */
  shape?: 'line' | 'rect'
}

interface ChartTooltipBoxProps {
  title: ReactNode
  rows: TooltipRow[]
  footer?: ReactNode
}

/** Подсказка графика: значение ведёт, подпись вторична; ключ серии — короткий штрих её цвета. */
export function ChartTooltipBox({ title, rows, footer }: ChartTooltipBoxProps) {
  return (
    <div className="min-w-[180px] rounded-md border border-line bg-surface px-3 py-2 shadow-[0_8px_24px_rgb(16_24_32/0.12)]">
      <p className="mb-1.5 text-xs font-medium text-muted">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-xs">
            <span
              className={r.shape === 'rect' ? 'size-2 rounded-[2px]' : 'h-0.5 w-3 rounded-full'}
              style={{ backgroundColor: r.color }}
              aria-hidden
            />
            <span className="tnum font-semibold text-ink">{r.value}</span>
            <span className="text-muted">{r.label}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 border-t border-line pt-1.5 text-2xs text-muted">{footer}</div>}
    </div>
  )
}

/** Минимальный тип пропсов, которые Recharts передаёт в content подсказки. */
export interface RechartsTooltipProps<T> {
  active?: boolean
  label?: string | number
  payload?: ReadonlyArray<{ payload?: T; dataKey?: unknown; value?: unknown; name?: unknown }>
}

export function ChartLegend({ items }: { items: { label: string; color: string; shape?: 'line' | 'rect' | 'dash' }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.shape === 'rect' ? (
            <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: i.color }} aria-hidden />
          ) : i.shape === 'dash' ? (
            <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} aria-hidden />
          ) : (
            <span className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: i.color }} aria-hidden />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  )
}
