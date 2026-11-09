import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame, DataTable } from '@/components/charts/ChartFrame'
import { ChartLegend, ChartTooltipBox, type RechartsTooltipProps } from '@/components/charts/ChartTooltip'
import { AXIS_TICK, CHART } from '@/components/charts/theme'
import { STATUS_HEX, StatusIndicator } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRubCompact } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'

interface StageChartProps {
  result: SimulationResult
  highlight: string | null
}

const dim = (highlight: string | null, id: string) => (highlight && highlight !== id ? 0.32 : 1)

/* ───────── Мощность и факт ───────── */

export function CapacityChart({ result, highlight }: StageChartProps) {
  const data = STAGES.map((d, i) => ({
    id: d.id,
    code: d.code,
    name: d.shortName,
    capacity: result.stages[i].capacityPerHour,
    processed: result.stages[i].processedPerHour,
    inflow: result.stages[i].inflowPerHour,
  }))
  return (
    <ChartFrame
      title="Производительность по этапам"
      legend={
        <ChartLegend
          items={[
            { label: 'Мощность', color: CHART.primarySoft, shape: 'rect' },
            { label: 'Факт', color: CHART.primary, shape: 'rect' },
          ]}
        />
      }
      chart={
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barGap={2} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} interval={0} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
              <Tooltip
                cursor={{ fill: 'rgb(16 24 32 / 0.04)' }}
                content={(props) => {
                  const { active, payload } = props as RechartsTooltipProps<(typeof data)[number]>
                  const p = payload?.[0]?.payload
                  if (!active || !p) return null
                  return (
                    <ChartTooltipBox
                      title={`${p.code} ${p.name}`}
                      rows={[
                        { key: 'c', label: 'мощность, шт/ч', value: formatNumber(p.capacity, 1), color: CHART.primarySoft, shape: 'rect' },
                        { key: 'p', label: 'факт, шт/ч', value: formatNumber(p.processed, 1), color: CHART.primary, shape: 'rect' },
                      ]}
                      footer={p.inflow > p.capacity + 1e-6 ? `Поступление ${formatNumber(p.inflow, 1)} шт/ч выше мощности` : `Резерв ${formatNumber(p.capacity - p.processed, 1)} шт/ч`}
                    />
                  )
                }}
              />
              <Bar dataKey="capacity" fill={CHART.primarySoft} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.id} fillOpacity={dim(highlight, d.id)} />
                ))}
              </Bar>
              <Bar dataKey="processed" fill={CHART.primary} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.id} fillOpacity={dim(highlight, d.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          caption="Мощность и факт по участкам"
          columns={[
            { key: 'stage', label: 'Участок' },
            { key: 'cap', label: 'Мощность, шт/ч', align: 'right' },
            { key: 'fact', label: 'Факт, шт/ч', align: 'right' },
            { key: 'res', label: 'Резерв, шт/ч', align: 'right' },
          ]}
          rows={data.map((d) => ({
            stage: `${d.code} ${d.name}`,
            cap: formatNumber(d.capacity, 1),
            fact: formatNumber(d.processed, 1),
            res: formatNumber(d.capacity - d.processed, 1),
          }))}
        />
      }
    />
  )
}

/* ───────── Загрузка ───────── */

