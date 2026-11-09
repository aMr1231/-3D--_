import type { StageStatus } from '@/domain/types'
import { MAT } from './materials'
import { Box, Cyl, RBox } from './primitives'

type XZ = { x: number; z: number; rot?: number }

const LIGHT: Record<StageStatus, string> = {
  bottleneck: '#e04b32',
  high: '#f0a52c',
  normal: '#3fb06f',
  idle: '#8fa3bd',
}

/** Сигнальная колонна станка: горит сегмент, соответствующий статусу участка в модели. */
export function SignalTower({ x, y, z, status }: { x: number; y: number; z: number; status: StageStatus }) {
  const order: StageStatus[] = ['bottleneck', 'high', 'normal']
  const active = status === 'idle' ? 'normal' : status
  return (
    <group position={[x, y, z]}>
      <Cyl p={[0, 0.25, 0]} radius={0.03} height={0.5} m={MAT.steel} segments={8} />
      {order.map((s, i) => {
        const on = s === active
        return (
          <mesh key={s} position={[0, 0.58 + (2 - i) * 0.17, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.15, 16]} />
            <meshStandardMaterial
              color={on ? LIGHT[s] : '#59616a'}
              emissive={on ? LIGHT[s] : '#000000'}
              emissiveIntensity={on ? 2.4 : 0}
              roughness={0.3}
              transparent={!on}
              opacity={on ? 1 : 0.5}
              toneMapped={!on}
            />
          </mesh>
        )
      })}
      <Cyl p={[0, 1.13, 0]} radius={0.08} height={0.04} m={MAT.machineDark} segments={16} />
    </group>
  )
}

/** 5-осевой обрабатывающий центр. `fresh` — станок, добавленный сценарием. */
export function CncMachine({ x, z, rot = 0, status, fresh }: XZ & { status: StageStatus; fresh?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Станина и корпус */}
      <RBox p={[0, 0.16, 0]} s={[3.05, 0.32, 2.35]} m={MAT.machineDark} radius={0.06} />
      <RBox p={[0, 1.47, -0.02]} s={[2.9, 2.3, 2.2]} m={MAT.machine} radius={0.14} outline />
      <RBox p={[0, 2.66, -0.02]} s={[2.7, 0.1, 2]} m={fresh ? MAT.accent : MAT.machineDark} radius={0.04} />
      {/* Подсвеченная рабочая зона за стеклом двери */}
      <Box p={[-0.3, 1.55, 1.07]} s={[1.5, 1.1, 0.04]} m={MAT.interior} shadow={false} />
      <Box p={[-0.3, 1.55, 1.1]} s={[1.56, 1.16, 0.02]} m={MAT.glass} shadow={false} />
      <Box p={[-0.3, 2.14, 1.1]} s={[1.6, 0.05, 0.05]} m={MAT.machineDark} shadow={false} />
      <Box p={[-0.3, 0.96, 1.1]} s={[1.6, 0.05, 0.05]} m={MAT.machineDark} shadow={false} />
      <Box p={[0.5, 1.55, 1.13]} s={[0.05, 0.6, 0.06]} m={MAT.steel} shadow={false} />
      <Box p={[-0.3, 0.72, 1.09]} s={[2.2, 0.1, 0.03]} m={MAT.accent} shadow={false} />
      {/* Пульт ЧПУ с экраном */}
      <RBox p={[1.2, 1.65, 1.24]} s={[0.5, 0.82, 0.24]} m={MAT.machineDark} radius={0.04} />
      <Box p={[1.2, 1.76, 1.37]} s={[0.36, 0.4, 0.02]} m={MAT.screen} shadow={false} />
      {/* Конвейер стружки */}
      <RBox p={[0, 0.38, -1.48]} s={[1.6, 0.52, 0.62]} m={MAT.steel} radius={0.05} />
      <SignalTower x={-1.25} y={2.71} z={-0.85} status={status} />
    </group>
  )
}

export function BandSaw({ x, z, rot = 0, status }: XZ & { status: StageStatus }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <RBox p={[0, 0.45, 0]} s={[2.4, 0.9, 1.1]} m={MAT.machine} radius={0.07} outline />
      <Box p={[0, 0.92, 0]} s={[2.5, 0.06, 1.2]} m={MAT.machineDark} />
      <RBox p={[-0.7, 1.35, -0.2]} s={[0.3, 0.9, 0.3]} m={MAT.machineDark} radius={0.04} />
      <RBox p={[0.1, 1.75, -0.2]} s={[1.9, 0.5, 0.35]} m={MAT.accent} radius={0.08} />
      <Box p={[0.1, 1.3, -0.2]} s={[1.6, 0.04, 0.05]} m={MAT.steel} shadow={false} />
      <Box p={[1.55, 0.5, 0]} s={[0.7, 0.2, 0.9]} m={MAT.steel} />
      <SignalTower x={-1.05} y={0.95} z={0.4} status={status} />
    </group>
  )
}

