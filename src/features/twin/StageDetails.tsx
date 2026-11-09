import { ChartColumn, Cuboid, Lightbulb, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { DataRow } from '@/components/ui/Panel'
import { SidePanel } from '@/components/ui/SidePanel'
import { Meter, StageCode, StatusIndicator } from '@/components/ui/Status'
import { LINE_MODEL } from '@/data/demo/enterprise'
import { poiForStage } from '@/data/demo/tour'
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRub,
  formatRubCompact,
  plural,
} from '@/domain/format'
import { buildInsights } from '@/domain/insights'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult, StageDefinition } from '@/domain/types'

interface StageDetailsProps {
  def: StageDefinition
  result: SimulationResult
  onClose: () => void
}

/** Паспорт участка: характеристики, расчётные метрики, рекомендация и переходы в другие разделы. */
export function StageDetails({ def, result, onClose }: StageDetailsProps) {
  const s = result.stages.find((x) => x.stageId === def.id)!
  const p = result.params.stages[def.id]
  const insight = useMemo(
    () => buildInsights(LINE_MODEL, result.params, result).find((i) => i.stageId === def.id),
    [result, def.id],
  )
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
          {isConstraint && <span className="text-2xs font-medium text-crit">ограничение линии</span>}
        </>
      }
      title={def.name}
      headerExtra={<p className="text-xs text-muted">{def.area}</p>}
      footer={
        <div className="grid grid-cols-3 gap-1.5">
          <ButtonLink to={`/scenarios?focus=${def.id}`} size="sm" variant="primary" icon={<SlidersHorizontal />} className="px-1.5">
            Изменить
          </ButtonLink>
          <ButtonLink to={`/tour?poi=${poi?.id ?? def.id}`} size="sm" variant="secondary" icon={<Cuboid />} className="px-1.5">
            В 3D
          </ButtonLink>
          <ButtonLink to={`/analytics?stage=${def.id}`} size="sm" variant="secondary" icon={<ChartColumn />} className="px-1.5">
            Метрики
          </ButtonLink>
        </div>
      }
    >
      <div className="space-y-4 px-4 py-3.5">
        <p className="text-13 text-ink-2">{def.description}</p>

        <div className="rounded-md border border-line p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted">Загрузка</span>
            <span className="tnum text-[20px] font-semibold text-ink">{formatPercent(s.utilization, 1)}</span>
          </div>
          <Meter value={s.utilization} status={s.status} size="md" className="mt-2" />
          <div className="mt-1.5 flex justify-between text-2xs text-faint">
            <span>0</span>
            <span>риск 85 %</span>
            <span>100 %</span>
          </div>
          <p className="mt-2 text-xs text-muted">{STATUS_META[s.status].description}</p>
        </div>

        <section>
          <h3 className="label-caps mb-1">Производительность</h3>
          <dl className="divide-y divide-line">
            <DataRow label="Мощность участка" value={`${formatNumber(s.capacityPerHour, 1)} шт/ч`} hint="c · 60 · скорость · готовность / t" />
            <DataRow label="Фактически обработано" value={`${formatNumber(s.processedPerHour, 1)} шт/ч`} />
            <DataRow label="Поступление" value={`${formatNumber(s.inflowPerHour, 1)} шт/ч`} />
            {def.yieldRate < 1 && <DataRow label="Выход годных" value={formatPercent(def.yieldRate, 1)} />}
            {s.saturated && (
              <DataRow label="Рост задела" value={<span className="text-crit">+{formatNumber(s.backlogGrowthPerHour, 1)} шт/ч</span>} />
            )}
          </dl>
        </section>

        <section>
          <h3 className="label-caps mb-1">Время</h3>
          <dl className="divide-y divide-line">
            <DataRow label="Норма времени операции" value={`${formatNumber(p.opTimeMin, 1)} мин`} />
            <DataRow
              label="Эффективное время"
              value={`${formatNumber(s.effectiveOpTimeMin, 2)} мин`}
              hint={`С учётом скорости ${formatPercent(p.speedFactor)} и готовности ${formatPercent(def.availability)}`}
            />
            <DataRow label="Ожидание в очереди" value={formatDuration(s.waitMin)} />
            <DataRow label="Средняя очередь" value={`${formatNumber(s.queueLength, 1)} шт`} />
            <DataRow label="Доля простоя" value={formatPercent(s.idleShare)} />
          </dl>
        </section>

        <section>
          <h3 className="label-caps mb-1">Ресурсы и затраты</h3>
          <dl className="divide-y divide-line">
            <DataRow label="Ресурсы" value={`${p.resources} ${plural(p.resources, def.resourceKind)}`} />
            <DataRow label="Готовность оборудования" value={formatPercent(def.availability)} />
            <DataRow label="Ставка ресурса" value={`${formatRub(p.costPerHour)}/ч`} />
            <DataRow label="Стоимость операции" value={`${formatRub(s.costPerUnit)}/шт`} />
            <DataRow label="Простой ресурсов" value={`${formatRubCompact(s.idleCostPerHour * result.params.hoursPerDay)}/сут`} />
          </dl>
        </section>

        <section>
          <h3 className="label-caps mb-1.5">Оборудование</h3>
          <ul className="space-y-1 text-13 text-ink-2">
            {def.equipment.map((e) => (
              <li key={e} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                {e}
              </li>
            ))}
          </ul>
        </section>

        {insight && (
          <section className="rounded-md bg-subtle p-3">
            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Lightbulb className="size-3.5 text-accent" aria-hidden /> Расчёт модели
            </h3>
            <p className="text-xs text-ink-2">{insight.recommendation}</p>
          </section>
        )}
      </div>
    </SidePanel>
  )
}
