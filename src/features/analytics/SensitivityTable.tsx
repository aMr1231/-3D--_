import clsx from 'clsx'
import { SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Delta } from '@/components/ui/Delta'
import { Panel } from '@/components/ui/Panel'
import { Meter, StageCode, StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL, STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent } from '@/domain/format'
import { compareMetric } from '@/domain/metrics'
import { resourceSensitivity } from '@/domain/simulation/sensitivity'
import { STATUS_SEVERITY } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'

/** Ранжирование перегруженных участков и эффект ±1 ресурса по каждому участку (перерасчёт модели). */
export function SensitivityTable({ result, highlight, scenarioId }: { result: SimulationResult; highlight: string | null; scenarioId: string }) {
  const rows = useMemo(() => resourceSensitivity(LINE_MODEL, result.params), [result.params])
  const ranked = [...STAGES]
    .map((def, i) => ({ def, s: result.stages[i] }))
    .sort((a, b) => STATUS_SEVERITY[b.s.status] - STATUS_SEVERITY[a.s.status] || b.s.utilization - a.s.utilization)

  return (
    <Panel
      title="Перегрузки и чувствительность"
      subtitle="Участки ранжированы по тяжести; эффект рассчитан перерасчётом линии с изменённым числом ресурсов"
      flush
    >
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[880px] text-13">
          <caption className="sr-only">Перегрузки и анализ чувствительности</caption>
          <thead>
            <tr className="border-b border-line bg-subtle/70 text-left text-xs text-muted">
              <th scope="col" className="px-4 py-2 font-medium">#</th>
              <th scope="col" className="px-3 py-2 font-medium">Участок</th>
              <th scope="col" className="w-[150px] px-3 py-2 font-medium">Загрузка</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Ожидание</th>
              <th scope="col" className="border-l border-line px-3 py-2 text-right font-medium">+1 ресурс: цикл</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">выпуск</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">себестоимость</th>
              <th scope="col" className="border-l border-line px-3 py-2 font-medium">−1 ресурс</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">Действие</span></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ def, s }, idx) => {
              const plus = rows.find((r) => r.stageId === def.id && r.change === 1)!
              const minus = rows.find((r) => r.stageId === def.id && r.change === -1)!
              const p = plus.summary!
              const minusOverload = minus.summary && (minus.stageUtilizationAfter >= 0.95 || minus.summary.outputPerDay < result.outputPerDay - 0.5)
              return (
                <tr key={def.id} className={clsx('border-b border-line last:border-0', highlight === def.id && 'bg-accent-soft/60')}>
                  <td className="tnum px-4 py-2.5 text-xs text-faint">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <StageCode>{def.code}</StageCode>
                      <span className="font-medium text-ink">{def.shortName}</span>
                    </div>
                    <StatusIndicator status={s.status} className="mt-1 text-xs" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={s.utilization} status={s.status} className="flex-1" />
                      <span className="tnum w-10 text-right text-xs">{formatPercent(s.utilization)}</span>
                    </div>
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2">{formatDuration(s.waitMin)}</td>
                  <td className="border-l border-line px-3 py-2.5 text-right">
                    <Delta delta={compareMetric('cycleTimeMin', result.cycleTimeMin, p.cycleTimeMin)} showShare={false} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Delta delta={compareMetric('outputPerDay', result.outputPerDay, p.outputPerDay)} showShare={false} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Delta delta={compareMetric('costPerUnit', result.costPerUnit, p.costPerUnit)} showAbsolute={false} />
                  </td>
                  <td className="border-l border-line px-3 py-2.5 text-xs">
                    {!minus.feasible ? (
                      <span className="text-faint">нельзя — единственный ресурс</span>
                    ) : minusOverload ? (
                      <span className="text-crit">перегрузка {formatPercent(Math.min(minus.stageUtilizationAfter, 1))}</span>
                    ) : (
                      <span className="text-ok">
                        экономия {formatNumber((result.operatingCostPerDay - minus.summary!.operatingCostPerDay) / 1000, 0)} тыс. ₽/сут
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      to={`/scenarios?id=${scenarioId}&focus=${def.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-accent hover:text-accent-hover"
                    >
                      <SlidersHorizontal className="size-3.5" aria-hidden /> Изменить
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
