import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { formatDuration, formatNumber } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'

interface TourInfoProps {
  result: SimulationResult
  poiCount: number
  /** Сценарий, по которому считаются метрики (только для руководителя). */
  scenarioName: string | null
  isManager: boolean
}

/** Пояснения к 3D-туру: управление, режимы, план цеха и происхождение показателей. */
export function TourInfo({ result, poiCount, scenarioName, isManager }: TourInfoProps) {
  return (
    <PageInfo title="3D-тур">
      <InfoSection id="tour" title="О туре">
        <p>
          {isManager
            ? 'Цех №1 в объёме: выберите участок или метку — откроются живые метрики двойника и переход к процессу.'
            : 'Виртуальная экскурсия по линии выпуска корпусов редукторов.'}
        </p>
        <InfoFacts
          items={[
            { label: 'Точек интереса', value: String(poiCount) },
            { label: 'Выпуск линии', value: `${formatNumber(result.outputPerDay, 0)} шт/сут` },
            { label: 'Время цикла', value: formatDuration(result.cycleTimeMin) },
          ]}
        />
      </InfoSection>

      <InfoSection id="tour-controls" title="Управление">
        <InfoList
          items={[
            'Клик по зоне или метке — карточка участка.',
            'Вращение — левая кнопка мыши, сдвиг — правая, масштаб — колесо.',
            'На сенсорном экране: один палец — вращение, два — масштаб и сдвиг.',
            '«Общий вид» возвращает камеру к обзору цеха.',
          ]}
        />
      </InfoSection>

      <InfoSection id="tour-modes" title="Режимы">
        <InfoTerms
          items={[
            { term: 'Свободный осмотр', text: 'Выбирайте любые участки в произвольном порядке.' },
            {
              term: 'Маршрут',
              text: `Экскурсия по ${poiCount} остановкам: «Назад» и «Далее» в карточке; на телефоне — смахивание карточки влево и вправо.`,
            },
          ]}
        />
        <p>План цеха в левом нижнем углу (на широком экране) повторяет точки интереса — по нему тоже можно перейти к участку.</p>
      </InfoSection>

      <InfoSection id="tour-metrics" title="Показатели">
        {isManager ? (
          <p>Метрики в карточках рассчитаны моделью двойника по сценарию «{scenarioName}». Сценарий меняется в шапке раздела.</p>
        ) : (
          <p>Показатели рассчитаны цифровым двойником линии. Подробный анализ процесса доступен сотрудникам предприятия.</p>
        )}
        <p>Кейсы «Лучшая практика» в карточках — демонстрационные.</p>
      </InfoSection>
    </PageInfo>
  )
}
