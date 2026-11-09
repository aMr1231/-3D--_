import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { LineDiagram } from '@/components/LineDiagram'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Meter, STATUS_ICON, STATUS_TEXT, StageCode } from '@/components/ui/Status'
import { STAGES, getStage } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent } from '@/domain/format'
import { lineHealth } from '@/domain/insights'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'

/** Состояние линии: вывод одной фразой, главная цифра выпуска и живая мнемосхема (клик по участку → двойник). */
export function LineStatus({ result }: { result: SimulationResult }) {
  const health = lineHealth(result)
  const Icon = STATUS_ICON[health.tone]
  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const navigate = useNavigate()

  return (
    <section aria-labelledby="line-status-title" className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="grid gap-x-8 gap-y-4 px-4 py-4 md:px-5 xl:grid-cols-[minmax(260px,330px)_minmax(0,1fr)] xl:items-center">
        <div className="min-w-0 space-y-4">
          <div className="flex min-w-0 items-start gap-3">
            <Icon className={clsx('mt-0.5 size-5 shrink-0', STATUS_TEXT[health.tone])} aria-hidden />
            <div className="min-w-0">
              <h2 id="line-status-title" className="text-[15px] font-semibold text-ink">
                {health.title}
              </h2>
              <p className="mt-0.5 text-13 text-muted">
                Ограничение линии — <span className="font-medium text-ink-2">{constraintDef.code} {constraintDef.name}</span>:
                загрузка {formatPercent(constraint.utilization)}, очередь ≈ {formatNumber(constraint.queueLength, 0)} шт,
                ожидание {formatDuration(constraint.waitMin)}.
              </p>
            </div>
          </div>
          <div className="pl-8">
            <p className="text-xs text-muted">Выпуск за сутки</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[38px] leading-none font-semibold tracking-[-0.03em] text-ink">
                <AnimatedNumber value={result.outputPerDay} format={(v) => formatNumber(v, 0)} countUpOnMount />
              </span>
              <span className="text-13 text-muted">шт</span>
            </p>
            <p className="tnum mt-1.5 text-xs text-muted">
              план {formatNumber(result.plannedOutputPerDay, 0)} шт ·{' '}
              <span className={clsx('font-medium', result.planAttainment < 0.995 ? 'text-crit' : 'text-ok')}>
                выполнение {formatPercent(result.planAttainment, 1)}
              </span>
            </p>
          </div>
        </div>
        <div className="hidden min-w-0 md:block">
          <LineDiagram result={result} theme="light" onSelect={(id) => navigate(`/twin?stage=${id}`)} className="w-full overflow-visible" />
          <p className="mt-1 text-right text-2xs text-faint">Нажмите на участок, чтобы открыть его на схеме двойника</p>
        </div>
      </div>

      <ol className="scrollbar-thin flex overflow-x-auto border-t border-line md:hidden" aria-label="Участки линии по ходу процесса">
        {STAGES.map((def, i) => {
          const s = result.stages[i]
          const SIcon = STATUS_ICON[s.status]
          return (
            <li key={def.id} className="relative min-w-[150px] flex-1 border-r border-line last:border-r-0">
              <Link
                to={`/twin?stage=${def.id}`}
                className="group flex h-full flex-col gap-2 px-3.5 py-3 transition-colors hover:bg-subtle"
                aria-label={`${def.code} ${def.name}: ${STATUS_META[s.status].label}, загрузка ${formatPercent(s.utilization)}. Открыть на схеме`}
              >
                <div className="flex items-center justify-between gap-2">
                  <StageCode>{def.code}</StageCode>
                  <SIcon className={clsx('size-3.5', STATUS_TEXT[s.status])} aria-hidden />
                </div>
                <p className="truncate text-13 font-medium text-ink">{def.shortName}</p>
                <div className="mt-auto space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted">{STATUS_META[s.status].short}</span>
                    <span className="tnum font-medium text-ink-2">{formatPercent(s.utilization)}</span>
                  </div>
                  <Meter value={s.utilization} status={s.status} />
                </div>
              </Link>
              {i < STAGES.length - 1 && (
                <span className="absolute top-1/2 -right-[7px] z-10 flex size-3.5 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-faint" aria-hidden>
                  <ChevronRight className="size-2.5" />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