/** Условная фигура оператора (для масштаба сцены): спецодежда, сигнальный жилет, каска. */
export function Worker({ x, z, rot = 0 }: XZ) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {[-0.11, 0.11].map((dx) => (
        <Cyl key={dx} p={[dx, 0.42, 0]} radius={0.085} height={0.84} m={MAT.workwear} segments={10} />
      ))}
      <mesh position={[0, 1.18, 0]} material={MAT.hivis} castShadow>
        <capsuleGeometry args={[0.22, 0.45, 6, 12]} />
      </mesh>
      <mesh position={[0, 1.68, 0]} material={MAT.skin} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.75, 0]} material={MAT.helmet} castShadow>
        <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </group>
  )
}

/** Паллета с грузом: литые заготовки или упакованные ящики. */
export function Pallet({ x, z, load = 'castings', layers = 2 }: XZ & { load?: 'castings' | 'boxes' | 'none'; layers?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.07, 0]} s={[1.2, 0.14, 1]} m={MAT.pallet} />
      {load === 'boxes' &&
        Array.from({ length: layers }).map((_, l) =>
          [-0.29, 0.29].map((dx) =>
            [-0.24, 0.24].map((dz) => <Box key={`${l}${dx}${dz}`} p={[dx, 0.36 + l * 0.46, dz]} s={[0.56, 0.44, 0.46]} m={MAT.cardboard} />),
          ),
        )}
      {load === 'castings' &&
        [-0.3, 0.3].map((dx) => [-0.25, 0.25].map((dz) => <Box key={`${dx}${dz}`} p={[dx, 0.36, dz]} s={[0.46, 0.42, 0.4]} m={MAT.casting} />))}
    </group>
  )
}

/** Стеллаж адресного хранения: стойки, балки и паллеты на ярусах. */
export function Rack({ x, z, length = 10, levels = 3 }: XZ & { length?: number; levels?: number }) {
  const bays = Math.round(length / 2.5)
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: bays + 1 }).map((_, i) => (
        <group key={i}>
          <Box p={[-length / 2 + i * 2.5, 2, -0.55]} s={[0.1, 4, 0.1]} m={MAT.rack} />
          <Box p={[-length / 2 + i * 2.5, 2, 0.55]} s={[0.1, 4, 0.1]} m={MAT.rack} />
        </group>
      ))}
      {Array.from({ length: levels }).map((_, l) => (
        <group key={l}>
          <Box p={[0, 0.15 + l * 1.35, -0.55]} s={[length, 0.12, 0.08]} m={MAT.rackBeam} />
          <Box p={[0, 0.15 + l * 1.35, 0.55]} s={[length, 0.12, 0.08]} m={MAT.rackBeam} />
          {Array.from({ length: bays }).map((_, b) =>
            // Детерминированный «рисунок» заполнения ячеек.
            (b * 3 + l * 5) % 7 !== 0 ? (
              <group key={b} position={[-length / 2 + 1.25 + b * 2.5, 0.21 + l * 1.35, 0]}>
                <Pallet x={0} z={0} load={(b + l) % 3 === 0 ? 'boxes' : 'castings'} layers={1} />
              </group>
            ) : null,
          )}
        </group>
      ))}
    </group>
  )
}

export function Forklift({ x, z, rot = 0 }: XZ) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.55, 0]} s={[1.1, 0.8, 1.9]} m={MAT.accent} />
      <Box p={[0, 1.35, -0.25]} s={[1, 0.08, 1.1]} m={MAT.machineDark} />
      {[-0.42, 0.42].map((dx) => (
        <Box key={dx} p={[dx, 0.95, 0.2]} s={[0.06, 0.8, 0.06]} m={MAT.machineDark} />
      ))}
      <Box p={[0, 1.2, 1.05]} s={[0.9, 2.2, 0.12]} m={MAT.machineDark} />
      {[-0.25, 0.25].map((dx) => (
        <Box key={dx} p={[dx, 0.12, 1.65]} s={[0.12, 0.05, 1.1]} m={MAT.steel} />
      ))}
      {[
        [-0.55, -0.6],
        [0.55, -0.6],
        [-0.55, 0.6],
        [0.55, 0.6],
      ].map(([dx, dz]) => (
        <Cyl key={`${dx}${dz}`} p={[dx, 0.22, dz]} radius={0.22} height={0.2} m={MAT.rubber} r={[0, 0, Math.PI / 2]} segments={12} />
      ))}
    </group>
  )
}

