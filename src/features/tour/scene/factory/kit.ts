/**
 * Процедурная модель цеха: тема, общие геометрии и материалы, контекст сцены.
 * Основа модели сгенерирована в Gemini по описанию планировки и доработана под проект:
 * координаты зон и цвета берутся из данных тура и палитры приложения.
 */
import { createContext, useContext } from 'react'
import * as THREE from 'three'
import { STAGE_COLORS } from '@/components/charts/theme'
import { STATUS_HEX } from '@/components/ui/Status'
import { ZONES as LAYOUT } from '@/data/demo/tour'
import type { StageStatus } from '@/domain/types'

export type { StageStatus }

export type StageId = 'receiving' | 'preparation' | 'machining' | 'inspection' | 'packaging' | 'shipping'

export interface ZoneConfig {
  id: StageId
  centerX: number
  centerZ: number
  sizeX: number
  sizeZ: number
  color: string
}

/** Зоны в порядке потока — из планировки тура (src/data/demo/tour.ts). */
export const ZONES: ZoneConfig[] = LAYOUT.map((z) => ({
  id: z.stageId as StageId,
  centerX: z.center[0],
  centerZ: z.center[1],
  sizeX: z.size[0],
  sizeZ: z.size[1],
  color: STAGE_COLORS[z.stageId],
}))

export const STATUS_COLORS: Record<StageStatus, string> = STATUS_HEX

export const THEME = {
  bg: '#EEF0F2',
  floor: '#E9ECEF',
  floorGrid: '#DDE2E6',
  wall: '#F7F8F9',
  wainscot: '#E2E6EA',
  panelLight: '#F3F5F7',
  panelMid: '#DCE1E6',
  cncDoorFrame: '#6E8894',
  steelLight: '#C5CCD4',
  steelMid: '#8C96A3',
  barDark: '#5A6572',
  barLight: '#7B8794',
  graphite: '#2A2F36',
  graphiteDark: '#1E2228',
  teal: '#17708A',
  yellow: '#E2B93B',
  wood: '#C8A27A',
  cardboard: '#C8A27A',
  cardboardDark: '#B58D63',
  castIron: '#495057',
  granite: '#25282C',
}

// ============================================================================
// PROCEDURAL GEOMETRY & SHARED SINGLETON MATERIAL CACHES
// ============================================================================

export const geometryCache = new Map<string, THREE.BufferGeometry>()
export const materialCache = new Map<string, THREE.Material>()

/**
 * Creates a softly-beveled procedural RoundedBox geometry without any external files.
 */
export function getRoundedBoxGeometry(width: number, height: number, depth: number, radius = 0.06, smoothness = 2): THREE.BufferGeometry {
  const r = Math.min(radius, width * 0.45, height * 0.45, depth * 0.45)
  const key = `rbox_${width.toFixed(3)}_${height.toFixed(3)}_${depth.toFixed(3)}_${r.toFixed(3)}_${smoothness}`
  const cached = geometryCache.get(key)
  if (cached) return cached

  const shape = new THREE.Shape()
  const w = Math.max(0.001, width - r * 2)
  const h = Math.max(0.001, height - r * 2)
  const x0 = -w / 2
  const y0 = -h / 2

  shape.moveTo(x0, y0 + r)
  shape.lineTo(x0, y0 + h - r)
  shape.quadraticCurveTo(x0, y0 + h, x0 + r, y0 + h)
  shape.lineTo(x0 + w - r, y0 + h)
  shape.quadraticCurveTo(x0 + w, y0 + h, x0 + w, y0 + h - r)
  shape.lineTo(x0 + w, y0 + r)
  shape.quadraticCurveTo(x0 + w, y0, x0 + w - r, y0)
  shape.lineTo(x0 + r, y0)
  shape.quadraticCurveTo(x0, y0, x0, y0 + r)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.001, depth - r * 2),
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: r,
    bevelThickness: r,
    curveSegments: smoothness,
  })

  geo.center()
  geo.computeVertexNormals()
  geometryCache.set(key, geo)
  return geo
}

/**
 * Creates a flat horizontal rounded rectangle pad on the XZ plane for architectural floor zones & shadows.
 */
