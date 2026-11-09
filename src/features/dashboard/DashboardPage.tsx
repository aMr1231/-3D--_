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
import { PerformanceTrend } from './PerformanceTrend'
import { RecentRuns } from './RecentRuns'
import { StageTable } from './StageTable'

type Period = '7' | '14' | '30'

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('14')
  const history = HISTORY.slice(-Number(period))
  const result = BASELINE_RESULT

  return (
    <Page>
      <PageHeader
        title="Обзор производства"
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

      <LiveLine />

      <section aria-labelledby="kpi-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="kpi-title" className="text-15 font-semibold text-ink">
            Показатели
          </h2>
          <SegmentedControl
            label="Период истории"
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <PerformanceTrend history={history} />
          <StageTable result={result} />
        </div>
        <div className="min-w-0 space-y-6">
          <div data-tour="issues">
            <IssuesList result={result} />
          </div>
          <RecentRuns />
        </div>
      </div>
      <OnboardingTour />
      <DashboardInfo result={result} history={history} />
    </Page>
  )
}
