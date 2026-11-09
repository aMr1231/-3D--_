import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { bakeStatic, disposeBaked } from './bake'
import { Conveyor, Hall } from './hall'
import {
  buildZoneFloorPad,
  FactorySceneContext,
  useFactoryScene,
  ZONES,
  type FactorySceneContextValue,
  type StageId,
  type StageStatus,
  type Tick,
} from './kit'
import { Inspection, Machining, Packaging, Preparation, Receiving, Shipping } from './zones'

export interface FactoryModelProps {
  /** Видимые обрабатывающие центры, 4–8. */
  cncCount: number
  /** Статус каждого участка: цвет сигнальных колонн и темп анимации. */
  statuses: Record<StageId, StageStatus>
  selectedStageId: string | null
  onSelectStage: (stageId: string) => void
  /** Поток изделий на конвейере, шт/ч в масштабе анимации. */
  flowRate: number
  /** low — телефон: без теней и мелких деталей. */
  quality: 'high' | 'low'
  /** Остановить анимацию (prefers-reduced-motion). */
  paused: boolean
}

/**
 * Модель цеха внутри Canvas. Компоненты участков строят объекты Three.js и добавляют их
 * в общую корневую группу; анимация идёт от useFrame; выбор участка — через невидимые объёмы зон.
 */
export function FactoryModel({ cncCount, statuses, selectedStageId, onSelectStage, flowRate, quality, paused }: FactoryModelProps) {
  const root = useMemo(() => new THREE.Group(), [])
  const ticks = useRef(new Set<Tick>())
  const elapsed = useRef(0)
  const [hovered, setHovered] = useState<StageId | null>(null)

  const registerTick = useCallback((fn: Tick) => {
    ticks.current.add(fn)
    return () => {
      ticks.current.delete(fn)
    }
  }, [])

  useFrame((_, delta) => {
    const dt = paused ? 0 : Math.min(delta, 0.05)
    elapsed.current += dt
    ticks.current.forEach((fn) => fn(dt, elapsed.current))
  })

  const context = useMemo<FactorySceneContextValue>(() => ({ scene: root, quality, statuses, registerTick }), [root, quality, statuses, registerTick])

  return (
    <>
      <primitive object={root} />
      <FactorySceneContext.Provider value={context}>
        <Hall />
        <Receiving />
        <Preparation />
        <Machining cncCount={cncCount} />
        <Inspection />
        <Packaging />
        <Shipping />
        <Conveyor flowRate={flowRate} />
        {ZONES.map((zone) => (
          <ZonePad key={zone.id} stageId={zone.id} selected={selectedStageId === zone.id} hovered={hovered === zone.id} />
        ))}
      </FactorySceneContext.Provider>
      <ZonePickers onHover={setHovered} onSelect={onSelectStage} />
    </>
  )
}

/** Подложка зоны: цвет участка, рамка, колонна статуса. Пересобирается только она — не оборудование. */
function ZonePad({ stageId, selected, hovered }: { stageId: StageId; selected: boolean; hovered: boolean }) {
  const { scene, statuses } = useFactoryScene()
  const status = statuses[stageId]
  useEffect(() => {
    const zone = ZONES.find((z) => z.id === stageId)!
    const pad = bakeStatic(buildZoneFloorPad(zone, selected, hovered, status))
    scene.add(pad)
    return () => {
      scene.remove(pad)
      disposeBaked(pad)
    }
  }, [scene, stageId, selected, hovered, status])
  return null
}

/** Невидимые объёмы над зонами: наведение подсвечивает зону, клик открывает её точку интереса. */
function ZonePickers({ onHover, onSelect }: { onHover: (id: StageId | null) => void; onSelect: (id: string) => void }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  return (
    <group>
      {ZONES.map((zone) => (
        <mesh
          key={zone.id}
          geometry={geometry}
          position={[zone.centerX, 1.6, zone.centerZ]}
          scale={[zone.sizeX - 0.4, 3.2, zone.sizeZ]}
          visible={false}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            // Перетаскивание камеры — не клик.
            if (e.delta > 6) return
            e.stopPropagation()
            onSelect(zone.id)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHover(zone.id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            onHover(null)
            document.body.style.cursor = ''
          }}
        />
      ))}
    </group>
  )
}
