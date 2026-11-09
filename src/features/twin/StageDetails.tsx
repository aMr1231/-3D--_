import { ChartColumn, Cuboid, SlidersHorizontal } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { DataRow } from '@/components/ui/Panel'
import { SidePanel } from '@/components/ui/SidePanel'
import { Meter, StageCode, StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL } from '@/data/demo/enterprise'
import { poiForStage } from '@/data/demo/tour'
import { formatDuration, formatNumber, formatPercent, formatRub, formatRubCompact, plural } from '@/domain/format'
import { buildInsights } from '@/domain/insights'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult, StageDefinition } from '@/domain/types'

interface StageDetailsProps {
  def: StageDefinition
  result: SimulationResult
  onClose: () => void
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-meta font-semibold text-ink-2">{title}</h3>
      <dl className="mt-1 divide-y divide-line">{children}</dl>
    </section>
  )
}

/** Паспорт участка: характеристики, расчётные метрики, рекомендация и переходы в другие разделы. */
export function StageDetails({ def, result, onClose }: StageDetailsProps) {
  const s = result.stages.find((x) => x.stageId === def.id)!
  const p = result.params.stages[def.id]
  const insight = useMemo(() => buildInsights(LINE_MODEL, result.params, result).find((i) => i.stageId === def.id), [result, def.id])
  const isConstraint = result.constraintStageId === def.id
  const poi = poiForStage(def.id)

  return (
    <SidePanel
      open
      onClose={onClose}
      label={`Участок ${def.code} ${def.name}`}
      eyebrow={
        <>
          <StageCode>{def.code}</StageCode>
          <StatusIndicator status={s.status} variant="pill" />
          {isConstraint && <span className="text-xs font-medium text-crit">Ограничение линии</span>}
        </>
      }
      title={def.name}
      headerExtra={<p className="text-meta text-muted">{def.area}</p>}
      footer={
        <div className="grid grid-cols-3 gap-2">
          <ButtonLink to={`/scenarios?focus=${def.id}`} size="sm" variant="primary" icon={<SlidersHorizontal />} className="px-2">
            Изменить
          </ButtonLink>
          <ButtonLink to={`/tour?poi=${poi?.id ?? def.id}`} size="sm" variant="secondary" icon={<Cuboid />} className="px-2">
            В 3D
          </ButtonLink>
          <ButtonLink to={`/analytics?stage=${def.id}`} size="sm" variant="secondary" icon={<ChartColumn />} className="px-2">
            Метрики
          </ButtonLink>
        </div>
      }
    >
      <div className="space-y-7 px-5 pt-3 pb-6">
        <p className="text-sm leading-relaxed text-ink-2">{def.description}</p>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-meta text-muted">Загрузка</span>
            <span className="tnum text-kpi font-semibold text-ink">{formatPercent(s.utilization, 1)}</span>
          </div>
          <Meter value={s.utilization} status={s.status} size="md" className="mt-3" />
          <p className="mt-3 text-meta text-muted">{STATUS_META[s.status].description}</p>
        </div>

        <Group title="Производительность">
          <DataRow label="Мощность участка" value={`${formatNumber(s.capacityPerHour, 1)} шт/ч`} />
          <DataRow label="Фактически обработано" value={`${formatNumber(s.processedPerHour, 1)} шт/ч`} />
          <DataRow label="Поступление" value={`${formatNumber(s.inflowPerHour, 1)} шт/ч`} />
          {def.yieldRate < 1 && <DataRow label="Выход годных" value={formatPercent(def.yieldRate, 1)} />}
          {s.saturated && <DataRow label="Рост задела" value={<span className="text-crit">+{formatNumber(s.backlogGrowthPerHour, 1)} шт/ч</span>} />}
        </Group>

        <Group title="Время">
          <DataRow label="Норма времени операции" value={`${formatNumber(p.opTimeMin, 1)} мин`} />
          <DataRow label="Эффективное время" value={`${formatNumber(s.effectiveOpTimeMin, 2)} мин`} />
          <DataRow label="Ожидание в очереди" value={formatDuration(s.waitMin)} />
          <DataRow label="Средняя очередь" value={`${formatNumber(s.queueLength, 1)} шт`} />
          <DataRow label="Доля простоя" value={formatPercent(s.idleShare)} />
        </Group>

        <Group title="Ресурсы и затраты">
          <DataRow label="Ресурсы" value={`${p.resources} ${plural(p.resources, def.resourceKind)}`} />
          <DataRow label="Готовность оборудования" value={formatPercent(def.availability)} />
          <DataRow label="Ставка ресурса" value={`${formatRub(p.costPerHour)}/ч`} />
          <DataRow label="Стоимость операции" value={`${formatRub(s.costPerUnit)}/шт`} />
          <DataRow label="Простой ресурсов" value={`${formatRubCompact(s.idleCostPerHour * result.params.hoursPerDay)}/сут`} />
        </Group>

        <section>
          <h3 className="text-meta font-semibold text-ink-2">Оборудование</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
            {def.equipment.map((e) => (
              <li key={e} className="flex gap-2.5">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                {e}
              </li>
            ))}
          </ul>
        </section>

        {insight && (
          <section className="rounded-lg bg-subtle p-4">
            <h3 className="text-meta font-semibold text-ink-2">Расчёт модели</h3>
            <p className="mt-1.5 text-meta text-ink-2">{insight.recommendation}</p>
          </section>
        )}
      </div>
    </SidePanel>
  )
}
