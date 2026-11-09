import clsx from 'clsx'
import type { ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Без внутренних отступов (для таблиц и графиков во всю ширину). */
  flush?: boolean
  as?: 'section' | 'div'
  id?: string
}

/**
 * Карточка раздела: одна тонкая рамка, заголовок без разделителя, щедрые отступы.
 * Пояснения к содержимому живут в «Справке», а не под заголовком.
 */
export function Panel({ title, actions, children, className, bodyClassName, flush, as = 'section', id }: PanelProps) {
  const Tag = as
  return (
    <Tag id={id} className={clsx('min-w-0 rounded-xl border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 md:px-6">
          {title && <h2 className="min-w-0 flex-1 text-15 font-semibold text-ink">{title}</h2>}
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx(!flush && 'px-5 pt-4 pb-5 md:px-6 md:pb-6', flush && (title || actions) && 'pt-3', bodyClassName)}>{children}</div>
    </Tag>
  )
}

interface PageHeaderProps {
  title: ReactNode
  actions?: ReactNode
  className?: string
}

/** Заголовок страницы: только название и действия. */
export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-x-6 gap-y-4', className)}>
      <h1 className="min-w-0 text-title font-semibold text-ink">{title}</h1>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Шапка полноэкранных разделов (схема, 3D-тур, сценарии): заголовок, контролы и необязательная строка сводки. */
export function CanvasHeader({ title, controls, children }: { title: ReactNode; controls?: ReactNode; children?: ReactNode }) {
  return (
    <div className="shrink-0 space-y-4 border-b border-line bg-canvas px-4 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h1 className="min-w-0 text-xl font-semibold text-ink sm:text-title">{title}</h1>
        {controls && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{controls}</div>}
      </div>
      {children}
    </div>
  )
}

/** Контейнер страницы с единой шириной и отступами. */
export function Page({ children, className, width = 'wide' }: { children: ReactNode; className?: string; width?: 'wide' | 'narrow' }) {
  return (
    <div className={clsx('mx-auto space-y-8 px-4 py-6 md:px-8 md:py-8', width === 'wide' ? 'max-w-[1320px]' : 'max-w-[1040px]', className)}>
      {children}
    </div>
  )
}

/** Строка «подпись — значение» для панелей деталей. */
export function DataRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-13 text-muted">{label}</dt>
      <dd className="tnum text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}
