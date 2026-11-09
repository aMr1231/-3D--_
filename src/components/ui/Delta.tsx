import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { formatNumber } from '@/domain/format'
import { METRICS, type MetricDelta } from '@/domain/metrics'

const VERDICT_CLASS = {
  better: 'text-ok',
  worse: 'text-crit',
  same: 'text-faint',
  changed: 'text-muted',
} as const

const VERDICT_LABEL = {
  better: 'улучшение',
  worse: 'ухудшение',
  same: 'без изменений',
  changed: 'изменение',
} as const

interface DeltaProps {
  delta: MetricDelta
  /** Показывать относительное изменение в процентах. */
  showShare?: boolean
  showAbsolute?: boolean
  className?: string
}

/** Индикатор изменения метрики: направление, величина и оценка «лучше/хуже» с учётом смысла метрики. */
export function Delta({ delta, showShare = true, showAbsolute = true, className }: DeltaProps) {
  const def = METRICS[delta.key]
  const Icon = delta.verdict === 'same' ? Minus : delta.delta > 0 ? ArrowUpRight : ArrowDownRight
  const sign = delta.delta > 0 ? '+' : delta.delta < 0 ? '−' : ''
  const share =
    delta.deltaShare !== null && showShare && delta.verdict !== 'same'
      ? `${sign}${formatNumber(Math.abs(delta.deltaShare) * 100, Math.abs(delta.deltaShare) < 0.1 ? 1 : 0)} %`
      : null
  return (
    <span
      className={clsx('tnum inline-flex items-center gap-0.5 text-13 font-medium whitespace-nowrap', VERDICT_CLASS[delta.verdict], className)}
      title={VERDICT_LABEL[delta.verdict]}
    >
      <Icon className="size-4" aria-hidden />
      {delta.verdict === 'same' ? (
        <span className="font-normal">без изм.</span>
      ) : (
        <>
          {showAbsolute && <span>{`${sign}${def.formatDelta(Math.abs(delta.delta))}`}</span>}
          {share && <span className={clsx(showAbsolute && 'opacity-75')}>{showAbsolute ? `(${share})` : share}</span>}
        </>
      )}
      <span className="sr-only">, {VERDICT_LABEL[delta.verdict]}</span>
    </span>
  )
}
