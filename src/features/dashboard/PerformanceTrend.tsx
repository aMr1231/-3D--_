import { TriangleExclamationPoint } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame, DataTable } from '@/components/charts/ChartFrame'
import { ChartLegend, ChartTooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartTooltip'
import { AXIS_TICK, CHART } from '@/components/charts/theme'
import type { HistoryDay } from '@/data/demo/history'
import { formatDate, formatDuration, formatNumber, formatPercent } from '@/domain/format'

interface Point {
  date: string
  label: string
  output: number
  plan: number
  attainment: number
  cycle: number
  event?: string
}

export function PerformanceTrend({ history }: { history: HistoryDay[] }) {
  const data: Point[] = history.map((d) => ({
    date: d.date,
    label: formatDate(d.date),
    output: Math.round(d.result.outputPerDay),
    plan: Math.round(d.result.plannedOutputPerDay),
    attainment: d.result.planAttainment,
    cycle: d.result.cycleTimeMin,
    event: d.event,
  }))
  const min = Math.min(...data.map((d) => Math.min(d.output, d.plan)))
  const max = Math.max(...data.map((d) => Math.max(d.output, d.plan)))
  const lo = Math.floor((min - 15) / 10) * 10
  const hi = Math.ceil((max + 5) / 10) * 10
  const shortfallDays = data.filter((d) => d.attainment < 0.995).length

  return (
    <ChartFrame
      title="Динамика выпуска"
      subtitle={`Годные изделия за сутки · план не выполнен в ${shortfallDays} из ${data.length} дн.`}
      legend={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ChartLegend
            items={[
              { label: 'Выпуск', color: CHART.primary },
              { label: 'План при заданной нагрузке', color: CHART.base, shape: 'dash' },
            ]}
          />
          <span className="flex items-center gap-1 text-xs text-muted">
            <TriangleExclamationPoint className="size-3.5 text-crit" aria-hidden /> событие на линии
          </span>
        </div>
      }
      chart={
        <div className="h-[248px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="outputFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} minTickGap={24} />
              <YAxis domain={[lo, hi]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
                content={(props) => {
                  const { active, payload } = props as RechartsTooltipProps<Point>
                  const p = payload?.[0]?.payload
                  if (!active || !p) return null
                  return (
                    <ChartTooltipBox
                      title={formatDate(p.date)}
                      rows={[
                        { key: 'o', label: 'выпуск, шт', value: formatNumber(p.output, 0), color: CHART.primary },
                        { key: 'p', label: 'план, шт', value: formatNumber(p.plan, 0), color: CHART.base },
                        { key: 'c', label: 'время цикла', value: formatDuration(p.cycle), color: 'transparent' },
                      ]}
                      footer={
                        p.event ? (
                          <span className="flex items-start gap-1 text-crit">
                            <TriangleExclamationPoint className="mt-px size-3 shrink-0" /> {p.event}
                          </span>
                        ) : (
                          `Выполнение плана ${formatPercent(p.attainment, 1)}`
                        )
                      }
                    />
                  )
                }}
              />
              <Area type="monotone" dataKey="output" stroke="none" fill="url(#outputFill)" isAnimationActive={false} />
              <Line type="stepAfter" dataKey="plan" stroke={CHART.base} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="output"
                stroke={CHART.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
              {data
                .filter((d) => d.event)
                .map((d) => (
                  <ReferenceDot key={d.date} x={d.label} y={d.output} r={4.5} fill={CHART.crit} stroke="#fff" strokeWidth={2} />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          caption="Выпуск и план по дням"
          columns={[
            { key: 'date', label: 'Дата' },
            { key: 'output', label: 'Выпуск, шт', align: 'right' },
            { key: 'plan', label: 'План, шт', align: 'right' },
            { key: 'att', label: 'Выполнение', align: 'right' },
            { key: 'cycle', label: 'Время цикла', align: 'right' },
            { key: 'event', label: 'Событие' },
          ]}
          rows={[...data].reverse().map((d) => ({
            date: formatDate(d.date),
            output: formatNumber(d.output, 0),
            plan: formatNumber(d.plan, 0),
            att: formatPercent(d.attainment, 1),
            cycle: formatDuration(d.cycle),
            event: d.event ? <span className="text-crit">{d.event}</span> : <span className="text-faint">—</span>,
          }))}
        />
      }
    />
  )
}
