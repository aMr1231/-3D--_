import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Panel } from '@/components/ui/Panel'
import { Meter, StatusIndicator } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'

/** Состояние участков: плотная таблица, строка открывает участок на схеме двойника. */
export function StageTable({ result }: { result: SimulationResult }) {
  const navigate = useNavigate()
  return (
    <Panel title="Состояние участков" flush>
      <div className="scrollbar-thin overflow-x-auto pb-2">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Показатели участков производственной линии</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="sticky left-0 bg-surface px-5 py-3 font-medium md:px-6">Участок</th>
              <th scope="col" className="px-3 py-3 font-medium">Статус</th>
              <th scope="col" className="min-w-[150px] px-3 py-3 font-medium">Загрузка</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Поток, шт/ч</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Ожидание</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Ресурсы</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">₽/шт</th>
              <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Открыть</span></th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((def, i) => {
              const s = result.stages[i]
              const resources = result.params.stages[def.id].resources
              const open = () => navigate(`/twin?stage=${def.id}`)
              return (
                <tr
                  key={def.id}
                  className="group cursor-pointer border-b border-line last:border-0 hover:bg-subtle"
                  onClick={open}
                >
                  <th scope="row" className="sticky left-0 bg-surface px-5 py-3 text-left font-normal group-hover:bg-subtle md:px-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        open()
                      }}
                      className="text-left font-medium text-ink"
                    >
                      {def.name}
                    </button>
                  </th>
                  <td className="px-3 py-3">
                    <StatusIndicator status={s.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Meter value={s.utilization} status={s.status} className="flex-1" />
                      <span className="tnum w-11 text-right text-13 font-medium text-ink-2">{formatPercent(s.utilization)}</span>
                    </div>
                  </td>
                  <td className="tnum px-3 py-3 text-right text-ink-2">
                    {formatNumber(s.processedPerHour, 1)} <span className="text-faint">/ {formatNumber(s.capacityPerHour, 1)}</span>
                  </td>
                  <td className="tnum px-3 py-3 text-right text-ink-2">{formatDuration(s.waitMin)}</td>
                  <td className="tnum px-3 py-3 text-right text-ink-2" title={`${resources} ${plural(resources, def.resourceKind)}`}>
                    {resources}
                  </td>
                  <td className="tnum px-3 py-3 text-right text-ink-2">{formatRub(s.costPerUnit)}</td>
                  <td className="px-3 py-3 text-faint">
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
