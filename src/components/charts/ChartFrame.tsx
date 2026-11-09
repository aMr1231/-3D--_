import { ChartColumn, Table } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { SegmentedControl } from '../ui/Controls'
import { Panel } from '../ui/Panel'

interface ChartFrameProps {
  title: ReactNode
  legend?: ReactNode
  actions?: ReactNode
  chart: ReactNode
  /** Табличное представление тех же данных (доступность и точные значения). */
  table: ReactNode
  className?: string
  id?: string
}

/** Панель графика с переключателем «график / таблица». */
export function ChartFrame({ title, legend, actions, chart, table, className, id }: ChartFrameProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Panel
      id={id}
      title={title}
      className={className}
      actions={
        <>
          {actions}
          <SegmentedControl
            label="Представление"
            value={view}
            onChange={setView}
            options={[
              { value: 'chart', label: <span className="sr-only">График</span>, icon: <ChartColumn />, title: 'График' },
              { value: 'table', label: <span className="sr-only">Таблица</span>, icon: <Table />, title: 'Таблица' },
            ]}
          />
        </>
      }
    >
      {view === 'chart' ? (
        <div className="space-y-4">
          {legend}
          {chart}
        </div>
      ) : (
        <div className="scrollbar-thin -mx-5 -mb-5 max-h-[360px] overflow-auto md:-mx-6 md:-mb-6">{table}</div>
      )}
    </Panel>
  )
}

/** Простая плотная таблица данных для табличного представления графиков. */
export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: { key: string; label: string; align?: 'left' | 'right' }[]
  rows: Record<string, ReactNode>[]
  caption: string
}) {
  return (
    <table className="w-full text-13">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-surface">
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className={`border-b border-line px-5 py-2.5 text-xs font-medium whitespace-nowrap text-muted md:px-6 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {columns.map((c) => (
              <td key={c.key} className={`tnum px-5 py-2 whitespace-nowrap md:px-6 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
