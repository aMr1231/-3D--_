import type { ThreeEvent } from '@react-three/fiber'
import { useState, type ReactNode } from 'react'
import { ZONES } from '@/data/demo/tour'
import type { SimulationResult, StageStatus } from '@/domain/types'
import {
  BandSaw,
  Cmm,
  CncMachine,
  Conveyor,
  Desk,
  Forklift,
  GlassRoom,
  MaterialRack,
  Pallet,
  Rack,
  Table,
  ToolCabinet,
  Truck,
  Worker,
  Wrapper,
} from './Equipment'
import { FloorLabel } from './FloorLabel'
import { ZoneHighlight } from './primitives'
import { STAGES } from '@/data/demo/enterprise'

/** Позиции обрабатывающих центров: базовые 4 в первом ряду, добавленные сценарием — во втором. */
const CNC_SLOTS: [number, number][] = [
  [-6.2, -7],
  [-2.1, -7],
  [2, -7],
  [6.1, -7],
  [-6.2, 0.2],
  [-2.1, 0.2],
  [2, 0.2],
  [6.1, 0.2],
]
const BASE_CNC = 4

/** Рабочие места операторов: x, z, поворот. */
const WORKERS: [number, number, number][] = [
  [-26, -1.25, Math.PI],
  [-17.2, -5.35, Math.PI],
  [-5, -5.15, Math.PI],
  [3.2, -5.15, Math.PI],
  [16.6, -3.05, Math.PI],
  [21.6, -5.4, Math.PI],
  [25.4, -5.4, Math.PI],
  [31, -4.5, Math.PI],
]

interface ZonesProps {
  result: SimulationResult
  selectedStageId: string | null
  onSelectStage: (stageId: string) => void
}

/** Производственные зоны: оборудование каждого участка, клик по зоне открывает точку интереса. */
export function Zones({ result, selectedStageId, onSelectStage }: ZonesProps) {
  const status = (id: string): StageStatus => result.stages.find((s) => s.stageId === id)?.status ?? 'normal'
  const cncCount = Math.min(result.params.stages.machining?.resources ?? BASE_CNC, CNC_SLOTS.length)

  return (
    <group>
      <Zone stageId="receiving" selected={selectedStageId === 'receiving'} onSelect={onSelectStage}>
        <Rack x={-28} z={-12.4} length={10} />
        <Rack x={-28} z={-8.4} length={10} />
        <Table x={-26} z={-2.5} w={2.6} d={1.2} items="castings" />
        <Pallet x={-31.5} z={-3} />
        <Pallet x={-31.5} z={-1.4} />
        <Pallet x={-23.5} z={1.5} />
        <Forklift x={-30} z={3} rot={Math.PI / 2.4} />
      </Zone>

      <Zone stageId="preparation" selected={selectedStageId === 'preparation'} onSelect={onSelectStage}>
        <MaterialRack x={-15} z={-12.6} length={7} />
        <BandSaw x={-17.2} z={-6.5} status={status('preparation')} />
        <BandSaw x={-12.8} z={-6.5} status={status('preparation')} />
        <Table x={-15} z={-1.5} w={2.4} d={1.1} items="castings" />
        <Pallet x={-17.5} z={2.5} />
      </Zone>

      <Zone stageId="machining" selected={selectedStageId === 'machining'} onSelect={onSelectStage}>
        {CNC_SLOTS.slice(0, cncCount).map(([x, z], i) => (
          <CncMachine key={i} x={x} z={z} status={status('machining')} fresh={i >= BASE_CNC} />
        ))}
        <ToolCabinet x={6} z={-13.2} />
        <Pallet x={-8} z={5} />
        <Pallet x={8} z={5} />
      </Zone>

      <Zone stageId="inspection" selected={selectedStageId === 'inspection'} onSelect={onSelectStage}>
        <GlassRoom x={14.5} z={-6.5} w={7.4} d={8} />
        <Cmm x={14.5} z={-7.5} status={status('inspection')} />
        <Desk x={16.6} z={-4} rot={Math.PI} />
        <Table x={14.5} z={1.5} w={2.4} d={1} items="machined" />
      </Zone>

      <Zone stageId="packaging" selected={selectedStageId === 'packaging'} onSelect={onSelectStage}>
        <Conveyor x={23.5} z={-2} length={7} />
        <Table x={21.6} z={-6.5} w={2.2} d={1.1} items="boxes" />
        <Table x={25.4} z={-6.5} w={2.2} d={1.1} items="boxes" />
        <Wrapper x={23} z={3.3} />
        <Pallet x={26.5} z={-12} load="none" />
        <Pallet x={26.5} z={-10.6} load="none" />
      </Zone>

      <Zone stageId="shipping" selected={selectedStageId === 'shipping'} onSelect={onSelectStage}>
        {[-11, -8.5, -6].map((z) => (
          <group key={z}>
            <Pallet x={29.8} z={z} load="boxes" layers={2} />
            <Pallet x={32} z={z} load="boxes" layers={z === -6 ? 1 : 2} />
          </group>
        ))}
        <Forklift x={30.5} z={1.5} rot={-Math.PI / 2} />
      </Zone>

      {/* Операторы на рабочих местах — для масштаба */}
      {WORKERS.map(([x, z, rot], i) => (
        <Worker key={i} x={x} z={z} rot={rot} />
      ))}

      {/* Надписи участков на полу */}
      {ZONES.map((zone) => {
        const def = STAGES.find((s) => s.id === zone.stageId)!
        return <FloorLabel key={zone.stageId} code={def.code} name={def.shortName} x={zone.center[0]} z={5.6} width={Math.min(zone.size[0] - 1.6, 6)} />
      })}

      {/* Транспорт у ворот приёмки и отгрузки */}
      <Truck x={-41.5} z={6} rot={0} />
      <Truck x={41.5} z={6} rot={Math.PI} />
    </group>
  )
}

interface ZoneProps {
  stageId: string
  selected: boolean
  onSelect: (stageId: string) => void
  children: ReactNode
}

function Zone({ stageId, selected, onSelect, children }: ZoneProps) {
  const [hovered, setHovered] = useState(false)
  const layout = ZONES.find((z) => z.stageId === stageId)!
  const [cx, cz] = layout.center
  const [w, d] = layout.size
  const active = selected || hovered

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onSelect(stageId)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
    >
      {/* Подложка зоны и разметка границ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.006, cz]} receiveShadow>
        <planeGeometry args={[w - 0.4, d]} />
        <meshStandardMaterial color={active ? '#c3dde6' : '#c8ced4'} roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} rotation={[-Math.PI / 2, 0, 0]} position={[cx + side * (w / 2 - 0.25), 0.01, cz]}>
          <planeGeometry args={[0.08, d]} />
          <meshStandardMaterial color={active ? '#17708a' : '#c2a24a'} roughness={0.8} />
        </mesh>
      ))}
      <ZoneHighlight.Provider value={active}>{children}</ZoneHighlight.Provider>
    </group>
  )
}
