import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { ENTERPRISE, STAGES } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'
import { LAYERS, type TwinLayer } from './layers'

interface TwinInfoProps {
  result: SimulationResult
  /** Название сценария; null — базовый режим. */
  scenarioName: string | null
  layer: TwinLayer
}

/** Пояснения к мнемосхеме двойника: слои, обозначения связей и сводка участков. */
export function TwinInfo({ result, scenarioName, layer }: TwinInfoProps) {
  return (
    <PageInfo title="Цифровой двойник">
      <InfoSection id="twin" title="Схема">
        <p>
          Мнемосхема линии: {scenarioName ? `сценарий «${scenarioName}»` : 'базовый режим'}. Выберите участок, чтобы открыть его паспорт.
        </p>
        {scenarioName && <p>Изменения в строке сводки — к базовому режиму.</p>}
      </InfoSection>

      <InfoSection id="layers" title="Слои">
        <InfoTerms
          items={(Object.keys(LAYERS) as TwinLayer[]).map((k) => ({
            key: k,
            term: k === layer ? `${LAYERS[k].label} — выбран` : LAYERS[k].label,
            text: LAYERS[k].hint,
          }))}
        />
      </InfoSection>

      <InfoSection id="flow-legend" title="Связи и узлы">
        <InfoList
          items={[
            'Подпись на связи — поток изделий, шт/ч; толщина связи — очередь перед участком.',
            'Плашка «очередь» появляется, когда очередь заметна; красная — на перегруженном участке.',
            'Пунктир — поток брака в изолятор.',
            layer === 'utilization'
              ? 'Полоса на карточке — загрузка с отметками порогов риска.'
              : `Полоса на карточке — ${LAYERS[layer].label.toLowerCase()} относительно максимума по линии.`,
            'Красная плашка «Ограничение линии» и пульсация — самый загруженный, перегруженный участок.',
            `Запуск в производство — заготовки изделия «${ENTERPRISE.product.name}»; отгрузка — с планом ${formatNumber(result.plannedOutputPerDay, 0)} шт/сут.`,
          ]}
        />
      </InfoSection>

      <InfoSection id="stage-flow" title="Поток и ресурсы участков">
        <InfoFacts
          items={STAGES.map((def, i) => {
            const s = result.stages[i]
            return {
              key: def.id,
              label: def.shortName,
              value: `${formatNumber(s.processedPerHour, 1)} / ${formatNumber(s.capacityPerHour, 1)} шт/ч · ${result.params.stages[def.id].resources} рес. · ${formatPercent(s.utilization)}`,
            }
          })}
        />
        <p>Обработано / мощность участка, число ресурсов и загрузка. Полные характеристики — в паспорте участка.</p>
      </InfoSection>

      <InfoSection id="stage-passport" title="Паспорт участка">
        <InfoTerms
          items={[
            { term: 'Мощность участка', text: 'Ресурсы · 60 · скорость · готовность / время операции, шт/ч.' },
            { term: 'Эффективное время', text: 'Норма времени операции с учётом скорости обработки и готовности оборудования.' },
            { term: 'Шкала загрузки', text: 'От 0 до 100 %; риск — от 85 %, перегрузка — от 95 %.' },
          ]}
        />
      </InfoSection>
    </PageInfo>
  )
}
