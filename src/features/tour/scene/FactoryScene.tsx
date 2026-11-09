import { CameraControls, PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { OVERVIEW_VIEW } from '@/data/demo/tour'
import type { CameraView, SimulationResult, StageStatus } from '@/domain/types'
import { FactoryModel } from './factory/FactoryModel'
import type { StageId } from './factory/kit'
import { AnchorProjector, HotspotOverlay } from './Hotspots'

/** Базовая скорость конвейера в анимации; масштабируется отношением выпуска к базовому сценарию. */
const BASE_FLOW = 120
const MAX_CNC = 8

export interface FactorySceneProps {
  result: SimulationResult
  /** Ракурс камеры для выбранной точки (null — общий вид). */
  view: CameraView | null
  /** Счётчик запросов на повторный облёт (например, «Вернуть ракурс»). */
  viewNonce: number
  selectedPoiId: string | null
  selectedStageId: string | null
  onSelectPoi: (poiId: string) => void
  onSelectStage: (stageId: string) => void
  onReady: () => void
  isMobile: boolean
  reducedMotion: boolean
  speedRatio: number
  showStatus: boolean
  panelOpen: boolean
}

/** Стилизованная сцена цеха: процедурная модель, объединённая геометрия, тени только на ПК. */
export function FactoryScene(props: FactorySceneProps) {
  const { isMobile, reducedMotion, onReady, result } = props
  const [dpr, setDpr] = useState(isMobile ? 1.25 : 1.75)
  const hotspotEls = useRef<Record<string, HTMLElement | null>>({})
  const statuses = useMemo(
    () => Object.fromEntries(result.stages.map((s) => [s.stageId, s.status])) as Record<StageId, StageStatus>,
    [result],
  )
  const cncCount = Math.min(result.params.stages.machining?.resources ?? 4, MAX_CNC)

  return (
    <div className="relative h-full w-full">
    <Canvas
      shadows={isMobile ? false : 'percentage'}
      dpr={[1, dpr]}
      camera={{ position: OVERVIEW_VIEW.position, fov: isMobile ? 50 : 38, near: 0.5, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.03
        onReady()
      }}
      onPointerMissed={() => undefined}
      aria-label="Интерактивная 3D-модель цеха"
      role="img"
    >
      <color attach="background" args={['#eef0f2']} />
      <fog attach="fog" args={['#eef0f2', 110, 220]} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(isMobile ? 1.25 : 1.75)} />

      <hemisphereLight args={['#ffffff', '#d8dee4', 0.9]} position={[0, 55, 0]} />
      <directionalLight
        position={[28, 54, 36]}
        intensity={0.94}
        color="#fffdf8"
        castShadow={!isMobile}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={10}
        shadow-camera-far={150}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-28, 30, -24]} intensity={0.3} color="#eef4f8" />

      <FactoryModel
        cncCount={cncCount}
        statuses={statuses}
        selectedStageId={props.selectedStageId}
        onSelectStage={props.onSelectStage}
        flowRate={BASE_FLOW * props.speedRatio}
        quality={isMobile ? 'low' : 'high'}
        paused={reducedMotion}
      />
      <AnchorProjector elements={hotspotEls} />
      <CameraRig
        view={props.view}
        nonce={props.viewNonce}
        smooth={!reducedMotion}
        isMobile={isMobile}
        panelOpen={props.panelOpen}
      />
    </Canvas>
    <HotspotOverlay
      elements={hotspotEls}
      result={props.result}
      selectedPoiId={props.selectedPoiId}
      onSelect={props.onSelectPoi}
      showLabels={!isMobile}
      showStatus={props.showStatus}
    />
    </div>
  )
}

/** Облёт при первом открытии тура в сессии: низкий ракурс сбоку → общий вид цеха. */
let introPlayed = false
const INTRO_FROM = { position: [-52, 18, 46] as const, target: [-6, 1, -2] as const }

function CameraRig({ view, nonce, smooth, isMobile, panelOpen }: { view: CameraView | null; nonce: number; smooth: boolean; isMobile: boolean; panelOpen: boolean }) {
  const ref = useRef<CameraControls>(null)
  const first = useRef(true)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const v = view ?? OVERVIEW_VIEW
    const isFirst = first.current
    let animate = smooth && !isFirst
    first.current = false
    let restore: number | undefined
    if (isFirst && !view && smooth && !introPlayed) {
      introPlayed = true
      void c.setLookAt(...INTRO_FROM.position, ...INTRO_FROM.target, false)
      c.smoothTime = 1.15
      animate = true
      restore = window.setTimeout(() => {
        if (ref.current) ref.current.smoothTime = 0.45
      }, 3200)
    }
    // На телефоне нижний лист закрывает часть экрана — отодвигаем камеру и смещаем кадр вверх.
    const k = isMobile ? 1.35 : 1
    const [px, py, pz] = v.position
    const [tx, ty, tz] = v.target
    void c.setLookAt(tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k, tx, ty, tz, animate)
    // На ПК карточка справа: сдвигаем кадр, чтобы участок оказался в центре свободной области.
    const offsetX = panelOpen && !isMobile && view ? 3.6 * k : 0
    const offsetY = panelOpen && isMobile ? 5 : 0
    void c.setFocalOffset(offsetX, offsetY, 0, animate)
    return () => {
      if (restore === undefined) return
      window.clearTimeout(restore)
      if (ref.current) ref.current.smoothTime = 0.45
    }
  }, [view, nonce, smooth, isMobile, panelOpen])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={6}
      maxDistance={95}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.46}
      dollySpeed={0.7}
      smoothTime={0.45}
      draggingSmoothTime={0.12}
    />
  )
}
