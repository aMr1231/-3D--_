import clsx from 'clsx'
import { CircleX } from 'lucide-react'
import type { ReactNode } from 'react'

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-md bg-sunken', className)} aria-hidden />
}

/** Скелетон раздела на время загрузки чанка. */
export function PageSkeleton({ variant = 'page' }: { variant?: 'page' | 'canvas' }) {
  if (variant === 'canvas') {
    return (
      <div className="flex h-full items-center justify-center bg-subtle" role="status" aria-label="Загрузка раздела">
        <div className="w-56 space-y-2 text-center">
          <div className="relative h-0.5 overflow-hidden rounded bg-line">
            <div className="absolute inset-y-0 w-1/3 animate-progress bg-accent" />
          </div>
          <p className="text-xs text-muted">Загрузка раздела…</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-5 p-4 md:p-6" role="status" aria-label="Загрузка раздела">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 flex size-9 items-center justify-center rounded-md border border-line bg-subtle text-muted [&_svg]:size-4">{icon}</div>}
      <p className="text-13 font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-[320px] text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function ErrorState({ title, description, actions, className }: ErrorStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-6 py-12 text-center', className)} role="alert">
      <div className="mb-3 flex size-9 items-center justify-center rounded-md border border-crit/25 bg-crit-soft text-crit">
        <CircleX className="size-4" />
      </div>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {description && <div className="mt-1 max-w-[420px] text-13 text-muted">{description}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
