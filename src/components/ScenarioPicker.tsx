import { useId } from 'react'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { useScenarioStore } from '@/store/scenarios'
import { Select } from './ui/Controls'

/** Выбор сценария, отображаемого в двойнике и 3D-туре (общий для разделов). Подпись — для экранных дикторов. */
export function ScenarioPicker({ className }: { className?: string }) {
  const id = useId()
  const scenarios = useScenarioStore((s) => s.scenarios)
  const activeId = useScenarioStore((s) => s.activeScenarioId)
  const setActive = useScenarioStore((s) => s.setActiveScenario)
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        Сценарий
      </label>
      <Select id={id} size="sm" value={activeId} onChange={(e) => setActive(e.target.value)} className="w-full sm:min-w-[200px]">
        <optgroup label="Базовый">
          {scenarios
            .filter((s) => s.id === BASELINE_SCENARIO_ID)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Сценарии">
          {scenarios
            .filter((s) => s.id !== BASELINE_SCENARIO_ID)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </optgroup>
      </Select>
    </div>
  )
}
