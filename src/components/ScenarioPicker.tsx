import { useId } from 'react'
import { BASELINE_SCENARIO_ID } from '@/data/demo/scenarios'
import { useScenarioStore } from '@/store/scenarios'
import { Select } from './ui/Controls'

/** Выбор сценария, отображаемого в двойнике и 3D-туре (общий для разделов). */
export function ScenarioPicker({ className, compact }: { className?: string; compact?: boolean }) {
  const id = useId()
  const scenarios = useScenarioStore((s) => s.scenarios)
  const activeId = useScenarioStore((s) => s.activeScenarioId)
  const setActive = useScenarioStore((s) => s.setActiveScenario)
  return (
    <div className={className}>
      <label htmlFor={id} className={compact ? 'sr-only' : 'mb-1 block text-2xs text-muted max-sm:sr-only'}>
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
