import clsx from 'clsx'
import type { ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Без внутренних отступов (для таблиц и графиков во всю ширину). */
  flush?: boolean
  as?: 'section' | 'div'
  id?: string
}

export function Panel({ title, subtitle, actions, children, className, bodyClassName, flush, as = 'section', id }: PanelProps) {
  const Tag = as
  return (
    <Tag id={id} className={clsx('min-w-0 rounded-lg border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
          <div className="min-w-0 flex-1 basis-[220px]">
            {title && <h2 className="text-13 font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx(!flush && 'p-4', bodyClassName)}>{children}</div>
    </Tag>
  )
}

interface PageHeaderProps {
  title: string
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 space-y-1">
        {meta && <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{meta}</div>}
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="max-w-[720px] text-13 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Строка «подпись — значение» для панелей деталей. */
export function DataRow({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5" title={hint}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tnum text-right text-13 font-medium text-ink">{value}</dd>
    </div>
  )
}
