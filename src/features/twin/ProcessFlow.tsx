import '@xyflow/react/dist/style.css'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import { useEffect, useMemo, useRef } from 'react'
import { useReactFlow, type FitViewOptions } from '@xyflow/react'

type Padding = NonNullable<FitViewOptions['padding']>
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { FlowEdge, type FlowEdgeData, type FlowEdgeType } from './FlowEdge'
import { LAYERS, type TwinLayer } from './layers'
import { StageNode, TerminalNode, type StageFlowNode, type TerminalFlowNode } from './StageNode'

/** Раскладка мнемосхемы «змейкой»: верхний ряд слева направо, нижний — справа налево. */
const LAYOUT: Record<string, { x: number; y: number; target: Position; source: Position; extra?: Position }> = {
  receiving: { x: 268, y: 0, target: Position.Left, source: Position.Right },
  preparation: { x: 590, y: 0, target: Position.Left, source: Position.Right },
  machining: { x: 912, y: 0, target: Position.Left, source: Position.Bottom },
  inspection: { x: 912, y: 280, target: Position.Top, source: Position.Left, extra: Position.Bottom },
  packaging: { x: 590, y: 280, target: Position.Right, source: Position.Left },
  shipping: { x: 268, y: 280, target: Position.Right, source: Position.Left },
}

const nodeTypes = { stage: StageNode, terminal: TerminalNode }
const edgeTypes = { flow: FlowEdge }

interface ProcessFlowProps {
  result: SimulationResult
  layer: TwinLayer
  selectedStageId: string | null
  onSelect: (stageId: string | null) => void
}

export function ProcessFlow({ result, layer, selectedStageId, onSelect }: ProcessFlowProps) {
  const reducedMotion = usePrefersReducedMotion()

  const { nodes, edges } = useMemo(() => {
    const layerValues = result.stages.map((s) => LAYERS[layer].value(s))
    const maxLayer = Math.max(...layerValues, 1e-9)
    const byId = Object.fromEntries(result.stages.map((s) => [s.stageId, s]))

    const stageNodes: StageFlowNode[] = STAGES.map((def, i) => {
      const pos = LAYOUT[def.id]
      return {
        id: def.id,
        type: 'stage',
        position: { x: pos.x, y: pos.y },
        selected: def.id === selectedStageId,
        data: {
          def,
          result: result.stages[i],
          params: result.params.stages[def.id],
          layer,
          layerShare: layerValues[i] / maxLayer,
          isConstraint: def.id === result.constraintStageId && result.stages[i].status !== 'normal',
          isSelected: def.id === selectedStageId,
          pulse: !reducedMotion,
          targetPosition: pos.target,
          sourcePosition: pos.source,
          extraSource: pos.extra,
        },
      }
    })

    const inspection = byId.inspection
    const scrapPerDay = inspection ? (inspection.processedPerHour - inspection.outflowPerHour) * result.params.hoursPerDay : 0

    const terminals: TerminalFlowNode[] = [
      {
        id: 'source',
        type: 'terminal',
        position: { x: 0, y: 34 },
        selectable: false,
        data: {
          kind: 'source',
          title: 'Запуск',
          value: `${formatNumber(result.params.loadPerHour, 1)} шт/ч`,
          caption: 'заготовки',
          handle: Position.Right,
        },
      },
      {
        id: 'sink',
        type: 'terminal',
        position: { x: 0, y: 314 },
        selectable: false,
        data: {
          kind: 'sink',
          title: 'Отгрузка',
          value: `${formatNumber(result.outputPerDay, 0)} шт/сут`,
          caption: `план ${formatNumber(result.plannedOutputPerDay, 0)} шт`,
          handle: Position.Right,
        },
      },
      {
        id: 'scrap',
        type: 'terminal',
        position: { x: 946, y: 520 },
        selectable: false,
        data: {
          kind: 'scrap',
          title: 'Брак ОТК',
          value: `${formatNumber(scrapPerDay, 1)} шт/сут`,
          caption: 'изолятор брака',
          handle: Position.Top,
        },
      },
    ]

    const marker = (color: string) => ({ type: MarkerType.ArrowClosed, color, width: 14, height: 14 })
    const colorFor = (status: string | null) => (status === 'bottleneck' ? '#c0432d' : status === 'high' ? '#d4952b' : '#8a95a1')

    const chain = ['source', ...STAGES.map((s) => s.id), 'sink']
    const flowEdges: FlowEdgeType[] = chain.slice(0, -1).map((from, i) => {
      const to = chain[i + 1]
      const target = byId[to]
      const flowPerHour = from === 'source' ? result.params.loadPerHour : byId[from].outflowPerHour
      const data: FlowEdgeData = {
        flowPerHour,
        queue: target ? target.queueLength : 0,
        targetStatus: target ? target.status : null,
        animate: !reducedMotion,
      }
      return {
        id: `${from}-${to}`,
        source: from,
        target: to,
        type: 'flow',
        data,
        markerEnd: marker(colorFor(data.targetStatus)),
        focusable: false,
      }
    })
    flowEdges.push({
      id: 'inspection-scrap',
      source: 'inspection',
      sourceHandle: 'scrap',
      target: 'scrap',
      type: 'flow',
      data: {
        flowPerHour: inspection ? inspection.processedPerHour - inspection.outflowPerHour : 0,
        queue: 0,
        targetStatus: null,
        scrap: true,
        animate: false,
      },
      markerEnd: marker('#b9c1ca'),
      focusable: false,
    })

    return { nodes: [...terminals, ...stageNodes] as Node[], edges: flowEdges as Edge[] }
  }, [result, layer, selectedStageId, reducedMotion])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.07 }}
      minZoom={0.35}
      maxZoom={1.75}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      selectNodesOnDrag={false}
      onNodeClick={(_, node) => {
        if (node.type === 'stage') onSelect(node.id)
      }}
      onPaneClick={() => onSelect(null)}
      proOptions={{ hideAttribution: true }}
      aria-label="Мнемосхема производственной линии"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#dcdce1" bgColor="#f7f7f8" />
      <Controls showInteractive={false} position="bottom-right" />
      <FitToPanel panelOpen={!!selectedStageId} />
    </ReactFlow>
  )
}

/** Перекадрирование схемы, чтобы открытая панель деталей не закрывала участки. */
function FitToPanel({ panelOpen }: { panelOpen: boolean }) {
  const { fitView } = useReactFlow()
  const first = useRef(true)
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const padding: Padding = panelOpen
      ? mobile
        ? { top: '16px', left: '16px', right: '16px', bottom: '62%' }
        : { top: '28px', left: '28px', bottom: '28px', right: '396px' }
      : 0.07
    const id = window.setTimeout(() => fitView({ padding, duration: first.current ? 0 : 280 }), first.current ? 60 : 0)
    first.current = false
    return () => window.clearTimeout(id)
  }, [panelOpen, fitView])
  return null
}
