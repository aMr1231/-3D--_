import clsx from 'clsx'
import { CircleCheck, CirclePause, OctagonExclamationPoint, TriangleExclamationPoint } from 'lucide-react'
import type { ReactNode } from 'react'
import { STATUS_THRESHOLDS } from '@/config/app'
import { formatPercent } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { StageStatus } from '@/domain/types'

export const STATUS_ICON = {
  bottleneck: OctagonExclamationPoint,
  high: TriangleExclamationPoint,
  normal: CircleCheck,
  idle: CirclePause,
} as const

export const STATUS_TEXT: Record<StageStatus, string> = {
  bottleneck: 'text-crit',
  high: 'text-warn',
  normal: 'text-ok',
  idle: 'text-idle',
}

export const STATUS_BG: Record<StageStatus, string> = {
  bottleneck: 'bg-crit',
  high: 'bg-warn-mark',
  normal: 'bg-ok',
  idle: 'bg-idle',
}

export const STATUS_SOFT: Record<StageStatus, string> = {
  bottleneck: 'bg-crit-soft text-crit',
  high: 'bg-warn-soft text-warn',
  normal: 'bg-ok-soft text-ok',
  idle: 'bg-idle-soft text-idle',
}

export const STATUS_HEX: Record<StageStatus, string> = {
  bottleneck: '#c0432d',
  high: '#d4952b',
  normal: '#2f8a57',
  idle: '#8794a8',
}

interface StatusIndicatorProps {
  status: StageStatus
  variant?: 'pill' | 'inline' | 'icon'
  label?: string
  className?: string
}

/** Статус всегда передаётся иконкой и текстом, а не только цветом. */
export function StatusIndicator({ status, variant = 'inline', label, className }: StatusIndicatorProps) {
  const Icon = STATUS_ICON[status]
  const text = label ?? STATUS_META[status].label
  if (variant === 'icon') {
    return (
      <span className={clsx('inline-flex', STATUS_TEXT[status], className)} title={text}>
        <Icon className="size-4" aria-hidden />
        <span className="sr-only">{text}</span>
      </span>
    )
  }
  if (variant === 'pill') {
    return (
      <span
        className={clsx(
          'inline-flex h-5 items-center gap-1 rounded-[4px] px-1.5 text-2xs font-medium whitespace-nowrap',
          STATUS_SOFT[status],
          className,
        )}
      >
        <Icon className="size-3" aria-hidden />
        {text}
      </span>
    )
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap', className)}>
      <Icon className={clsx('size-3.5', STATUS_TEXT[status])} aria-hidden />
      <span className="text-ink-2">{text}</span>
    </span>
  )
}

interface MeterProps {
  value: number
  status?: StageStatus
  /** Показывать риски порогов 85 % и 95 %. */
  thresholds?: boolean
  className?: string
  size?: 'sm' | 'md'
  label?: string
}

/** Индикатор загрузки: заполнение по статусу, светлая дорожка, отметки порогов. */
export function Meter({ value, status = 'normal', thresholds = true, className, size = 'sm', label }: MeterProps) {
  const pct = Math.max(0, Math.min(value, 1)) * 100
  return (
    <div
      className={clsx('relative w-full overflow-hidden rounded-full bg-sunken', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label ?? `Загрузка ${formatPercent(value)}`}
    >
      <div className={clsx('h-full rounded-full transition-[width] duration-300', STATUS_BG[status])} style={{ width: `${pct}%` }} />
      {thresholds && (
        <>
          <span className="absolute inset-y-0 w-px bg-surface" style={{ left: `${STATUS_THRESHOLDS.high * 100}%` }} />
          <span className="absolute inset-y-0 w-px bg-surface" style={{ left: `${STATUS_THRESHOLDS.bottleneck * 100}%` }} />
        </>
      )}
    </div>
  )
}

export function StageCode({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'code-tag inline-flex h-[18px] items-center rounded-[3px] border border-line bg-subtle px-1 text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
