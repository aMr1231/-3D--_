import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { FLOW_PATH } from '@/data/demo/tour'

interface FlowItemsProps {
  /** Скорость движения относительно базового режима (выпуск сценария / выпуск базы). */
  speedRatio: number
  paused: boolean
  count?: number
}

const CASTING = new Color('#5b6168')
const MACHINED = new Color('#b9c1c9')
const BOXED = new Color('#c9a46c')

/**
 * Изделия на транспортной полосе. Внешний вид меняется по ходу процесса:
 * литая заготовка → обработанный корпус (после механообработки) → упаковка (после участка упаковки).
 * Скорость пропорциональна выпуску активного сценария.
 */
export function FlowItems({ speedRatio, paused, count = 18 }: FlowItemsProps) {
  const ref = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const geometry = useMemo(() => new RoundedBoxGeometry(0.5, 0.42, 0.42, 3, 0.06), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.35, metalness: 0.55 }), [])
  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])
  const [start, end] = [FLOW_PATH[0][0], FLOW_PATH[FLOW_PATH.length - 1][0]]
  const y = FLOW_PATH[0][1]
  const z = FLOW_PATH[0][2]
  const length = end - start
  const offset = useRef(0)

  const place = () => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      const x = start + ((offset.current + (i * length) / count) % length)
      const boxed = x > 21
      const machined = x > 4
      dummy.position.set(x, boxed ? y + 0.08 : y, z)
      const sc = boxed ? 1.25 : 1
      dummy.scale.set(sc, sc, sc)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, boxed ? BOXED : machined ? MACHINED : CASTING)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  useLayoutEffect(place)

  useFrame((_, delta) => {
    if (paused) return
    offset.current = (offset.current + Math.min(delta, 0.1) * 1.1 * speedRatio) % length
    place()
  })

  return (
    <instancedMesh ref={ref} args={[geometry, material, count]} castShadow />
  )
}
