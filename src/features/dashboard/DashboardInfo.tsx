import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { ENTERPRISE, getStage } from '@/data/demo/enterprise'
import type { HistoryDay } from '@/data/demo/history'
import { formatDuration, formatFullDate, formatNumber, formatPercent, formatRub, plural } from '@/domain/format'
import { METRICS } from '@/domain/metrics'
import type { SimulationResult } from '@/domain/types'

/** Пояснения к обзору — в «Справке», с живыми значениями модели. */
export function DashboardInfo({ result, history }: { result: SimulationResult; history: HistoryDay[] }) {
  const constraint = result.stages.find((s) => s.stageId === result.constraintStageId)!
  const constraintDef = getStage(constraint.stageId)!
  const previous = history.length - 1

  return (
    <PageInfo title="Обзор">
      <InfoSection id="overview" title="Что на этой странице">
        <p>
          Самое главное о линии: как она работает сейчас, что требует внимания и как меняются ключевые цифры. Подробные графики, таблицы
          и журнал расчётов — в разделе «Аналитика».
        </p>
        <InfoFacts
          items={[
            { label: 'Дата', value: formatFullDate(new Date()) },
            { label: 'Режим работы', value: `${ENTERPRISE.shiftsPerDay} смены по ${ENTERPRISE.hoursPerShift} ч` },
            { label: 'План на сутки', value: `${formatNumber(result.plannedOutputPerDay, 0)} шт` },
            { label: 'Выполнение плана', value: formatPercent(result.planAttainment, 1) },
          ]}
        />
      </InfoSection>

      <InfoSection id="constraint" title="Узкое место">
        <p>
          <span className="font-medium text-ink-2">
            {constraintDef.code} {constraintDef.name}
          </span>{' '}
          — самый загруженный участок. Линия не может выпускать больше, чем успевает он, поэтому его называют узким местом (или
          ограничением линии).
        </p>
        <InfoFacts
          items={[
            { label: 'Загрузка', value: formatPercent(constraint.utilization) },
            { label: 'Очередь перед участком', value: `≈ ${formatNumber(constraint.queueLength, 0)} шт` },
            { label: 'Ожидание в очереди', value: formatDuration(constraint.waitMin) },
          ]}
        />
        <p>Нажмите на участок на мнемосхеме — он откроется на схеме двойника с подробным паспортом.</p>
      </InfoSection>

      <InfoSection id="issues" title="Что требует внимания">
        <p>
          Участки с перегрузкой, риском или простоем. Совет посчитан моделью: что будет, если добавить или убрать один ресурс. «Проверить
          на модели» откроет сценарий с этим изменением — останется нажать «Рассчитать».
        </p>
      </InfoSection>

      <InfoSection id="kpi" title="Показатели">
        <p>
          {`Изменение — к среднему за предыдущие ${previous} ${plural(previous, { one: 'рабочий день', few: 'рабочих дня', many: 'рабочих дней' })}; линия рядом — тренд за период.`}
        </p>
        <InfoTerms
          items={[
            { term: 'Выпуск в час', text: METRICS.outputPerHour.hint },
            { term: 'Время изготовления', text: `Время цикла. ${METRICS.cycleTimeMin.hint}.` },
            { term: 'Загрузка оборудования', text: METRICS.avgUtilization.hint },
            { term: 'Затраты в сутки', text: `Операционные затраты. ${METRICS.operatingCostPerDay.hint}.` },
          ]}
        />
        <InfoFacts
          items={[
            { label: 'Незавершённое производство', value: `${formatNumber(result.wip, 0)} шт` },
            { label: 'Себестоимость изделия', value: formatRub(result.costPerUnit) },
            { label: 'Участков с перегрузкой', value: String(result.bottleneckCount) },
            { label: 'Участков в зоне риска', value: String(result.riskCount) },
            { label: 'Участков с простоем', value: String(result.idleCount) },
          ]}
        />
      </InfoSection>

      <InfoSection id="live" title="Линия сейчас">
        <p>Живая смена: синтетический поток с сервера, шаг 2 с = 2 мин смены. Участки и события оборудования раскрываются кнопкой под счётчиками.</p>
        <InfoTerms
          items={[
            { term: 'Выпуск за смену', text: 'Годные изделия с начала смены и отклонение от плана на это время.' },
            { term: 'Темп сейчас', text: 'Выпуск за последние минуты смены в пересчёте на час; план — 22 шт/ч.' },
            { term: 'В работе', text: 'Незавершённое производство: изделия в очередях и на станках.' },
            { term: 'Брак', text: 'Изделия, забракованные на ОТК с начала смены.' },
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
    </PageInfo>
  )
}
