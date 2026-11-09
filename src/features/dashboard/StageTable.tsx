import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Panel } from '@/components/ui/Panel'
import { Meter, StageCode, StatusIndicator } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'

/** Состояние участков: плотная таблица, строка открывает участок на схеме двойника. */
export function StageTable({ result }: { result: SimulationResult }) {
  const navigate = useNavigate()
  return (
    <Panel title="Состояние участков" subtitle="Базовый режим · расчёт модели на текущих параметрах" flush>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-13">
          <caption className="sr-only">Показатели участков производственной линии</caption>
          <thead>
            <tr className="border-b border-line bg-subtle/70 text-left text-xs text-muted">
              <th scope="col" className="sticky left-0 bg-subtle/95 px-4 py-2 font-medium">Участок</th>
              <th scope="col" className="px-3 py-2 font-medium">Статус</th>
              <th scope="col" className="min-w-[140px] px-3 py-2 font-medium">Загрузка</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Факт / мощность, шт/ч</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Ожидание</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Ресурсы</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Операция, ₽/шт</th>
              <th scope="col" className="w-8 px-2 py-2"><span className="sr-only">Открыть</span></th>
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
                  className="group cursor-pointer border-b border-line last:border-0 hover:bg-subtle/60"
                  onClick={open}
                >
                  <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 text-left font-normal group-hover:bg-[#f8f9fa]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        open()
                      }}
                      className="flex items-center gap-2 text-left"
                    >
                      <StageCode>{def.code}</StageCode>
                      <span className="font-medium text-ink">{def.name}</span>
                    </button>
                  </th>
                  <td className="px-3 py-2.5">
                    <StatusIndicator status={s.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Meter value={s.utilization} status={s.status} className="flex-1" />
                      <span className="tnum w-10 text-right text-xs font-medium text-ink-2">{formatPercent(s.utilization)}</span>
                    </div>
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2">
                    {formatNumber(s.processedPerHour, 1)} <span className="text-faint">/ {formatNumber(s.capacityPerHour, 1)}</span>
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2">{formatDuration(s.waitMin)}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2" title={`${resources} ${plural(resources, def.resourceKind)}`}>
                    {resources}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-2">{formatRub(s.costPerUnit)}</td>
                  <td className="px-2 py-2.5 text-faint">
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