export function UtilizationChart({ result, highlight }: StageChartProps) {
  const data = STAGES.map((d, i) => ({ id: d.id, code: d.code, name: d.shortName, value: result.stages[i].utilization, status: result.stages[i].status }))
  return (
    <ChartFrame
      title="Загрузка ресурсов"
      chart={
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={(v: number) => formatPercent(v)} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={92} />
              <ReferenceLine x={0.85} stroke={CHART.warn} strokeDasharray="3 3" />
              <ReferenceLine x={0.95} stroke={CHART.crit} strokeDasharray="3 3" />
              <Tooltip
                cursor={{ fill: 'rgb(16 24 32 / 0.04)' }}
                content={(props) => {
                  const { active, payload } = props as RechartsTooltipProps<(typeof data)[number]>
                  const p = payload?.[0]?.payload
                  if (!active || !p) return null
                  return (
                    <ChartTooltipBox
                      title={`${p.code} ${p.name}`}
                      rows={[{ key: 'u', label: 'загрузка', value: formatPercent(p.value, 1), color: STATUS_HEX[p.status], shape: 'rect' }]}
                      footer={<StatusIndicator status={p.status} />}
                    />
                  )
                }}
              />
              <Bar
                dataKey="value"
                radius={[0, 3, 3, 0]}
                maxBarSize={14}
                isAnimationActive={false}
                label={{ position: 'right', fontSize: 11, fill: CHART.muted, formatter: (v: unknown) => formatPercent(Number(v)) }}
              >
                {data.map((d) => (
                  <Cell key={d.id} fill={STATUS_HEX[d.status]} fillOpacity={dim(highlight, d.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          caption="Загрузка по участкам"
          columns={[
            { key: 'stage', label: 'Участок' },
            { key: 'u', label: 'Загрузка', align: 'right' },
            { key: 'st', label: 'Статус' },
          ]}
          rows={data.map((d) => ({ stage: `${d.code} ${d.name}`, u: formatPercent(d.value, 1), st: <StatusIndicator status={d.status} /> }))}
        />
      }
    />
  )
}

/* ───────── Структура времени цикла ───────── */

export function CycleBreakdownChart({ result, highlight }: StageChartProps) {
  const data = STAGES.map((d, i) => {
    const s = result.stages[i]
    return { id: d.id, code: d.code, name: d.shortName, process: s.processMin, wait: s.waitMin, transport: s.transportMin }
  })
  return (
    <ChartFrame
      title="Время выполнения операций"
      legend={
        <ChartLegend
          items={[
            { label: 'Обработка', color: CHART.primary, shape: 'rect' },
            { label: 'Ожидание в очереди', color: CHART.secondary, shape: 'rect' },
            { label: 'Транспорт', color: CHART.neutral, shape: 'rect' },
          ]}
        />
      }
      chart={
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} tickFormatter={(v: number) => `${v} мин`} />
              <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={92} />
              <Tooltip
                cursor={{ fill: 'rgb(16 24 32 / 0.04)' }}
                content={(props) => {
                  const { active, payload } = props as RechartsTooltipProps<(typeof data)[number]>
                  const p = payload?.[0]?.payload
                  if (!active || !p) return null
                  return (
                    <ChartTooltipBox
                      title={`${p.code} ${p.name}`}
                      rows={[
                        { key: 'p', label: 'обработка', value: formatDuration(p.process), color: CHART.primary, shape: 'rect' },
                        { key: 'w', label: 'ожидание', value: formatDuration(p.wait), color: CHART.secondary, shape: 'rect' },
                        { key: 't', label: 'транспорт', value: formatDuration(p.transport), color: CHART.neutral, shape: 'rect' },
                      ]}
                      footer={`Всего ${formatDuration(p.process + p.wait + p.transport)}`}
                    />
                  )
                }}
              />
              {(['process', 'wait', 'transport'] as const).map((k, idx) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="t"
                  fill={k === 'process' ? CHART.primary : k === 'wait' ? CHART.secondary : CHART.neutral}
                  stroke="#fff"
                  strokeWidth={1}
                  radius={idx === 2 ? [0, 3, 3, 0] : 0}
                  maxBarSize={14}
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.id} fillOpacity={dim(highlight, d.id)} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          caption="Структура времени по участкам"
          columns={[
            { key: 'stage', label: 'Участок' },
            { key: 'p', label: 'Обработка', align: 'right' },
            { key: 'w', label: 'Ожидание', align: 'right' },
            { key: 't', label: 'Транспорт', align: 'right' },
          ]}
          rows={data.map((d) => ({ stage: `${d.code} ${d.name}`, p: formatDuration(d.process), w: formatDuration(d.wait), t: formatDuration(d.transport) }))}
        />
      }
    />
  )
}

/* ───────── Структура затрат ───────── */

export function CostStructure({ result, highlight }: StageChartProps) {
  const h = result.params.hoursPerDay
  const rows = STAGES.map((d, i) => {
    const s = result.stages[i]
    const busy = s.resourceCostPerHour * s.utilization * h
    const idle = s.idleCostPerHour * h
    const variable = s.variableCostPerHour * h
    return { id: d.id, code: d.code, name: d.shortName, busy, idle, variable, total: busy + idle + variable }
  })
  const max = Math.max(...rows.map((r) => r.total))
  return (
    <ChartFrame
      title="Структура затрат"
      legend={
        <ChartLegend
          items={[
            { label: 'Ресурсы в работе', color: CHART.primary, shape: 'rect' },
            { label: 'Простой ресурсов', color: CHART.base, shape: 'rect' },
            { label: 'Переменные', color: CHART.secondary, shape: 'rect' },
          ]}
        />
      }
      chart={
        <ul className="space-y-4 pt-1" aria-label="Затраты участков за сутки">
          {rows.map((r) => (
            <li key={r.id} style={{ opacity: dim(highlight, r.id) }}>
              <div className="mb-1.5 flex items-baseline justify-between text-13">
                <span className="text-ink-2">{r.name}</span>
                <span className="tnum font-medium text-ink">{formatRubCompact(r.total)}</span>
              </div>
              <div
                className="flex h-2 gap-[2px] overflow-hidden"
                style={{ width: `${(r.total / max) * 100}%` }}
                title={`в работе ${formatRubCompact(r.busy)} · простой ${formatRubCompact(r.idle)} · переменные ${formatRubCompact(r.variable)}`}
              >
                <span className="h-full rounded-l-full" style={{ flexGrow: r.busy, backgroundColor: CHART.primary }} />
                <span className="h-full" style={{ flexGrow: r.idle, backgroundColor: CHART.base }} />
                <span className="h-full rounded-r-full" style={{ flexGrow: r.variable, backgroundColor: CHART.secondary }} />
              </div>
            </li>
          ))}
        </ul>
      }
      table={
        <DataTable
          caption="Затраты участков за сутки"
          columns={[
            { key: 'stage', label: 'Участок' },
            { key: 'b', label: 'В работе', align: 'right' },
            { key: 'i', label: 'Простой', align: 'right' },
            { key: 'v', label: 'Переменные', align: 'right' },
            { key: 't', label: 'Всего', align: 'right' },
          ]}
          rows={rows.map((r) => ({
            stage: `${r.code} ${r.name}`,
            b: formatRubCompact(r.busy),
            i: formatRubCompact(r.idle),
            v: formatRubCompact(r.variable),
            t: formatRubCompact(r.total),
          }))}
        />
      }
    />
  )
}
