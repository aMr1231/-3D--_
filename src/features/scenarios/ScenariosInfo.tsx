import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { formatDateTime, formatNumber } from '@/domain/format'
import { COMPARISON_METRICS, METRICS } from '@/domain/metrics'
import type { Calculation } from './ResultsPanel'

function formatMs(ms: number) {
  return ms < 0.1 ? '< 0,1 мс' : `${formatNumber(ms, ms < 10 ? 1 : 0)} мс`
}

interface ScenariosInfoProps {
  calculation: Calculation | null
  stale: boolean
  isBaseline: boolean
}

/** Пояснения к моделированию сценариев: правила работы, глоссарий параметров и как читать результат. */
export function ScenariosInfo({ calculation, stale, isBaseline }: ScenariosInfoProps) {
  return (
    <PageInfo title="Сценарии">
      <InfoSection id="scenarios" title="Как работать">
        <InfoList
          items={[
            'Измените параметры линии и нажмите «Рассчитать» — модель пересчитает время цикла, выпуск, загрузку и стоимость.',
            isBaseline
              ? 'Базовый режим доступен только для чтения: изменения сохраняются как новый сценарий.'
              : 'Переименовать, дублировать и удалить сценарий — в меню «…» рядом с «Рассчитать».',
            'Дублировать сценарий и открыть его на схеме можно после сохранения или сброса изменений.',
            'Сценарии и журнал расчётов хранятся на сервере и видны всем руководителям; удаление тоже действует для всех.',
            '«Сбросить демо-сценарии» (меню «…» над списком) удаляет все сценарии и журнал и восстанавливает демонстрационные.',
          ]}
        />
      </InfoSection>

      <InfoSection id="params" title="Параметры">
        <InfoTerms
          items={[
            { term: 'Запуск заготовок', text: 'Интенсивность запуска заготовок в производство, шт/ч. Рядом с заголовком — запуск за сутки.' },
            { term: 'Рабочих часов в сутки', text: 'Сколько часов в сутки работает линия.' },
            {
              term: 'Ресурсы',
              text: 'Число единиц оборудования или рабочих мест на участке: приёмщики, станки, обрабатывающие центры, посты контроля и упаковки, бригады.',
            },
            { term: 'Скорость обработки', text: 'Режимы, оснастка, программы: 120 % — операция выполняется на 20 % быстрее нормы.' },
            { term: 'Время операции', text: 'Норма времени на одно изделие одним ресурсом.' },
            { term: 'Стоимость ресурса', text: 'Ставка одного ресурса, ₽/ч.' },
          ]}
        />
        <p>«Было …» над полем — значение в сохранённом сценарии; точка у названия участка — его параметры изменены, «Вернуть» откатывает их.</p>
      </InfoSection>

      <InfoSection id="calc" title="Последний расчёт">
        {calculation ? (
          <InfoFacts
            items={[
              { label: 'Источник', value: calculation.source === 'saved' ? 'Сохранённые параметры' : 'Запуск пользователем' },
              ...(calculation.source === 'run' ? [{ label: 'Время', value: formatDateTime(calculation.ranAt) }] : []),
              { label: 'Длительность', value: formatMs(calculation.durationMs) },
              { label: 'Актуальность', value: stale ? 'Устарел — параметры изменены' : 'Актуален' },
            ]}
          />
        ) : (
          <p>Расчёт ещё не выполнялся.</p>
        )}
        <p>Каждый запуск добавляется в журнал прогонов — его видно на обзоре в «Последних расчётах».</p>
      </InfoSection>

      <InfoSection id="results" title="Как читать результат">
        <InfoTerms
          items={[
            {
              term: 'Линия: база → сценарий',
              text: 'Статус и загрузка каждого участка до и после. Обводка — ограничение линии (самый загруженный участок), подсветка — участок сменил статус. Коды участков — в секции «Участки линии».',
            },
            {
              term: 'Время цикла по участкам',
              text: 'Влево — участок ускоряет прохождение изделия, вправо — замедляет. В сумме — изменение времени цикла.',
            },
          ]}
        />
        <InfoTerms items={COMPARISON_METRICS.map((k) => ({ key: k, term: METRICS[k].short, text: METRICS[k].hint }))} />
      </InfoSection>
    </PageInfo>
  )
}
