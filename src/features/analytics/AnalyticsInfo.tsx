import { InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRub, formatRubCompact } from '@/domain/format'
import { COMPARISON_METRICS, METRICS } from '@/domain/metrics'
import type { SimulationResult } from '@/domain/types'

interface AnalyticsInfoProps {
  result: SimulationResult
  scenarioName: string
  scenarioCount: number
}

/** Пояснения к аналитике: сводка сценария, как читать каждый график и смысл показателей. */
export function AnalyticsInfo({ result, scenarioName, scenarioCount }: AnalyticsInfoProps) {
  const constraint = STAGES.find((s) => s.id === result.constraintStageId)!
  const wait = result.stages.reduce((a, s) => a + s.waitMin, 0)
  const process = result.stages.reduce((a, s) => a + s.processMin, 0)
  const growing = result.stages.filter((s) => s.backlogGrowthPerHour > 0)
  const queueText = growing.length
    ? `Перегрузка: задел растёт перед участками ${growing.map((g) => STAGES.find((s) => s.id === g.stageId)!.shortName).join(', ')} — к концу суток ${formatNumber(
        growing.reduce((a, g) => a + g.steadyQueueLength + g.backlogGrowthPerHour * result.params.hoursPerDay, 0),
        0,
      )} шт.`
    : 'Очереди стабильны: поступление не превышает мощность ни на одном участке.'

  return (
    <PageInfo title="Аналитика">
      <InfoSection id="analytics" title="Сценарий">
        <p>
          «{scenarioName}»: выпуск {formatNumber(result.outputPerDay, 0)} шт/сут, время цикла {formatDuration(result.cycleTimeMin)}, себестоимость{' '}
          {formatRub(result.costPerUnit)}. Ограничение линии — {constraint.code} {constraint.name} ({formatPercent(result.constraintUtilization)}).
        </p>
        <p>Фильтры в шапке применяются ко всем графикам и таблицам: выбранный участок подсвечивается, остальные приглушаются.</p>
      </InfoSection>

      <InfoSection id="charts" title="Как читать графики">
        <InfoTerms
          items={[
            { term: 'Производительность по этапам', text: 'Мощность участка и фактически обработанный поток, шт/ч.' },
            { term: 'Загрузка ресурсов', text: 'Цвет — статус участка; пунктир — пороги 85 % и 95 %.' },
            {
              term: 'Время выполнения операций',
              text: `Из чего складывается время цикла ${formatDuration(result.cycleTimeMin)}: ожидание ${formatPercent(wait / result.cycleTimeMin)}, обработка ${formatPercent(process / result.cycleTimeMin)}, остальное — транспорт.`,
            },
            { term: 'Накопление очередей в течение суток', text: queueText },
            {
              term: 'Перегрузки и чувствительность',
              text: 'Участки ранжированы по тяжести; эффект ±1 ресурса рассчитан перерасчётом линии с изменённым числом ресурсов.',
            },
            { term: 'Сравнение сценариев', text: `${scenarioCount} сохранённых вариантов; галочкой отмечено лучшее значение по каждому показателю.` },
            {
              term: 'Структура затрат',
              text: `Операционные затраты ${formatRubCompact(result.operatingCostPerDay)}/сут, из них простой ресурсов ${formatRubCompact(result.idleCostPerDay)}.`,
            },
          ]}
        />
        <p>Кнопка справа от заголовка графика переключает его в таблицу с точными значениями.</p>
      </InfoSection>

      <InfoSection id="metrics" title="Показатели">
        <InfoTerms items={COMPARISON_METRICS.map((k) => ({ key: k, term: METRICS[k].label, text: METRICS[k].hint }))} />
      </InfoSection>
    </PageInfo>
  )
}
