import { CameraControls, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box3, Fog, PerspectiveCamera, Vector3 } from 'three'
import { OVERVIEW_VIEW } from '@/data/demo/tour'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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
  // Подписи меток помещаются только на широком экране; на планшете и телефоне — номера,
  // название появляется при наведении, фокусе и выборе точки.
  const showLabels = useMediaQuery('(min-width: 1200px)')

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
      showLabels={showLabels}
      showStatus={props.showStatus}
    />
    </div>
  )
}

/** Облёт при первом открытии тура в сессии: низкий ракурс сбоку → общий вид цеха. */
let introPlayed = false
const INTRO_FROM = { position: [-52, 18, 46] as const, target: [-6, 1, -2] as const }

/** Габариты цеха с цоколем и воротами (м) — общий вид должен показывать его целиком. */
const HALL_BOX = new Box3(new Vector3(-37, 0, -17.5), new Vector3(37, 8, 17.5))
/** Насколько кадр может быть занят цехом: оставляем поля, чтобы метки не прилипали к краям. */
const FIT_X = 0.9
const FIT_Y = 0.86

/**
 * Во сколько раз отодвинуть камеру общего вида, чтобы цех поместился в окно с таким соотношением сторон.
 * На широком экране ≈ 1, на планшете и телефоне (узкое окно) — больше: иначе цех обрезается по бокам.
 */
function overviewFit(fov: number, aspect: number): number {
  const cam = new PerspectiveCamera(fov, aspect, 0.5, 1000)
  const target = new Vector3(...OVERVIEW_VIEW.target)
  const dir = new Vector3(...OVERVIEW_VIEW.position).sub(target)
  const base = dir.length()
  dir.normalize()
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
    (i) => new Vector3(i & 1 ? HALL_BOX.max.x : HALL_BOX.min.x, i & 2 ? HALL_BOX.max.y : HALL_BOX.min.y, i & 4 ? HALL_BOX.max.z : HALL_BOX.min.z),
  )
  const p = new Vector3()
  const fits = (k: number) => {
    cam.position.copy(target).addScaledVector(dir, base * k)
    cam.lookAt(target)
    cam.updateMatrixWorld()
    return corners.every((c) => {
      p.copy(c).project(cam)
      return Math.abs(p.x) <= FIT_X && Math.abs(p.y) <= FIT_Y
    })
  }
  let lo = 0.8
  let hi = 4
  if (fits(lo)) return lo
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) hi = mid
    else lo = mid
  }
  return hi
}

function CameraRig({ view, nonce, smooth, isMobile, panelOpen }: { view: CameraView | null; nonce: number; smooth: boolean; isMobile: boolean; panelOpen: boolean }) {
  const ref = useRef<CameraControls>(null)
  const first = useRef(true)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const aspect = height > 0 ? width / height : 16 / 9
  const rawFit = useMemo(() => overviewFit(camera.fov, aspect), [camera.fov, aspect])
  // Перекадрируем только при заметной смене пропорций (поворот телефона, другое окно),
  // а не при каждом пикселе — иначе камера сбрасывалась бы, пока человек осматривает цех.
  const [fit, setFit] = useState(rawFit)
  useEffect(() => {
    setFit((prev) => (Math.abs(rawFit - prev) / prev > 0.12 ? rawFit : prev))
  }, [rawFit])
  const maxDistance = Math.max(95, new Vector3(...OVERVIEW_VIEW.position).distanceTo(new Vector3(...OVERVIEW_VIEW.target)) * fit * 1.25)

  // Туман рассчитан на обычную дистанцию — при отодвинутой камере отодвигаем и его, иначе цех «тонет» в дымке.
  useEffect(() => {
    const fog = scene.fog
    if (!(fog instanceof Fog)) return
    const s = Math.max(1, fit)
    fog.near = 110 * s
    fog.far = 220 * s
  }, [scene, fit])

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
    // Общий вид — подгоняем под размер окна. Для точек интереса на телефоне нижний лист закрывает
    // часть экрана — отодвигаем камеру и смещаем кадр вверх.
    const k = view ? (isMobile ? 1.35 : 1) : fit
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
  }, [view, nonce, smooth, isMobile, panelOpen, fit])

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={6}
      maxDistance={maxDistance}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.46}
      dollySpeed={0.7}
      smoothTime={0.45}
      draggingSmoothTime={0.12}
    />
  )
}
