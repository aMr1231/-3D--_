import clsx from 'clsx'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react'
import { formatNumber } from '@/domain/format'
import type { StageStatus } from '@/domain/types'

export interface FlowEdgeData extends Record<string, unknown> {
  flowPerHour: number
  /** Очередь перед участком-получателем, шт. */
  queue: number
  targetStatus: StageStatus | null
  scrap?: boolean
  animate: boolean
}

export type FlowEdgeType = Edge<FlowEdgeData, 'flow'>

/** Ребро потока: подпись с интенсивностью (шт/ч) и очередью перед следующим участком. */
export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd }: EdgeProps<FlowEdgeType>) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  })
  const queue = data?.queue ?? 0
  const hot = data?.targetStatus === 'bottleneck'
  const warm = data?.targetStatus === 'high'
  const stroke = data?.scrap ? '#b9c1ca' : hot ? '#c0432d' : warm ? '#d4952b' : '#8a95a1'
  const width = data?.scrap ? 1.25 : Math.min(1.5 + queue / 8, 4.5)

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth: width, strokeDasharray: data?.scrap ? '4 3' : undefined }}
      />
      {data?.animate && !data.scrap &&
        // Точки потока: скорость пропорциональна интенсивности (шт/ч), как на обзоре и экране входа.
        [0, 0.5].map((phase) => {
          const dur = Math.max(1.4, Math.min(3.2, 2.2 * (22 / Math.max(data.flowPerHour, 1))))
          return (
            <circle key={phase} r={3} fill={hot ? '#c0432d' : '#17708a'} stroke="#fff" strokeWidth={1.2} opacity={0}>
              <animateMotion dur={`${dur}s`} begin={`${phase * dur}s`} repeatCount="indefinite" path={path} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur={`${dur}s`} begin={`${phase * dur}s`} repeatCount="indefinite" />
            </circle>
          )
        })}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute flex flex-col items-center gap-0.5"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <span className="tnum rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium text-ink-2">
            {formatNumber(data?.flowPerHour ?? 0, data?.scrap ? 2 : 1)} шт/ч
          </span>
          {!data?.scrap && (queue >= 3 || hot || warm) && queue >= 1 && (
            <span
              className={clsx(
                'tnum rounded-full px-2 py-0.5 text-xs font-medium',
                hot ? 'bg-crit-soft text-crit' : warm ? 'bg-warn-soft text-warn' : 'bg-subtle text-muted',
              )}
            >
              очередь {formatNumber(queue, 0)} шт
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
