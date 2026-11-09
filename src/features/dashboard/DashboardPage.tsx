import { Cuboid, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { Page, PageHeader } from '@/components/ui/Panel'
import { HISTORY } from '@/data/demo/history'
import { BASELINE_RESULT } from '@/hooks/useSimulation'
import { OnboardingTour } from '@/features/onboarding/OnboardingTour'
import { DashboardInfo } from './DashboardInfo'
import { IssuesList } from './IssuesList'
import { KpiStrip } from './KpiStrip'
import { LiveLine } from './LiveLine'
import { LineStatus } from './LineStatus'

type Period = '7' | '14' | '30'

/**
 * Обзор — только главное, сверху вниз: как работает линия → что требует внимания → ключевые цифры → живая смена.
 * Подробные графики и таблицы — в «Аналитике», журнал расчётов — там же.
 */
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('14')
  const history = HISTORY.slice(-Number(period))
  const result = BASELINE_RESULT

  return (
    <Page>
      <PageHeader
        title="Обзор"
        actions={
          <>
            <ButtonLink to="/tour" variant="secondary" icon={<Cuboid />}>
              3D-тур
            </ButtonLink>
            <ButtonLink to="/scenarios" variant="primary" icon={<SlidersHorizontal />}>
              Смоделировать сценарий
            </ButtonLink>
          </>
        }
      />

      <div data-tour="line">
        <LineStatus result={result} />
      </div>

      <div data-tour="issues">
        <IssuesList result={result} />
      </div>

      <section aria-labelledby="kpi-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="kpi-title" className="text-heading font-semibold text-ink">
            Показатели
          </h2>
          <SegmentedControl
            label="Сравнить с периодом"
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7', label: '7 дней' },
              { value: '14', label: '14 дней' },
              { value: '30', label: '30 дней' },
            ]}
          />
        </div>
        <div data-tour="kpi">
          <KpiStrip result={result} history={history} />
        </div>
      </section>

      <LiveLine />

      <OnboardingTour />
      <DashboardInfo result={result} history={history} />
    </Page>
  )
}
