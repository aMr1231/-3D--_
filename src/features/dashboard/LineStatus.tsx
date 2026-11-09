import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { LineDiagram } from '@/components/LineDiagram'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Meter, STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES, getStage } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult, StageStatus } from '@/domain/types'

/** Состояние линии простыми словами: что происходит и где узкое место. */
function headline(result: SimulationResult, constraintName: string): { tone: StageStatus; title: string } {
  if (result.saturated) return { tone: 'bottleneck', title: 'Линия не успевает выполнить план' }
  if (result.bottleneckCount > 0) return { tone: 'bottleneck', title: `${constraintName} — узкое место линии` }
  if (result.riskCount > 0) return { tone: 'high', title: 'Линия работает на пределе' }
  return { tone: 'normal', title: 'Линия работает нормально' }
}

/** Главный экран обзора: одна фраза о состоянии, главная цифра выпуска и живая мнемосхема. */
export function LineStatus({ result }: { result: SimulationResult }) {
  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const health = headline(result, constraintDef.shortName)
  const Icon = STATUS_ICON[health.tone]
  const navigate = useNavigate()
  const behind = result.planAttainment < 0.995

  return (
    <section aria-labelledby="line-status-title" className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="grid gap-x-12 gap-y-8 p-6 md:p-8 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:items-center">
        <div className="min-w-0 space-y-8">
          <h2 id="line-status-title" className="flex items-start gap-3 text-xl leading-snug font-semibold text-ink">
            <Icon className={clsx('mt-1 size-5 shrink-0', STATUS_TEXT[health.tone])} aria-hidden />
            {health.title}
          </h2>
          <div>
            <p className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="tnum text-display font-semibold text-ink">
                <AnimatedNumber value={result.outputPerDay} format={(v) => formatNumber(v, 0)} countUpOnMount />
              </span>
              <span className="text-heading text-muted">изделий в сутки</span>
            </p>
            <p className="mt-3 text-sm text-muted">
              {behind ? 'Выполнено ' : 'План выполнен на '}
              <span className={clsx('tnum font-semibold', behind ? 'text-crit' : 'text-ok')}>{formatPercent(result.planAttainment, 0)}</span>
              {behind ? ` плана · не хватает ${formatNumber(result.plannedOutputPerDay - result.outputPerDay, 0)} шт` : ''}
            </p>
          </div>
          <Link
            to={health.tone === 'normal' ? '/twin' : `/twin?stage=${constraintDef.id}`}
            className="group inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
          >
            {health.tone === 'normal' ? 'Открыть схему линии' : `Открыть участок на схеме · загрузка ${formatPercent(constraint.utilization)}`}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
        <div className="hidden min-w-0 lg:block">
          <LineDiagram result={result} theme="light" onSelect={(id) => navigate(`/twin?stage=${id}`)} className="w-full overflow-visible" />
        </div>
      </div>

      <ol
        className="scrollbar-thin flex gap-6 overflow-x-auto px-6 pb-6 md:grid md:grid-cols-3 md:gap-y-6 md:overflow-visible md:px-8 md:pb-8 lg:hidden"
        aria-label="Участки линии по ходу процесса"
      >
        {STAGES.map((def, i) => {
          const s = result.stages[i]
          return (
            <li key={def.id} className="min-w-[120px] flex-1 md:min-w-0">
              <Link
                to={`/twin?stage=${def.id}`}
                className="block space-y-2 py-1"
                aria-label={`${def.name}: ${STATUS_META[s.status].label}, загрузка ${formatPercent(s.utilization)}. Открыть на схеме`}
              >
                <p className="truncate text-meta font-medium text-ink">{def.shortName}</p>
                <p className={clsx('tnum text-heading font-semibold', STATUS_TEXT[s.status])}>{formatPercent(s.utilization)}</p>
                <Meter value={s.utilization} status={s.status} />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
