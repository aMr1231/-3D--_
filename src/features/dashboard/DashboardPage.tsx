import { Cuboid, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { PageHeader } from '@/components/ui/Panel'
import { HISTORY } from '@/data/demo/history'
import { formatFullDate } from '@/domain/format'
import { BASELINE_RESULT } from '@/hooks/useSimulation'
import { OnboardingTour } from '@/features/onboarding/OnboardingTour'
import { IssuesList } from './IssuesList'
import { KpiStrip } from './KpiStrip'
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
    <div className="mx-auto max-w-[1480px] space-y-4 p-4 md:p-6">
      <PageHeader
        meta={
          <>
            <span>{formatFullDate(new Date())}</span>
            <span className="text-faint">·</span>
            <span>2 смены по 8 ч</span>
          </>
        }
        title="Обзор производства"
        description="Текущее состояние линии по модели цифрового двойника и динамика за последние рабочие дни."
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

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">Период истории</span>
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
        <span className="text-xs text-faint">рабочие дни · влияет на тренды, изменения и график</span>
      </div>

      <div data-tour="kpi">
        <KpiStrip result={result} history={history} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <PerformanceTrend history={history} />
          <StageTable result={result} />
        </div>
        <div className="min-w-0 space-y-4">
          <div data-tour="issues">
            <IssuesList result={result} />
          </div>
          <RecentRuns />
        </div>
      </div>
      <OnboardingTour />
    </div>
  )
}