export function Table({ x, z, w = 2, d = 1, rot = 0, items }: XZ & { w?: number; d?: number; items?: 'castings' | 'boxes' | 'machined' }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 0.88, 0]} s={[w, 0.06, d]} m={MAT.machineDark} />
      {[
        [-w / 2 + 0.08, -d / 2 + 0.08],
        [w / 2 - 0.08, -d / 2 + 0.08],
        [-w / 2 + 0.08, d / 2 - 0.08],
        [w / 2 - 0.08, d / 2 - 0.08],
      ].map(([dx, dz]) => (
        <Box key={`${dx}${dz}`} p={[dx, 0.43, dz]} s={[0.06, 0.86, 0.06]} m={MAT.steel} />
      ))}
      {items &&
        [-w / 4, w / 4].map((dx) => (
          <Box
            key={dx}
            p={[dx, items === 'boxes' ? 1.11 : 1.07, 0]}
            s={items === 'boxes' ? [0.55, 0.4, 0.45] : [0.42, 0.32, 0.36]}
            m={items === 'boxes' ? MAT.cardboard : items === 'machined' ? MAT.machined : MAT.casting}
          />
        ))}
    </group>
  )
}

/** Координатно-измерительная машина: гранитный стол и портал. */
export function Cmm({ x, z, status }: XZ & { status: StageStatus }) {
  return (
    <group position={[x, 0, z]}>
      <RBox p={[0, 0.35, 0]} s={[2.6, 0.7, 1.8]} m={MAT.machineDark} radius={0.05} outline />
      <Box p={[0, 0.82, 0]} s={[2.5, 0.25, 1.7]} m={MAT.granite} />
      {[-1.15, 1.15].map((dx) => (
        <Box key={dx} p={[dx, 1.65, 0]} s={[0.16, 1.4, 0.3]} m={MAT.machine} />
      ))}
      <Box p={[0, 2.42, 0]} s={[2.5, 0.22, 0.34]} m={MAT.machine} />
      <Box p={[0.2, 2.1, 0.22]} s={[0.22, 0.6, 0.22]} m={MAT.accent} />
      <Cyl p={[0.2, 1.55, 0.22]} radius={0.04} height={0.5} m={MAT.steel} segments={8} />
      <Box p={[-0.3, 1.1, -0.1]} s={[0.5, 0.36, 0.42]} m={MAT.machined} />
      <SignalTower x={1.15} y={2.53} z={-0.25} status={status} />
    </group>
  )
}

/** Термостатированная комната ОТК со стеклянными стенами. */
export function GlassRoom({ x, z, w, d, h = 3 }: XZ & { w: number; d: number; h?: number }) {
  const frame = MAT.machineDark
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, h / 2, -d / 2]} s={[w, h, 0.06]} m={MAT.glass} shadow={false} />
      <Box p={[-w / 2, h / 2, 0]} s={[0.06, h, d]} m={MAT.glass} shadow={false} />
      <Box p={[w / 2, h / 2, 0]} s={[0.06, h, d]} m={MAT.glass} shadow={false} />
      <Box p={[-w / 4 - 0.6, h / 2, d / 2]} s={[w / 2 - 1.2, h, 0.06]} m={MAT.glass} shadow={false} />
      <Box p={[w / 4 + 0.6, h / 2, d / 2]} s={[w / 2 - 1.2, h, 0.06]} m={MAT.glass} shadow={false} />
      {[
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
        [-1.2, d / 2],
        [1.2, d / 2],
      ].map(([dx, dz]) => (
        <Box key={`${dx}${dz}`} p={[dx, h / 2, dz]} s={[0.1, h, 0.1]} m={frame} />
      ))}
      <Box p={[0, h, -d / 2]} s={[w, 0.1, 0.1]} m={frame} />
      <Box p={[0, h, d / 2]} s={[w, 0.1, 0.1]} m={frame} />
      <Box p={[-w / 2, h, 0]} s={[0.1, 0.1, d]} m={frame} />
      <Box p={[w / 2, h, 0]} s={[0.1, 0.1, d]} m={frame} />
    </group>
  )
}

