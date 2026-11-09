import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { ENTERPRISE, getStage } from '@/data/demo/enterprise'
import type { HistoryDay } from '@/data/demo/history'
import { formatDuration, formatFullDate, formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import { METRICS } from '@/domain/metrics'
import type { SimulationResult } from '@/domain/types'

/** Пояснения к обзору производства — в «Справке», с живыми значениями модели. */
export function DashboardInfo({ result, history }: { result: SimulationResult; history: HistoryDay[] }) {
  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const previous = history.length - 1
  const shortfallDays = history.filter((d) => d.result.planAttainment < 0.995).length

  return (
    <PageInfo title="Обзор производства">
      <InfoSection id="overview" title="Сегодня">
        <p>Текущее состояние линии по модели цифрового двойника и динамика за последние рабочие дни.</p>
        <InfoFacts
          items={[
            { label: 'Дата', value: formatFullDate(new Date()) },
            { label: 'Режим работы', value: `${ENTERPRISE.shiftsPerDay} смены по ${ENTERPRISE.hoursPerShift} ч` },
            { label: 'План на сутки', value: `${formatNumber(result.plannedOutputPerDay, 0)} шт` },
            { label: 'Выполнение плана', value: formatPercent(result.planAttainment, 1) },
          ]}
        />
      </InfoSection>

      <InfoSection id="constraint" title="Ограничение линии">
        <p>
          <span className="font-medium text-ink-2">
            {constraintDef.code} {constraintDef.name}
          </span>{' '}
          — самый загруженный участок, он задаёт выпуск линии.
        </p>
        <InfoFacts
          items={[
            { label: 'Загрузка', value: formatPercent(constraint.utilization) },
            { label: 'Очередь', value: `≈ ${formatNumber(constraint.queueLength, 0)} шт` },
            { label: 'Ожидание', value: formatDuration(constraint.waitMin) },
          ]}
        />
        <p>Нажмите на участок мнемосхемы — он откроется на схеме двойника с паспортом.</p>
      </InfoSection>

      <InfoSection id="live" title="Линия сейчас">
        <p>Живая смена: синтетический поток с сервера, шаг 2 с = 2 мин смены.</p>
        <InfoTerms
          items={[
            { term: 'Выпуск за смену', text: 'Годные изделия с начала смены и отклонение от плана на это время.' },
            { term: 'Темп за час', text: 'Выпуск за последние минуты смены в пересчёте на час; план — 22 шт/ч.' },
            { term: 'Задел', text: 'Незавершённое производство: изделия в очередях и в работе.' },
            { term: 'Брак на ОТК', text: 'Забракованные изделия с начала смены.' },
          ]}
        />
        <InfoList
          items={[
            'Квадраты — единицы оборудования: заполненный — в работе, контур — свободен, красный — в ремонте.',
            'Очередь выделяется красным от 8 изделий.',
            'Если новых данных нет дольше 10 с, блок становится бледным — поток остановлен.',
          ]}
        />
      </InfoSection>

      <InfoSection id="kpi" title="Показатели">
        <p>
          {`Изменение — к среднему за предыдущие ${previous} ${plural(previous, { one: 'рабочий день', few: 'рабочих дня', many: 'рабочих дней' })}; линия рядом — тренд периода.`}{' '}
          Период влияет на тренды, изменения и график выпуска.
        </p>
        <InfoTerms
          items={[
            { term: 'Производительность', text: METRICS.outputPerHour.hint },
            { term: 'Время цикла', text: METRICS.cycleTimeMin.hint },
            { term: 'Задел', text: `Незавершённое производство. ${METRICS.wip.hint}.` },
            { term: 'Загрузка оборудования', text: METRICS.avgUtilization.hint },
            { term: 'Операционные затраты, в сутки', text: METRICS.operatingCostPerDay.hint },
            { term: 'Перегрузки', text: 'Число участков с перегрузкой (загрузка ≥ 95 % или поступление выше мощности).' },
          ]}
        />
        <InfoFacts
          items={[
            { label: 'Задел на линии', value: `${formatNumber(result.wip, 0)} шт` },
            { label: 'Максимальная загрузка участка', value: formatPercent(result.constraintUtilization) },
            { label: 'Затраты на изделие', value: formatRub(result.conversionCostPerUnit) },
            { label: 'Участков в зоне риска', value: String(result.riskCount) },
            { label: 'Участков с простоем', value: String(result.idleCount) },
          ]}
        />
      </InfoSection>

      <InfoSection id="trend" title="Динамика выпуска">
        <p>
          Годные изделия за сутки. Пунктир — план при заданной нагрузке, красная точка — событие на линии (подробности в подсказке
          графика).
        </p>
        <p>{`План не выполнен в ${shortfallDays} из ${history.length} дн. периода.`}</p>
      </InfoSection>

      <InfoSection id="stages-table" title="Состояние участков">
        <p>Базовый режим, расчёт модели на текущих параметрах. Поток — фактически обработано / мощность участка, шт/ч. Строка открывает участок на схеме двойника.</p>
      </InfoSection>

      <InfoSection id="issues" title="Перегрузки и резервы">
        <p>Рекомендации рассчитаны перерасчётом модели: ±1 ресурс на участке. «Смоделировать» откроет сценарий с этим изменением.</p>
      </InfoSection>

      <InfoSection id="runs" title="Последние расчёты">
        <p>Пять последних прогонов сценариев и их изменение к базовому режиму: время цикла, выпуск и себестоимость.</p>
      </InfoSection>
    </PageInfo>
  )
}
