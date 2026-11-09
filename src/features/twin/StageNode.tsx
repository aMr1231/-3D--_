import clsx from 'clsx'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ArrowRightToLine, Factory, Trash, Truck } from 'lucide-react'
import { Meter, STATUS_ICON, STATUS_TEXT } from '@/components/ui/Status'
import { formatNumber, plural } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { StageDefinition, StageParams, StageResult } from '@/domain/types'
import { LAYERS, type TwinLayer } from './layers'

export interface StageNodeData extends Record<string, unknown> {
  def: StageDefinition
  result: StageResult
  params: StageParams
  layer: TwinLayer
  /** Значение слоя относительно максимума по линии (0..1). */
  layerShare: number
  isConstraint: boolean
  isSelected: boolean
  /** Пульсация перегруженного участка (выключается при prefers-reduced-motion). */
  pulse: boolean
  targetPosition: Position
  sourcePosition: Position
  extraSource?: Position
}

export type StageFlowNode = Node<StageNodeData, 'stage'>

const hidden = '!size-1.5 !min-w-0 !border-0 !bg-transparent'

/** Узел схемы: название, статус и одно крупное значение выбранного слоя. Детали — в паспорте участка. */
export function StageNode({ data }: NodeProps<StageFlowNode>) {
  const { def, result: s, params, layer, layerShare, isConstraint, isSelected } = data
  const Icon = STATUS_ICON[s.status]
  const layerDef = LAYERS[layer]
  return (
    <div
      className={clsx(
        'relative w-[236px] cursor-pointer rounded-xl border bg-surface text-left transition-shadow',
        s.status === 'bottleneck' ? 'border-crit/70' : s.status === 'high' ? 'border-warn-mark/70' : 'border-line-strong',
        isSelected ? 'shadow-[0_0_0_3px_var(--color-accent-line),0_8px_20px_rgb(17_17_19/0.10)]' : 'hover:shadow-[0_4px_14px_rgb(17_17_19/0.08)]',
      )}
      aria-label={`${def.code} ${def.name}. ${STATUS_META[s.status].label}, ${layerDef.label.toLowerCase()} ${layerDef.format(layerDef.value(s))}. ${formatNumber(s.processedPerHour, 1)} из ${formatNumber(s.capacityPerHour, 1)} шт/ч, ${params.resources} ${plural(params.resources, def.resourceKind)}`}
    >
      {data.pulse && s.status === 'bottleneck' && <span className="twin-pulse pointer-events-none absolute -inset-px rounded-xl" aria-hidden />}
      <Handle type="target" position={data.targetPosition} className={hidden} isConnectable={false} />
      <Handle type="source" position={data.sourcePosition} className={hidden} isConnectable={false} />
      {data.extraSource && <Handle type="source" id="scrap" position={data.extraSource} className={hidden} isConnectable={false} />}

      {isConstraint && (
        <div className="flex items-center gap-1.5 rounded-t-[11px] bg-crit px-4 py-1 text-xs font-medium text-white">
          <Icon className="size-3.5" aria-hidden /> Ограничение линии
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <p className="truncate text-sm font-semibold text-ink">{def.name}</p>
        <Icon className={clsx('size-4 shrink-0', STATUS_TEXT[s.status])} aria-hidden />
      </div>

      <div className="px-4 pt-2 pb-4">
        <p className="tnum text-2xl leading-none font-semibold tracking-[-0.02em] text-ink">{layerDef.format(layerDef.value(s))}</p>
        <div className="mt-3">
          {layer === 'utilization' ? (
            <Meter value={s.utilization} status={s.status} size="md" />
          ) : (
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-data-1" style={{ width: `${Math.max(layerShare * 100, 2)}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────── Терминальные узлы: поставщики, клиенты, брак ───────── */

export interface TerminalNodeData extends Record<string, unknown> {
  kind: 'source' | 'sink' | 'scrap'
  title: string
  value: string
  caption: string
  handle: Position
}

export type TerminalFlowNode = Node<TerminalNodeData, 'terminal'>

const TERMINAL_ICON = { source: ArrowRightToLine, sink: Truck, scrap: Trash }

export function TerminalNode({ data }: NodeProps<TerminalFlowNode>) {
  const Icon = TERMINAL_ICON[data.kind] ?? Factory
  return (
    <div
      className={clsx(
        'w-[176px] rounded-xl border border-dashed px-4 py-3',
        data.kind === 'scrap' ? 'border-line-strong bg-subtle' : 'border-line-strong bg-surface/70',
      )}
    >
      <Handle
        type={data.kind === 'source' ? 'source' : 'target'}
        position={data.handle}
        className={hidden}
        isConnectable={false}
      />
      <div className="flex items-center gap-1.5 text-meta text-muted">
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{data.title}</span>
      </div>
      <p className="tnum mt-1.5 text-heading font-semibold text-ink">{data.value}</p>
      <p className="truncate text-meta text-muted">{data.caption}</p>
    </div>
  )
}