export function Desk({ x, z, rot = 0 }: XZ) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Table x={0} z={0} w={1.6} d={0.8} />
      <Box p={[0, 1.2, -0.2]} s={[0.7, 0.42, 0.04]} m={MAT.monitor} />
      <Box p={[0, 0.98, -0.2]} s={[0.08, 0.16, 0.08]} m={MAT.machineDark} />
    </group>
  )
}

/** Рольганг упаковки. */
export function Conveyor({ x, z, length }: XZ & { length: number }) {
  const rollers = Math.floor(length / 0.5)
  return (
    <group position={[x, 0, z]}>
      {[-0.5, 0.5].map((dz) => (
        <Box key={dz} p={[0, 0.72, dz]} s={[length, 0.14, 0.08]} m={MAT.steel} />
      ))}
      {Array.from({ length: rollers }).map((_, i) => (
        <Cyl key={i} p={[-length / 2 + 0.25 + i * 0.5, 0.74, 0]} radius={0.06} height={0.95} m={MAT.machined} r={[Math.PI / 2, 0, 0]} segments={8} />
      ))}
      {Array.from({ length: Math.ceil(length / 2) + 1 }).map((_, i) =>
        [-0.5, 0.5].map((dz) => <Box key={`${i}${dz}`} p={[-length / 2 + i * 2, 0.35, dz]} s={[0.08, 0.7, 0.08]} m={MAT.steel} />),
      )}
      <Box p={[length / 4, 0.98, 0]} s={[0.55, 0.42, 0.46]} m={MAT.cardboard} />
      <Box p={[-length / 4, 0.98, 0]} s={[0.55, 0.42, 0.46]} m={MAT.cardboard} />
    </group>
  )
}

export function Wrapper({ x, z }: XZ) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.08, 0]} radius={1.1} height={0.16} m={MAT.machineDark} segments={24} />
      <Box p={[1.35, 1.2, 0]} s={[0.25, 2.4, 0.25]} m={MAT.machine} />
      <Box p={[1.15, 1.4, 0]} s={[0.25, 0.4, 0.4]} m={MAT.accent} />
      <Pallet x={0} z={0} load="boxes" layers={2} />
    </group>
  )
}

export function Truck({ x, z, rot = 0 }: XZ) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 2.05, 0]} s={[8.5, 2.7, 2.5]} m={MAT.truck} />
      <Box p={[0, 0.6, 0]} s={[8.5, 0.3, 2.3]} m={MAT.machineDark} />
      <Box p={[-5.3, 1.45, 0]} s={[2, 2.3, 2.4]} m={MAT.truckCab} />
      <Box p={[-6.25, 1.8, 0]} s={[0.06, 0.9, 2.1]} m={MAT.glassDark} shadow={false} />
      {[-5.1, -1.8, 2.4, 3.6].map((dx) =>
        [-1.05, 1.05].map((dz) => (
          <Cyl key={`${dx}${dz}`} p={[dx, 0.45, dz]} radius={0.45} height={0.32} m={MAT.rubber} r={[Math.PI / 2, 0, 0]} segments={14} />
        )),
      )}
    </group>
  )
}

export function ToolCabinet({ x, z, rot = 0 }: XZ) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Box p={[0, 1, 0]} s={[2.4, 2, 0.7]} m={MAT.machineDark} />
      {[0.4, 0.8, 1.2, 1.6].map((y) => (
        <Box key={y} p={[0, y, 0.36]} s={[2.2, 0.02, 0.02]} m={MAT.steel} shadow={false} />
      ))}
    </group>
  )
}

/** Консольный стеллаж для длинномерных заготовок. */
export function MaterialRack({ x, z, length = 6 }: XZ & { length?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 1.4, 0]} s={[length, 0.12, 0.18]} m={MAT.rack} />
      {[-length / 2 + 0.3, 0, length / 2 - 0.3].map((dx) => (
        <Box key={dx} p={[dx, 1.3, 0]} s={[0.16, 2.6, 0.16]} m={MAT.rack} />
      ))}
      {[0.5, 1.2, 1.9].map((y) => (
        <group key={y}>
          {[-length / 2 + 0.3, 0, length / 2 - 0.3].map((dx) => (
            <Box key={dx} p={[dx, y, 0.45]} s={[0.1, 0.08, 0.8]} m={MAT.rack} />
          ))}
          <Box p={[0, y + 0.12, 0.45]} s={[length - 0.4, 0.16, 0.6]} m={MAT.casting} />
        </group>
      ))}
    </group>
  )
}