export function getRoundedRectPlaneGeometry(width: number, depth: number, radius = 0.45): THREE.BufferGeometry {
  const r = Math.min(radius, width * 0.45, depth * 0.45)
  const key = `rplane_${width.toFixed(3)}_${depth.toFixed(3)}_${r.toFixed(3)}`
  const cached = geometryCache.get(key)
  if (cached) return cached

  const shape = new THREE.Shape()
  const x0 = -width / 2
  const y0 = -depth / 2

  shape.moveTo(x0, y0 + r)
  shape.lineTo(x0, y0 + depth - r)
  shape.quadraticCurveTo(x0, y0 + depth, x0 + r, y0 + depth)
  shape.lineTo(x0 + width - r, y0 + depth)
  shape.quadraticCurveTo(x0 + width, y0 + depth, x0 + width, y0 + depth - r)
  shape.lineTo(x0 + width, y0 + r)
  shape.quadraticCurveTo(x0 + width, y0, x0 + width - r, y0)
  shape.lineTo(x0 + r, y0)
  shape.quadraticCurveTo(x0, y0, x0, y0 + r)

  const geo = new THREE.ShapeGeometry(shape, 8)
  geo.rotateX(-Math.PI / 2)
  geometryCache.set(key, geo)
  return geo
}

export function getBoxGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = `box_${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`
  let geo = geometryCache.get(key)
  if (!geo) {
    geo = new THREE.BoxGeometry(w, h, d)
    geometryCache.set(key, geo)
  }
  return geo
}

export function getCylinderGeometry(rt: number, rb: number, h: number, seg = 14): THREE.BufferGeometry {
  const key = `cyl_${rt.toFixed(3)}_${rb.toFixed(3)}_${h.toFixed(3)}_${seg}`
  let geo = geometryCache.get(key)
  if (!geo) {
    geo = new THREE.CylinderGeometry(rt, rb, h, seg)
    geometryCache.set(key, geo)
  }
  return geo
}

export function getStandardMaterial(color: string, roughness = 0.82, metalness = 0.06, opacity = 1, transparent = false): THREE.MeshStandardMaterial {
  const key = `std_${color}_${roughness.toFixed(2)}_${metalness.toFixed(2)}_${opacity.toFixed(2)}_${transparent}`
  let mat = materialCache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      opacity,
      transparent,
      depthWrite: !transparent || opacity > 0.55,
    })
    materialCache.set(key, mat)
  }
  return mat
}

export function getLitMaterial(color: string, intensity: number): THREE.MeshStandardMaterial {
  const key = `lit_${color}_${intensity.toFixed(2)}`
  let mat = materialCache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity,
      roughness: 0.45,
      metalness: 0.05,
    })
    materialCache.set(key, mat)
  }
  return mat
}

export function getBasicMaterial(color: string, opacity = 1, transparent = false, polygonOffset = false): THREE.MeshBasicMaterial {
  const key = `bas_${color}_${opacity.toFixed(3)}_${transparent}_${polygonOffset}`
  let mat = materialCache.get(key) as THREE.MeshBasicMaterial | undefined
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      opacity,
      transparent,
      depthWrite: !transparent,
      polygonOffset,
      polygonOffsetFactor: polygonOffset ? -1 : 0,
      polygonOffsetUnits: polygonOffset ? -1 : 0,
    })
    materialCache.set(key, mat)
  }
  return mat
}

export function makeMesh(geo: THREE.BufferGeometry, mat: THREE.Material, castShadow = true, receiveShadow = true, stageId?: StageId): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = castShadow
  mesh.receiveShadow = receiveShadow
  if (stageId) {
    mesh.userData.stageId = stageId
  }
  return mesh
}

export function tagGroupStage(group: THREE.Object3D, stageId: StageId | undefined, shadowsEnabled: boolean) {
  group.traverse((obj) => {
    if (stageId) {
      obj.userData.stageId = stageId
    }
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh
      if (m.userData.noShadow) {
        m.castShadow = false
      } else {
        m.castShadow = shadowsEnabled
      }
      m.receiveShadow = shadowsEnabled
    }
  })
}

/**
 * Soft multi-layered procedural grounding shadow pad so every machine, rack, truck,
 * and pallet feels weightily anchored to the floor (ContactShadow effect).
 */
export function makeContactShadow(width: number, depth: number, opacity = 0.085, radius = 0.18): THREE.Group {
  const g = new THREE.Group()
  const outer = new THREE.Mesh(
    getRoundedRectPlaneGeometry(width + 0.18, depth + 0.18, radius + 0.06),
    getBasicMaterial('#1B2026', opacity * 0.55, true, true),
  )
  outer.position.y = 0.008
  outer.userData.noShadow = true

  const inner = new THREE.Mesh(getRoundedRectPlaneGeometry(width, depth, radius), getBasicMaterial('#15191E', opacity, true, true))
  inner.position.y = 0.011
  inner.userData.noShadow = true

  g.add(outer, inner)
  return g
}

