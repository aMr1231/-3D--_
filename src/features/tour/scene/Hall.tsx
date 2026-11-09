import { Grid } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import { type InstancedMesh, type Material, Object3D } from 'three'
import { FLOW_PATH, HALL } from '@/data/demo/tour'
import type { Vec3 } from '@/domain/types'
import { MAT } from './materials'
import { Box } from './primitives'

const W = HALL.width
const D = HALL.depth
const H = HALL.height

/* Ярусы стены: цоколь, сэндвич-панели, ленточное остекление, верхний пояс. */
const PLINTH = 1.3
const WIN_BOTTOM = 5.1
const WIN_TOP = 6.6

/** Повторяющиеся элементы (рёбра панелей, импосты окон) одной InstancedMesh — один вызов отрисовки. */
function Repeated({ positions, size, material, shadow = false }: { positions: Vec3[]; size: Vec3; material: Material; shadow?: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new Object3D()
    positions.forEach((p, i) => {
      o.position.set(...p)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [positions])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} material={material} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
    </instancedMesh>
  )
}

const range = (from: number, to: number, step: number) => {
  const out: number[] = []
  for (let v = from; v <= to + 1e-6; v += step) out.push(v)
  return out
}

/** Стена из ярусов: цоколь, панели с рёбрами, окна, верхний пояс. Ось — вдоль X (для задней стены). */
function BackWall() {
  const z = -D / 2
  const face = z + 0.17
  const ribs: Vec3[] = range(-W / 2 + 0.75, W / 2 - 0.75, 1.5).flatMap((x) => [
    [x, (PLINTH + WIN_BOTTOM) / 2, face] as Vec3,
    [x, (WIN_TOP + H) / 2, face] as Vec3,
  ])
  const mullions: Vec3[] = range(-W / 2 + 3, W / 2 - 3, 3).map((x) => [x, (WIN_BOTTOM + WIN_TOP) / 2, face] as Vec3)
  return (
    <group>
      <Box p={[0, PLINTH / 2, z]} s={[W, PLINTH, 0.32]} m={MAT.plinth} />
      <Box p={[0, (PLINTH + WIN_BOTTOM) / 2, z]} s={[W, WIN_BOTTOM - PLINTH, 0.3]} m={MAT.wall} />
      <Box p={[0, (WIN_BOTTOM + WIN_TOP) / 2, z]} s={[W, WIN_TOP - WIN_BOTTOM, 0.12]} m={MAT.windowGlass} shadow={false} />
      <Box p={[0, (WIN_TOP + H) / 2, z]} s={[W, H - WIN_TOP, 0.3]} m={MAT.wall} />
      <Box p={[0, WIN_BOTTOM, face]} s={[W, 0.08, 0.08]} m={MAT.steel} shadow={false} />
      <Box p={[0, WIN_TOP, face]} s={[W, 0.08, 0.08]} m={MAT.steel} shadow={false} />
      <Repeated positions={ribs.filter((p) => p[1] < WIN_BOTTOM)} size={[0.06, WIN_BOTTOM - PLINTH, 0.05]} material={MAT.rib} />
      <Repeated positions={ribs.filter((p) => p[1] > WIN_TOP)} size={[0.06, H - WIN_TOP, 0.05]} material={MAT.rib} />
      <Repeated positions={mullions} size={[0.08, WIN_TOP - WIN_BOTTOM, 0.08]} material={MAT.steel} />
    </group>
  )
}

/** Торцевая стена с воротами (проём z ∈ [2; 10], высота 5,5 м). */
function EndWall({ x }: { x: number }) {
  const segments: [number, number][] = [
    [-D / 2, 2],
    [10, D / 2],
  ]
  return (
    <group>
      {segments.map(([z1, z2]) => {
        const len = z2 - z1
        const zc = (z1 + z2) / 2
        return (
          <group key={z1}>
            <Box p={[x, PLINTH / 2, zc]} s={[0.32, PLINTH, len]} m={MAT.plinth} />
            <Box p={[x, (PLINTH + H) / 2, zc]} s={[0.3, H - PLINTH, len]} m={MAT.wall} />
          </group>
        )
      })}
      <Box p={[x, H - 1.25, 6]} s={[0.3, 2.5, 8]} m={MAT.wall} />
      <Box p={[x, H - 2.55, 6]} s={[0.42, 0.15, 8.1]} m={MAT.safety} />
      {[2, 10].map((z) => (
        <Box key={z} p={[x, (H - 2.5) / 2, z]} s={[0.42, H - 2.5, 0.18]} m={MAT.safety} />
      ))}
    </group>
  )
}

/** Корпус цеха в разрезе: пол с сеткой, стены, колонны, разметка потока. */
export function Hall() {
  const columnsX = [-34, -22, -10, 2, 14, 26, 34]
  const [laneStart, laneEnd] = [FLOW_PATH[0][0], FLOW_PATH[FLOW_PATH.length - 1][0]]
  const laneZ = FLOW_PATH[0][2]
  const laneLength = laneEnd - laneStart

  return (
    <group>
      {/* Внешняя площадка и эпоксидный пол цеха с технической сеткой */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} material={MAT.ground} receiveShadow>
        <planeGeometry args={[220, 160]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={MAT.floor} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <Grid
        position={[0, 0.011, 0]}
        args={[W, D]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#b4bbc2"
        sectionSize={4}
        sectionThickness={0.9}
        sectionColor="#a3abb3"
        fadeDistance={140}
        fadeStrength={1}
      />

      {/* Стены: задняя с остеклением, торцевые с воротами, передняя — низкий парапет (разрез) */}
      <BackWall />
      <EndWall x={-W / 2} />
      <EndWall x={W / 2} />
      <Box p={[0, 0.5, D / 2]} s={[W, 1, 0.3]} m={MAT.plinth} />

      {/* Колонны (передний ряд и покрытие сняты — разрез для обзора) */}
      {columnsX.map((x) => (
        <group key={x}>
          <Box p={[x, H / 2, -D / 2 + 0.45]} s={[0.45, H, 0.45]} m={MAT.steel} />
          <Box p={[x, 0.6, D / 2 - 0.45]} s={[0.45, 1.2, 0.45]} m={MAT.steel} />
        </group>
      ))}
      <Box p={[0, H + 0.15, -D / 2 + 0.45]} s={[W, 0.3, 0.3]} m={MAT.steel} shadow={false} />

      {/* Транспортная полоса потока изделий со стрелками направления */}
      <Box p={[(laneStart + laneEnd) / 2, 0.012, laneZ]} s={[laneLength, 0.024, 1.8]} m={MAT.lane} shadow={false} />
      {[-0.95, 0.95].map((dz) => (
        <Box key={dz} p={[(laneStart + laneEnd) / 2, 0.018, laneZ + dz]} s={[laneLength, 0.03, 0.1]} m={MAT.safety} shadow={false} />
      ))}
      {Array.from({ length: Math.floor(laneLength / 4) }).map((_, i) => (
        <mesh key={i} position={[laneStart + 2 + i * 4, 0.032, laneZ + 0.62]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} material={MAT.laneArrow}>
          <circleGeometry args={[0.22, 3]} />
        </mesh>
      ))}

      {/* Пешеходный проход вдоль задней стены */}
      <Box p={[0, 0.012, -D / 2 + 1.4]} s={[W - 1, 0.024, 0.08]} m={MAT.safety} shadow={false} />
    </group>
  )
}
