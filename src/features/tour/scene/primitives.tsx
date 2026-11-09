import { Outlines, RoundedBox } from '@react-three/drei'
import { createContext, useContext } from 'react'
import type { Material } from 'three'
/* Примитивы низкополигональной сцены: бокс, цилиндр, скруглённый бокс. */
import type { Vec3 } from '@/domain/types'

interface BoxProps {
  /** Позиция центра. */
  p: Vec3
  /** Размеры (x, y, z). */
  s: Vec3
  m: Material
  r?: Vec3
  shadow?: boolean
}

/** Параллелепипед — основной строительный блок низкополигональной сцены. */
export function Box({ p, s, m, r, shadow = true }: BoxProps) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow={shadow} receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  )
}

interface CylProps {
  p: Vec3
  radius: number
  height: number
  m: Material
  r?: Vec3
  segments?: number
}

export function Cyl({ p, radius, height, m, r, segments = 16 }: CylProps) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, segments]} />
    </mesh>
  )
}

interface RBoxProps extends BoxProps {
  radius?: number
  /** Обводить корпус, когда зона участка подсвечена (наведение или выбор). */
  outline?: boolean
}

/** Подсветка зоны участка: оборудование внутри получает контур. */
export const ZoneHighlight = createContext(false)
const OUTLINE_COLOR = '#17708a'

/** Скруглённый корпус (станки, шкафы) — мягкие блики окружения на рёбрах. */
export function RBox({ p, s, m, r, radius = 0.08, shadow = true, outline = false }: RBoxProps) {
  const highlighted = useContext(ZoneHighlight)
  return (
    <RoundedBox args={s} radius={Math.min(radius, ...s.map((v) => v / 2 - 0.001))} smoothness={3} position={p} rotation={r} material={m} castShadow={shadow} receiveShadow>
      {outline && highlighted && <Outlines thickness={5} color={OUTLINE_COLOR} />}
    </RoundedBox>
  )
}