/**
 * Builds a yellow tubular safety handrail barrier for industrial zone protection.
 */
export function buildSafetyBarrier(length: number, height = 1.05): THREE.Group {
  const g = new THREE.Group()
  const yellowMat = getStandardMaterial(THEME.yellow, 0.76, 0.1)
  const baseMat = getStandardMaterial(THEME.graphite, 0.8, 0.2)

  const posts = length > 2.4 ? [-length / 2, 0, length / 2] : [-length / 2, length / 2]
  posts.forEach((px) => {
    const plate = makeMesh(getBoxGeometry(0.18, 0.02, 0.18), baseMat)
    plate.position.set(px, 0.01, 0)
    const post = makeMesh(getCylinderGeometry(0.038, 0.038, height, 10), yellowMat)
    post.position.set(px, height / 2, 0)
    g.add(plate, post)
  })

  const topRail = makeMesh(getCylinderGeometry(0.034, 0.034, length + 0.06, 10), yellowMat)
  topRail.rotation.z = Math.PI / 2
  topRail.position.set(0, height - 0.04, 0)

  const midRail = makeMesh(getCylinderGeometry(0.028, 0.028, length + 0.04, 10), yellowMat)
  midRail.rotation.z = Math.PI / 2
  midRail.position.set(0, height * 0.52, 0)

  g.add(topRail, midRail)
  return g
}

// ============================================================================
// SCENE CONTEXT
// ============================================================================

export type Tick = (dt: number, elapsed: number) => void

export interface FactorySceneContextValue {
  /** Корневая группа модели: компоненты добавляют в неё свои объекты. */
  scene: THREE.Object3D
  quality: 'high' | 'low'
  statuses: Record<StageId, StageStatus>
  registerTick: (fn: Tick) => () => void
}

export const FactorySceneContext = createContext<FactorySceneContextValue | null>(null)

export function useFactoryScene() {
  const ctx = useContext(FactorySceneContext)
  if (!ctx) throw new Error('useFactoryScene: нет FactoryModel выше по дереву')
  return ctx
}

// ============================================================================
// SIGNAL LIGHT TOWER & ZONE FLOOR PAD
// ============================================================================

export function buildSignalTower(status: StageStatus, poleHeight = 0.42): THREE.Group {
  const group = new THREE.Group()
  const graphiteMat = getStandardMaterial(THEME.graphite, 0.72, 0.22)

  // Base flange
  const base = makeMesh(getCylinderGeometry(0.062, 0.072, 0.04, 12), graphiteMat)
  base.position.y = 0.02
  group.add(base)

  // Support stem
  const pole = makeMesh(getCylinderGeometry(0.024, 0.024, poleHeight, 10), graphiteMat)
  pole.position.y = poleHeight / 2
  group.add(pole)

  // 3 stacked light lenses (Red: overload, Amber: high, Green: normal; Idle: muted slate)
  const segH = 0.088
  const startY = poleHeight + 0.04
  const activeColor = STATUS_COLORS[status]

  const segments: Array<{
    key: StageStatus
    y: number
    dimColor: string
  }> = [
    { key: 'bottleneck', y: startY + segH * 2, dimColor: '#4E312D' },
    { key: 'high', y: startY + segH, dimColor: '#4F4028' },
    { key: 'normal', y: startY, dimColor: '#284235' },
  ]

  segments.forEach((seg) => {
    const isLit = status === seg.key || (status === 'idle' && seg.key === 'normal')
    const col = status === 'idle' ? STATUS_COLORS.idle : activeColor

    // Matte colored lens (no neon/glow, clean high-visibility industrial indicator)
    const mat = isLit ? getLitMaterial(col, status === 'idle' ? 0.18 : 0.42) : getStandardMaterial(seg.dimColor, 0.78, 0.08)

    const lens = makeMesh(getCylinderGeometry(0.056, 0.056, segH * 0.86, 14), mat)
    lens.position.y = seg.y
    group.add(lens)
  })

  // Top cap
  const cap = makeMesh(getCylinderGeometry(0.058, 0.058, 0.032, 14), graphiteMat)
  cap.position.y = startY + segH * 2.55
  group.add(cap)

  return group
}

/**
 * Builds the rounded-corner tinted zone floor pad (~12% opacity, ~26% when selected/hovered),
 * crisp perimeter border outline, corner ticks, and zone status beacon.
 */
