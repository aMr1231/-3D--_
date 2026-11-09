import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame, DataTable } from '@/components/charts/ChartFrame'
import { ChartLegend, ChartTooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartTooltip'
import { AXIS_TICK, CHART, STAGE_COLORS } from '@/components/charts/theme'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber } from '@/domain/format'
import { queueProfile } from '@/domain/simulation/engine'
import type { SimulationResult } from '@/domain/types'

/** Очереди перед участками в течение суток: установившаяся очередь + накопление задела при перегрузке. */
export function QueueProfileChart({ result, highlight }: { result: SimulationResult; highlight: string | null }) {
  const data = queueProfile(result, 1)
  // Показываем участки с заметной очередью; цвет закреплён за участком.
  const visible = STAGES.filter((s) => Math.max(...data.map((p) => p[s.id])) >= 0.5)

  return (
    <ChartFrame
      title="Накопление очередей в течение суток"
      legend={<ChartLegend items={visible.map((s) => ({ label: s.shortName, color: STAGE_COLORS[s.id] }))} />}
      chart={
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="hour" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} tickFormatter={(v: number) => `${v} ч`} interval={1} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: CHART.axis }}
                content={(props) => {
                  const { active, payload } = props as RechartsTooltipProps<(typeof data)[number]>
                  const p = payload?.[0]?.payload
                  if (!active || !p) return null
                  return (
                    <ChartTooltipBox
                      title={`${p.hour} ч от начала суток`}
                      rows={visible.map((s) => ({ key: s.id, label: s.shortName, value: `${formatNumber(p[s.id], 1)} шт`, color: STAGE_COLORS[s.id] }))}
                    />
                  )
                }}
              />
              {visible.map((s) => (
                <Line
                  key={s.id}
                  type="linear"
                  dataKey={s.id}
                  stroke={STAGE_COLORS[s.id]}
                  strokeWidth={highlight === s.id ? 3 : 2}
                  strokeOpacity={highlight && highlight !== s.id ? 0.35 : 1}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          caption="Очередь перед участками по часам, шт"
          columns={[{ key: 'h', label: 'Час' }, ...STAGES.map((s) => ({ key: s.id, label: s.code, align: 'right' as const }))]}
          rows={data
            .filter((_, i) => i % 2 === 0)
            .map((p) => ({ h: `${p.hour} ч`, ...Object.fromEntries(STAGES.map((s) => [s.id, formatNumber(p[s.id], 1)])) }))}
        />
      }
    />
  )
}
