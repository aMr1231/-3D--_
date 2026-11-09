import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { LineDiagram } from '@/components/LineDiagram'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Meter, STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES, getStage } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import { lineHealth } from '@/domain/insights'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'

/** Состояние линии: вывод одной фразой, главная цифра выпуска, ограничение и живая мнемосхема. */
export function LineStatus({ result }: { result: SimulationResult }) {
  const health = lineHealth(result)
  const Icon = STATUS_ICON[health.tone]
  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const navigate = useNavigate()
  const behind = result.planAttainment < 0.995

  return (
    <section aria-labelledby="line-status-title" className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid gap-x-12 gap-y-8 p-5 md:p-8 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] xl:items-center">
        <div className="min-w-0 space-y-7">
          <h2 id="line-status-title" className="flex items-center gap-2.5 text-15 font-semibold text-ink">
            <Icon className={clsx('size-5 shrink-0', STATUS_TEXT[health.tone])} aria-hidden />
            {health.title}
          </h2>
          <div>
            <p className="text-13 text-muted">Выпуск за сутки</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="tnum text-display font-semibold text-ink">
                <AnimatedNumber value={result.outputPerDay} format={(v) => formatNumber(v, 0)} countUpOnMount />
              </span>
              <span className="text-15 text-muted">шт</span>
            </p>
            <p className="tnum mt-3 text-sm text-muted">
              из {formatNumber(result.plannedOutputPerDay, 0)} по плану ·{' '}
              <span className={clsx('font-medium', behind ? 'text-crit' : 'text-ok')}>{formatPercent(result.planAttainment, 1)}</span>
            </p>
          </div>
          <Link
            to={`/twin?stage=${constraintDef.id}`}
            className="group inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            Ограничение —<span className="font-medium text-ink-2 group-hover:text-ink">{constraintDef.shortName}</span>
            <span className={clsx('tnum font-medium', STATUS_TEXT[constraint.status])}>{formatPercent(constraint.utilization)}</span>
            <ChevronRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className="hidden min-w-0 lg:block">
          <LineDiagram result={result} theme="light" onSelect={(id) => navigate(`/twin?stage=${id}`)} className="w-full overflow-visible" />
        </div>
      </div>

      <ol className="scrollbar-thin flex gap-6 overflow-x-auto px-5 pb-5 md:grid md:grid-cols-3 md:gap-y-6 md:overflow-visible md:px-8 md:pb-8 lg:hidden" aria-label="Участки линии по ходу процесса">
        {STAGES.map((def, i) => {
          const s = result.stages[i]
          return (
            <li key={def.id} className="min-w-[112px] flex-1 md:min-w-0">
              <Link
                to={`/twin?stage=${def.id}`}
                className="block space-y-2 py-1"
                aria-label={`${def.name}: ${STATUS_META[s.status].label}, загрузка ${formatPercent(s.utilization)}. Открыть на схеме`}
              >
                <p className="truncate text-13 font-medium text-ink">{def.shortName}</p>
                <p className={clsx('tnum text-sm font-semibold', STATUS_TEXT[s.status])}>{formatPercent(s.utilization)}</p>
                <Meter value={s.utilization} status={s.status} />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