export function buildZoneFloorPad(zone: ZoneConfig, isSelected: boolean, isHovered: boolean, status: StageStatus): THREE.Group {
  const group = new THREE.Group()
  group.position.set(zone.centerX, 0, zone.centerZ)

  const w = zone.sizeX - 0.32
  const d = zone.sizeZ - 0.32
  const fillOpacity = isSelected ? 0.26 : isHovered ? 0.19 : 0.12

  // Rounded-corner tinted floor pad
  const padGeo = getRoundedRectPlaneGeometry(w, d, 0.55)
  const padMat = getBasicMaterial(zone.color, fillOpacity, true, true)
  const pad = makeMesh(padGeo, padMat, false, true, zone.id)
  pad.position.y = 0.007
  pad.userData.noShadow = true
  group.add(pad)

  // Solid perimeter border frame
  const borderThickness = isSelected ? 0.16 : isHovered ? 0.12 : 0.085
  const borderHeight = isSelected ? 0.032 : 0.016
  const borderOpacity = isSelected ? 1.0 : isHovered ? 0.9 : 0.76
  const borderMat = getBasicMaterial(zone.color, borderOpacity, borderOpacity < 1)

  const north = makeMesh(getBoxGeometry(w - 0.3, borderHeight, borderThickness), borderMat, false, false, zone.id)
  north.position.set(0, borderHeight / 2 + 0.004, -d / 2)
  north.userData.noShadow = true

  const south = makeMesh(getBoxGeometry(w - 0.3, borderHeight, borderThickness), borderMat, false, false, zone.id)
  south.position.set(0, borderHeight / 2 + 0.004, d / 2)
  south.userData.noShadow = true

  const west = makeMesh(getBoxGeometry(borderThickness, borderHeight, d - 0.3), borderMat, false, false, zone.id)
  west.position.set(-w / 2, borderHeight / 2 + 0.004, 0)
  west.userData.noShadow = true

  const east = makeMesh(getBoxGeometry(borderThickness, borderHeight, d - 0.3), borderMat, false, false, zone.id)
  east.position.set(w / 2, borderHeight / 2 + 0.004, 0)
  east.userData.noShadow = true

  group.add(north, south, west, east)

  // Corner L-brackets (always present in subtle form; bold graphite when selected)
  const bracketMat = isSelected ? getBasicMaterial(THEME.graphite, 0.95, false) : getBasicMaterial(zone.color, 0.92, false)
  const bLen = isSelected ? 1.75 : 1.1
  const bThick = isSelected ? 0.12 : 0.09
  const bH = isSelected ? 0.042 : 0.022
  const bw = isSelected ? zone.sizeX + 0.08 : w + 0.04
  const bd = isSelected ? zone.sizeZ + 0.08 : d + 0.04

  const corners: Array<[number, number, number, number]> = [
    [-bw / 2, -bd / 2, 1, 1],
    [bw / 2, -bd / 2, -1, 1],
    [-bw / 2, bd / 2, 1, -1],
    [bw / 2, bd / 2, -1, -1],
  ]
  corners.forEach(([cx, cz, sx, sz]) => {
    const armX = makeMesh(getBoxGeometry(bLen, bH, bThick), bracketMat, false, false, zone.id)
    armX.position.set(cx + (sx * bLen) / 2, bH / 2 + 0.005, cz)
    armX.userData.noShadow = true

    const armZ = makeMesh(getBoxGeometry(bThick, bH, bLen), bracketMat, false, false, zone.id)
    armZ.position.set(cx, bH / 2 + 0.005, cz + (sz * bLen) / 2)
    armZ.userData.noShadow = true

    group.add(armX, armZ)
  })

  // Zone-level status beacon pedestal at back-right of zone
  const pedestal = new THREE.Group()
  pedestal.position.set(zone.sizeX / 2 - 0.85, 0, -zone.sizeZ / 2 + 0.85)
  const basePlate = makeMesh(getCylinderGeometry(0.18, 0.2, 0.04, 12), getStandardMaterial(THEME.graphite, 0.78, 0.2), true, true, zone.id)
  basePlate.position.y = 0.02
  const standPole = makeMesh(getCylinderGeometry(0.042, 0.048, 2.05, 10), getStandardMaterial(THEME.graphite, 0.75, 0.2), true, true, zone.id)
  standPole.position.y = 1.025
  pedestal.add(basePlate, standPole)

  const tower = buildSignalTower(status, 0.36)
  tower.position.y = 2.05
  pedestal.add(tower)
  group.add(pedestal)

  return group
}
