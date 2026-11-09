/** Оборудование шести участков линии. Подложки зон — в ZonePads (FactoryModel). */
import { useEffect, type FC } from 'react'
import * as THREE from 'three'
import {
  THEME,
  ZONES,
  buildSignalTower,
  getBasicMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  getRoundedBoxGeometry,
  getRoundedRectPlaneGeometry,
  getStandardMaterial,
  makeContactShadow,
  makeMesh,
  tagGroupStage,
  useFactoryScene,
  type StageStatus,
} from './kit'
import { bakeStatic, disposeBaked } from './bake'
import { Forklift, Truck, Worker } from './actors'

// ============================================================================
// ZONE 1: RECEIVING (-27.5, -1) 12 x 26 m
// ============================================================================

export const Receiving: FC = () => {
  const { scene, quality, statuses } = useFactoryScene()
  const zone = ZONES[0]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    // 1. Two 3-Level Heavy-Duty Pallet Racks along the back (z = -11.5)
    const rackCentersX = [-30.3, -24.7]
    const rackZ = -11.5
    const rackW = 4.5
    const rackD = 1.3
    const rackH = 4.6
    const levelsY = [0.24, 1.68, 3.12]

    const uprightMat = getStandardMaterial('#1B5E7B', 0.76, 0.2)
    const beamMat = getStandardMaterial('#E07A2E', 0.75, 0.12)
    const graphiteMat = getStandardMaterial(THEME.graphite, 0.78, 0.22)
    const woodMat = getStandardMaterial(THEME.wood, 0.85, 0.03)
    const ironMat = getStandardMaterial(THEME.castIron, 0.72, 0.34)

    rackCentersX.forEach((rx) => {
      const sh = makeContactShadow(rackW + 0.35, rackD + 0.35, 0.12)
      sh.position.set(rx, 0, rackZ)
      group.add(sh)

      // 6 vertical uprights + diagonal side bracing per rack
      ;[-rackW / 2, 0, rackW / 2].forEach((ox) => {
        ;[-rackD / 2, rackD / 2].forEach((oz) => {
          const post = makeMesh(getBoxGeometry(0.11, rackH, 0.11), uprightMat)
          post.position.set(rx + ox, rackH / 2, rackZ + oz)
          group.add(post)
        })
        // Horizontal & diagonal side braces
        for (let b = 0; b < 3; b++) {
          const brace = makeMesh(getBoxGeometry(0.05, 0.05, rackD - 0.1), uprightMat)
          brace.position.set(rx + ox, 0.9 + b * 1.35, rackZ)
          group.add(brace)
        }
      })

      // 3 levels of load beams + wooden pallets + cast-iron gearbox housing blanks
      levelsY.forEach((ly) => {
        ;[-rackD / 2, rackD / 2].forEach((oz) => {
          const beam = makeMesh(getBoxGeometry(rackW + 0.12, 0.12, 0.085), beamMat)
          beam.position.set(rx, ly, rackZ + oz)
          group.add(beam)
        })

        ;[-1.38, 0, 1.38].forEach((px) => {
          const pallet = makeMesh(getRoundedBoxGeometry(1.12, 0.13, 1.12, 0.02), woodMat)
          pallet.position.set(rx + px, ly + 0.12, rackZ)
          group.add(pallet)

          // Flanged cast-iron gearbox housing blanks on each pallet
          ;[-0.25, 0.25].forEach((cx) => {
            ;[-0.25, 0.25].forEach((cz) => {
              const body = makeMesh(getRoundedBoxGeometry(0.38, 0.32, 0.38, 0.05), ironMat)
              body.position.set(rx + px + cx, ly + 0.34, rackZ + cz)
              const boreBoss = makeMesh(getCylinderGeometry(0.11, 0.13, 0.1, 10), ironMat)
              boreBoss.position.set(rx + px + cx, ly + 0.53, rackZ + cz)
              group.add(body, boreBoss)
            })
          })
        })
      })
    })

    // 2. Floor Pallet Staging Bays with Raw Castings (x = -31.2..-29.4, z = -1.2..0.8)
    const stagedCoords: Array<[number, number]> = [
      [-31.2, -1.2],
      [-29.5, -1.2],
      [-31.2, 0.7],
      [-29.5, 0.7],
    ]
    stagedCoords.forEach(([sx, sz]) => {
      const sh = makeContactShadow(1.25, 1.25, 0.11)
      sh.position.set(sx, 0, sz)
      group.add(sh)

      const pallet = makeMesh(getRoundedBoxGeometry(1.15, 0.14, 1.15, 0.02), woodMat)
      pallet.position.set(sx, 0.07, sz)
      group.add(pallet)

      ;[-0.26, 0.26].forEach((cx) => {
        ;[-0.26, 0.26].forEach((cz) => {
          const housing = makeMesh(getRoundedBoxGeometry(0.4, 0.36, 0.4, 0.05), ironMat)
          housing.position.set(sx + cx, 0.32, sz + cz)
          const boss = makeMesh(getCylinderGeometry(0.12, 0.13, 0.1, 10), ironMat)
          boss.position.set(sx + cx, 0.53, sz + cz)
          group.add(housing, boss)
        })
      })
    })

    // 3. Receiving Inspection Workstation & Floor Scale (at x = -24.8, z = 2.8)
    const tableGroup = new THREE.Group()
    tableGroup.position.set(-24.8, 0, 2.8)
    tableGroup.add(makeContactShadow(2.65, 1.35, 0.11))

    const tableTop = makeMesh(getRoundedBoxGeometry(2.45, 0.08, 1.12, 0.02), getStandardMaterial(THEME.panelLight, 0.76, 0.05))
    tableTop.position.y = 0.88
    tableGroup.add(tableTop)

    ;[-1.1, 1.1].forEach((lx) => {
      ;[-0.46, 0.46].forEach((lz) => {
        const leg = makeMesh(getBoxGeometry(0.075, 0.86, 0.075), graphiteMat)
        leg.position.set(lx, 0.43, lz)
        tableGroup.add(leg)
      })
    })

    const underCabinet = makeMesh(getRoundedBoxGeometry(0.76, 0.68, 0.96, 0.03), getStandardMaterial(THEME.teal, 0.75, 0.12))
    underCabinet.position.set(-0.62, 0.42, 0)

    const monitor = makeMesh(getRoundedBoxGeometry(0.55, 0.36, 0.04, 0.01), graphiteMat)
    monitor.position.set(-0.65, 1.18, -0.25)

    const sampleBlank = makeMesh(getRoundedBoxGeometry(0.42, 0.36, 0.42, 0.06), ironMat)
    sampleBlank.position.set(0.48, 1.1, 0)

    tableGroup.add(underCabinet, monitor, sampleBlank)
    group.add(tableGroup)

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, zone])

  return (
    <>
      <Forklift position={[-27.8, 0, -4.5]} rotationY={0.22} stageId="receiving" hasPallet={true} boxLoad={false} />
      <Truck side="left" stageId="receiving" />
      <Worker position={[-24.8, 0, 4.0]} rotationY={Math.PI} stageId="receiving" hasTablet={true} />
    </>
  )
}

// ============================================================================
// ZONE 2: PREPARATION (-15, -1) 10 x 26 m
// ============================================================================

export const Preparation: FC = () => {
  const { scene, quality, statuses } = useFactoryScene()
  const zone = ZONES[1]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    const graphiteMat = getStandardMaterial(THEME.graphite, 0.78, 0.22)
    const wallMat = getStandardMaterial(THEME.wall, 0.8, 0.06)
    const tealMat = getStandardMaterial(THEME.teal, 0.75, 0.14)
    const barLightMat = getStandardMaterial(THEME.barLight, 0.55, 0.38)
    const barDarkMat = getStandardMaterial(THEME.barDark, 0.62, 0.35)

    // 1. Multi-Tier Cantilever Bar Racks loaded with Steel Bar Stock (z = -9.9)
    ;[-17.4, -12.6].forEach((rx) => {
      const rackGroup = new THREE.Group()
      rackGroup.position.set(rx, 0, -9.9)
      rackGroup.add(makeContactShadow(3.9, 1.85, 0.12))

      ;[-1.45, 0, 1.45].forEach((cx) => {
        const base = makeMesh(getBoxGeometry(0.14, 0.12, 1.6), graphiteMat)
        base.position.set(cx, 0.06, 0)
        const postL = makeMesh(getBoxGeometry(0.12, 1.35, 0.12), graphiteMat)
        postL.position.set(cx, 0.675, -0.7)
        const postR = makeMesh(getBoxGeometry(0.12, 1.35, 0.12), graphiteMat)
        postR.position.set(cx, 0.675, 0.7)
        rackGroup.add(base, postL, postR)
      })

      const barGeo = getCylinderGeometry(0.088, 0.088, 3.7, 12)
      barGeo.rotateZ(Math.PI / 2)
      for (let row = 0; row < 4; row++) {
        const count = 6 - row
        for (let i = 0; i < count; i++) {
          const bz = (i - (count - 1) / 2) * 0.19
          const by = 0.22 + row * 0.16
          const bar = makeMesh(barGeo, row % 2 === 0 ? barLightMat : barDarkMat)
          bar.position.set(0, by, bz)
          rackGroup.add(bar)
        }
      }
      group.add(rackGroup)
    })

    // 2. Heavy Horizontal Industrial Band Saw + Long Roller Infeed Table (z = -3.2)
    const sawGroup = new THREE.Group()
    sawGroup.position.set(-15.0, 0, -3.2)
    sawGroup.add(makeContactShadow(8.6, 2.3, 0.13))

    const infeedLen = 5.1
    const infeedX = -1.45
    const infeedH = 0.86
    const railF = makeMesh(getBoxGeometry(infeedLen, 0.14, 0.08), graphiteMat)
    railF.position.set(infeedX, infeedH, 0.48)
    const railB = makeMesh(getBoxGeometry(infeedLen, 0.14, 0.08), graphiteMat)
    railB.position.set(infeedX, infeedH, -0.48)
    sawGroup.add(railF, railB)

    ;[-3.8, -2.3, -0.8, 0.75].forEach((lx) => {
      const leg = makeMesh(getBoxGeometry(0.1, infeedH, 0.94), graphiteMat)
      leg.position.set(lx, infeedH / 2, 0)
      sawGroup.add(leg)
    })

    // Instanced rollers on infeed table
    const rGeo = getCylinderGeometry(0.046, 0.046, 0.88, 10)
    rGeo.rotateX(Math.PI / 2)
    const rInst = new THREE.InstancedMesh(rGeo, barLightMat, 16)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < 16; i++) {
      dummy.position.set(-3.8 + i * 0.31, infeedH + 0.02, 0)
      dummy.updateMatrix()
      rInst.setMatrixAt(i, dummy.matrix)
    }
    rInst.instanceMatrix.needsUpdate = true
    sawGroup.add(rInst)

    // Long steel bar stock being fed into saw
    const activeBar = makeMesh(getCylinderGeometry(0.125, 0.125, 4.5, 14), barLightMat)
    activeBar.rotation.z = Math.PI / 2
    activeBar.position.set(-1.1, infeedH + 0.165, 0)
    sawGroup.add(activeBar)

    // Band Saw Base, Blade Wheel Arch, Hydraulic Cylinder & Control Stand
    const sawBase = makeMesh(getRoundedBoxGeometry(2.15, 0.88, 1.68, 0.06), graphiteMat)
    sawBase.position.set(2.0, 0.44, 0)

    const sawArch = makeMesh(getRoundedBoxGeometry(1.9, 0.98, 1.48, 0.08), wallMat)
    sawArch.position.set(2.0, 1.38, -0.06)

    const sawBow = makeMesh(getRoundedBoxGeometry(1.72, 0.42, 0.48, 0.05), tealMat)
    sawBow.position.set(1.95, 1.28, 0.34)
    sawBow.rotation.z = -0.11

    const hydCyl = makeMesh(getCylinderGeometry(0.06, 0.06, 0.75, 10), barLightMat)
    hydCyl.position.set(1.35, 1.2, 0.42)
    hydCyl.rotation.z = 0.18

    // Swiveling operator control stand
    const ctrlStand = makeMesh(getCylinderGeometry(0.04, 0.04, 1.15, 8), graphiteMat)
    ctrlStand.position.set(3.25, 0.575, 0.65)
    const ctrlBox = makeMesh(getRoundedBoxGeometry(0.42, 0.36, 0.22, 0.03), wallMat)
    ctrlBox.position.set(3.25, 1.22, 0.65)
    ctrlBox.rotation.x = -0.35

    const sawTower = buildSignalTower(status, 0.4)
    sawTower.position.set(2.65, 1.88, 0.42)

    sawGroup.add(sawBase, sawArch, sawBow, hydCyl, ctrlStand, ctrlBox, sawTower)
    group.add(sawGroup)

    // 3. Deburring & Preparation Workbench with Tool Shadowboard (at x = -15.0, z = 2.6)
    const bench = new THREE.Group()
    bench.position.set(-15.0, 0, 2.6)
    bench.add(makeContactShadow(3.5, 1.4, 0.11))

    const benchTop = makeMesh(getRoundedBoxGeometry(3.25, 0.09, 1.18, 0.02), getStandardMaterial(THEME.wood, 0.82, 0.04))
    benchTop.position.y = 0.9

    const cabinetL = makeMesh(getRoundedBoxGeometry(0.88, 0.84, 1.04, 0.04), tealMat)
    cabinetL.position.set(-1.06, 0.42, 0)

    const cabinetR = makeMesh(getRoundedBoxGeometry(0.88, 0.84, 1.04, 0.04), graphiteMat)
    cabinetR.position.set(1.06, 0.42, 0)

    // Back tool shadowboard & vise
    const shadowBoard = makeMesh(getRoundedBoxGeometry(3.15, 0.78, 0.06, 0.02), graphiteMat)
    shadowBoard.position.set(0, 1.32, -0.54)

    for (let i = 0; i < 4; i++) {
      const slug = makeMesh(getCylinderGeometry(0.11, 0.11, 0.28, 12), barLightMat)
      slug.position.set(-0.4 + i * 0.34, 1.08, 0.12)
      bench.add(slug)
    }

    bench.add(benchTop, cabinetL, cabinetR, shadowBoard)
    group.add(bench)

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, zone])

  return (
    <>
      <Worker position={[-13.0, 0, -1.55]} rotationY={Math.PI} stageId="preparation" />
      <Worker position={[-15.2, 0, 3.85]} rotationY={Math.PI} stageId="preparation" hasTablet={true} />
    </>
  )
}

// ============================================================================
// ZONE 3: MACHINING (0, -1) 18 x 26 m — 8 Vertical CNC Machining Centers
// ============================================================================

/**
 * Builds the reference Vertical CNC Machining Center (3.0m wide x 2.2m deep x 2.6m tall):
 * - Dark graphite base with central forklift toe-kick recess & yellow-black hazard stripes
 * - Softly beveled off-white & light-grey enclosure panels with side windows & muted teal bands
 * - Stepped top Z-axis/ATC housing with dark louvered vents
 * - Sliding front double doors with teal-grey frames, grab handles & clear windows
 * - Visible interior chamber with work light, T-slot table, fixture vise, casting & animated spindle
 * - Swing-arm CNC control pendant on the right side
 * - Angled chip conveyor at the left/rear + wheeled chip bin
 * - 3-segment signal light tower on top
 */
function buildCNCMachine(status: StageStatus, doorOpenOffset = 0.34): { group: THREE.Group; spindleAssembly: THREE.Group } {
  const cnc = new THREE.Group()

  const offWhiteMat = getStandardMaterial(THEME.wall, 0.78, 0.06)
  const lightGreyMat = getStandardMaterial(THEME.panelMid, 0.8, 0.08)
  const graphiteMat = getStandardMaterial(THEME.graphite, 0.8, 0.22)
  const darkChamberMat = getStandardMaterial('#363D45', 0.76, 0.22)
  const tealMat = getStandardMaterial(THEME.teal, 0.72, 0.14)
  const doorFrameMat = getStandardMaterial(THEME.cncDoorFrame, 0.72, 0.15)
  const steelMat = getStandardMaterial(THEME.steelLight, 0.46, 0.52)
  const yellowMat = getStandardMaterial(THEME.yellow, 0.76, 0.08)
  const glassMat = getStandardMaterial('#93B5C4', 0.25, 0.1, 0.35, true)

  // Soft grounding shadow pad under CNC & chip conveyor
  const sh = makeContactShadow(3.55, 2.55, 0.15, 0.22)
  cnc.add(sh)

  // Operator anti-fatigue floor mat in front of doors
  const matMesh = makeMesh(getRoundedBoxGeometry(1.55, 0.02, 0.68, 0.01), graphiteMat)
  matMesh.position.set(-0.05, 0.01, 1.52)
  cnc.add(matMesh)

  // 1. Heavy Dark Graphite Base (3.0m x 0.42m x 2.2m) with central recessed toe-kick
  const baseMain = makeMesh(getRoundedBoxGeometry(3.0, 0.42, 2.2, 0.05), graphiteMat)
  baseMain.position.set(0, 0.21, 0)
  cnc.add(baseMain)

  // Yellow-black hazard stripes at bottom front left & right feet
  ;[-1.12, 1.12].forEach((sx) => {
    const yellowPad = makeMesh(getBoxGeometry(0.68, 0.082, 0.045), yellowMat)
    yellowPad.position.set(sx, 0.06, 1.095)
    cnc.add(yellowPad)
    for (let k = -1; k <= 1; k++) {
      const blackTick = makeMesh(getBoxGeometry(0.095, 0.086, 0.05), graphiteMat)
      blackTick.position.set(sx + k * 0.2, 0.06, 1.098)
      cnc.add(blackTick)
    }
  })

  // Lower light-grey skirt & muted teal horizontal belt line
  const skirt = makeMesh(getRoundedBoxGeometry(2.98, 0.32, 2.18, 0.04), lightGreyMat)
  skirt.position.set(0, 0.58, 0)
  const tealBelt = makeMesh(getBoxGeometry(3.01, 0.065, 2.21), tealMat)
  tealBelt.position.set(0, 0.43, 0)
  cnc.add(skirt, tealBelt)

  // 2. Main Enclosure Cabinet Cheeks, Back Wall & Side Viewing Windows
  const backPanel = makeMesh(getRoundedBoxGeometry(2.96, 1.56, 0.28, 0.05), offWhiteMat)
  backPanel.position.set(0, 1.52, -0.95)

  const leftCheek = makeMesh(getRoundedBoxGeometry(0.86, 1.56, 2.16, 0.06), offWhiteMat)
  leftCheek.position.set(-1.05, 1.52, 0)

  // Left side inspection window frame
  const sideWinFrame = makeMesh(getRoundedBoxGeometry(0.05, 0.98, 0.68, 0.02), lightGreyMat)
  sideWinFrame.position.set(-1.47, 1.5, 0.12)
  const sideWinGlass = makeMesh(getBoxGeometry(0.06, 0.82, 0.52), glassMat, false, false)
  sideWinGlass.position.set(-1.475, 1.5, 0.12)
  sideWinGlass.userData.noShadow = true

  const rightCheek = makeMesh(getRoundedBoxGeometry(0.76, 1.56, 2.16, 0.06), offWhiteMat)
  rightCheek.position.set(1.1, 1.52, 0)

  const topCrown = makeMesh(getRoundedBoxGeometry(2.96, 0.24, 2.16, 0.05), offWhiteMat)
  topCrown.position.set(0, 2.32, 0)

  // Stepped top Z-axis column & tool-changer shrouds with louvered vents
  const topShroudFront = makeMesh(getRoundedBoxGeometry(1.45, 0.26, 0.85, 0.04), lightGreyMat)
  topShroudFront.position.set(-0.22, 2.46, 0.15)

  const topShroudRear = makeMesh(getRoundedBoxGeometry(1.1, 0.42, 1.05, 0.04), lightGreyMat)
  topShroudRear.position.set(0.05, 2.54, -0.32)

  const ventBlock = makeMesh(getBoxGeometry(1.12, 0.24, 0.32), graphiteMat)
  ventBlock.position.set(0.05, 2.55, -0.62)

  // Front lower teal accent strips on cheeks
  const accentL = makeMesh(getBoxGeometry(0.74, 0.075, 0.04), tealMat)
  accentL.position.set(-1.05, 0.82, 1.075)
  const accentR = makeMesh(getBoxGeometry(0.64, 0.075, 0.04), tealMat)
  accentR.position.set(1.1, 0.82, 1.075)

  cnc.add(backPanel, leftCheek, sideWinFrame, sideWinGlass, rightCheek, topCrown, topShroudFront, topShroudRear, ventBlock, accentL, accentR)

  // 3. Visible Interior Machining Chamber: Work Table, Fixture Vise & Animated Spindle
  const chamberFloor = makeMesh(getBoxGeometry(1.52, 0.08, 1.62), darkChamberMat)
  chamberFloor.position.set(0.02, 0.78, -0.05)

  // Interior LED work-light bar under top header
  const workLight = makeMesh(getRoundedBoxGeometry(0.68, 0.05, 0.08, 0.01), offWhiteMat)
  workLight.position.set(0.05, 2.15, 0.65)

  // T-slot precision work table
  const workTable = makeMesh(getRoundedBoxGeometry(1.18, 0.15, 0.8, 0.02), steelMat)
  workTable.position.set(0.02, 0.96, 0.02)

  // Precision vise & gearbox workpiece casting on table
  const vise = makeMesh(getRoundedBoxGeometry(0.52, 0.1, 0.42, 0.02), graphiteMat)
  vise.position.set(0.02, 1.08, 0.02)

  const workpiece = makeMesh(getRoundedBoxGeometry(0.38, 0.24, 0.34, 0.04), getStandardMaterial(THEME.castIron, 0.52, 0.48))
  workpiece.position.set(0.02, 1.24, 0.02)

  // Animated Spindle Head Assembly
  const spindleAssembly = new THREE.Group()
  spindleAssembly.position.set(0.02, 1.86, -0.04)

  const spindleBox = makeMesh(getRoundedBoxGeometry(0.48, 0.52, 0.48, 0.04), lightGreyMat)
  const spindleBand = makeMesh(getBoxGeometry(0.5, 0.095, 0.5), tealMat)
  spindleBand.position.set(0, -0.18, 0)

  const spindleNose = makeMesh(getCylinderGeometry(0.115, 0.075, 0.26, 14), steelMat)
  spindleNose.position.set(0, -0.36, 0.05)

  const toolBit = makeMesh(getCylinderGeometry(0.028, 0.022, 0.14, 10), graphiteMat)
  toolBit.position.set(0, -0.52, 0.05)

  spindleAssembly.add(spindleBox, spindleBand, spindleNose, toolBit)
  cnc.add(chamberFloor, workLight, workTable, vise, workpiece, spindleAssembly)

  // 4. Sliding Front Doors with Teal-Grey Frames, Vertical Handles & Windows
  // Left sliding door leaf
  const doorLeft = new THREE.Group()
  doorLeft.position.set(-0.22 - doorOpenOffset * 0.45, 1.5, 1.05)

  const doorFrameL = makeMesh(getRoundedBoxGeometry(0.82, 1.38, 0.07, 0.03), doorFrameMat)
  const doorGlassL = makeMesh(getBoxGeometry(0.62, 1.1, 0.03), glassMat, false, false)
  doorGlassL.userData.noShadow = true

  const handleL = makeMesh(getRoundedBoxGeometry(0.042, 0.44, 0.08, 0.015), graphiteMat)
  handleL.position.set(0.32, -0.04, 0.05)
  doorLeft.add(doorFrameL, doorGlassL, handleL)

  // Right door frame leaf
  const doorRight = new THREE.Group()
  doorRight.position.set(0.58, 1.5, 1.05)
  const doorFrameR = makeMesh(getRoundedBoxGeometry(0.32, 1.38, 0.07, 0.03), doorFrameMat)
  const handleR = makeMesh(getRoundedBoxGeometry(0.042, 0.44, 0.08, 0.015), graphiteMat)
  handleR.position.set(-0.08, -0.04, 0.05)
  doorRight.add(doorFrameR, handleR)

  cnc.add(doorLeft, doorRight)

  // 5. Swing-Arm CNC Control Pendant on the Right Side
  const armGroup = new THREE.Group()
  armGroup.position.set(1.42, 0.66, 1.05)

  const armMount = makeMesh(getBoxGeometry(0.16, 0.18, 0.12), lightGreyMat)
  armMount.position.set(0, 0, 0.04)
  const armHorizontal = makeMesh(getBoxGeometry(0.38, 0.095, 0.095), lightGreyMat)
  armHorizontal.position.set(0.18, 0, 0.14)
  const armVertical = makeMesh(getBoxGeometry(0.095, 0.6, 0.095), lightGreyMat)
  armVertical.position.set(0.34, 0.28, 0.14)

  const panelUpper = makeMesh(getRoundedBoxGeometry(0.54, 0.44, 0.22, 0.035), offWhiteMat)
  panelUpper.position.set(0.34, 0.82, 0.14)
  panelUpper.rotation.y = -0.28

  const panelLower = makeMesh(getRoundedBoxGeometry(0.54, 0.24, 0.3, 0.035), lightGreyMat)
  panelLower.position.set(0.34, 0.54, 0.19)
  panelLower.rotation.y = -0.28
  panelLower.rotation.x = 0.32

  const screen = makeMesh(getBoxGeometry(0.4, 0.3, 0.02), getStandardMaterial('#1E262E', 0.4, 0.2))
  screen.position.set(0.32, 0.83, 0.25)
  screen.rotation.y = -0.28

  // Red E-stop button on control console
  const eStop = makeMesh(getCylinderGeometry(0.025, 0.025, 0.03, 10), getStandardMaterial('#C0432D', 0.5, 0.1))
  eStop.rotation.x = Math.PI / 2 + 0.32
  eStop.position.set(0.18, 0.59, 0.31)

  armGroup.add(armMount, armHorizontal, armVertical, panelUpper, panelLower, screen, eStop)
  cnc.add(armGroup)

  // 6. Left/Rear Chip Conveyor Chute & Wheeled Chip Bin
  const chipLeg = makeMesh(getRoundedBoxGeometry(0.32, 0.98, 0.46, 0.03), graphiteMat)
  chipLeg.position.set(-1.62, 0.58, -0.52)
  chipLeg.rotation.z = 0.52

  const chipHead = makeMesh(getRoundedBoxGeometry(0.54, 0.32, 0.5, 0.04), lightGreyMat)
  chipHead.position.set(-1.95, 1.0, -0.52)

  const chipBin = makeMesh(getRoundedBoxGeometry(0.62, 0.58, 0.62, 0.04), graphiteMat)
  chipBin.position.set(-2.0, 0.3, -0.52)

  cnc.add(chipLeg, chipHead, chipBin)

  // 7. 3-Segment Signal Light Tower on Top
  const signalTower = buildSignalTower(status, 0.42)
  signalTower.position.set(1.12, 2.44, 0.78)
  cnc.add(signalTower)

  return { group: cnc, spindleAssembly }
}

export interface MachiningProps {
  cncCount: number
}

export const Machining: FC<MachiningProps> = ({ cncCount }) => {
  const { scene, quality, statuses, registerTick } = useFactoryScene()
  const zone = ZONES[2]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    // 8 CNC Machine Slots:
    // Row 1 at z = -7, Row 2 at z = 0.2; x = -6.2, -2.1, 2.0, 6.1 in each row.
    const rowZ = [-7.0, 0.2]
    const colX = [-6.2, -2.1, 2.0, 6.1]
    const slots: Array<[number, number]> = []
    rowZ.forEach((z) => {
      colX.forEach((x) => {
        slots.push([x, z])
      })
    })

    const clampedCount = Math.max(0, Math.min(8, cncCount))
    const spindles: THREE.Group[] = []

    slots.forEach(([sx, sz], index) => {
      if (index < clampedCount) {
        const { group: machine, spindleAssembly } = buildCNCMachine(status, index % 2 === 0 ? 0.35 : 0.08)
        machine.position.set(sx, 0, sz)
        group.add(machine)
        spindleAssembly.userData.dynamic = true
        spindles.push(spindleAssembly)
      } else {
        // Architectural floor expansion footprint for unoccupied CNC slot
        const padMat = getBasicMaterial('#9CA6B2', 0.24, true, true)
        const slotOutline = makeMesh(getRoundedRectPlaneGeometry(3.0, 2.2, 0.15), padMat, false, false, zone.id)
        slotOutline.position.set(sx, 0.01, sz)
        slotOutline.userData.noShadow = true
        group.add(slotOutline)
      }
    })

    // Rolling BT40 Tool Carts & WIP Part Stands between the two CNC rows (z = -3.3)
    const cartX = [-4.15, 0.0, 4.05]
    const graphiteMat = getStandardMaterial(THEME.graphite, 0.78, 0.22)
    const tealMat = getStandardMaterial(THEME.teal, 0.74, 0.15)
    const steelMat = getStandardMaterial(THEME.steelLight, 0.5, 0.45)

    cartX.forEach((cx) => {
      const cartGroup = new THREE.Group()
      cartGroup.position.set(cx, 0, -3.3)
      cartGroup.add(makeContactShadow(1.15, 0.78, 0.11))

      const body = makeMesh(getRoundedBoxGeometry(0.98, 0.82, 0.64, 0.04), tealMat)
      body.position.y = 0.45
      const topTray = makeMesh(getBoxGeometry(1.02, 0.06, 0.68), graphiteMat)
      topTray.position.y = 0.88

      // BT40 tool holders on cart top
      for (let t = -1; t <= 1; t++) {
        const holder = makeMesh(getCylinderGeometry(0.035, 0.055, 0.16, 10), steelMat)
        holder.position.set(t * 0.26, 0.98, 0)
        cartGroup.add(holder)
      }

      cartGroup.add(body, topTray)
      group.add(cartGroup)
    })

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))

    // Subtle vertical Z-axis machining oscillation for active CNC spindles
    const unregister = registerTick((_, elapsed) => {
      if (status === 'idle') return
      const speed = status === 'bottleneck' ? 3.2 : status === 'high' ? 2.4 : 1.6
      spindles.forEach((sp, idx) => {
        sp.position.y = 1.84 + Math.sin(elapsed * speed + idx * 1.3) * 0.085
      })
    })

    return () => {
      unregister()
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, cncCount, zone, registerTick])

  return (
    <>
      <Worker position={[-4.15, 0, -4.4]} rotationY={0} stageId="machining" hasTablet={true} />
      <Worker position={[2.0, 0, 2.35]} rotationY={Math.PI} stageId="machining" />
      <Worker position={[-2.1, 0, 2.35]} rotationY={Math.PI} stageId="machining" hasTablet={true} />
    </>
  )
}

// ============================================================================
// ZONE 4: INSPECTION (14.5, -1) 9 x 26 m — Glass Quality Lab & Animated CMM
// ============================================================================

export const Inspection: FC = () => {
  const { scene, quality, statuses, registerTick } = useFactoryScene()
  const zone = ZONES[3]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    const graphiteMat = getStandardMaterial(THEME.graphite, 0.76, 0.24)
    const graniteMat = getStandardMaterial(THEME.granite, 0.42, 0.22)
    const wallMat = getStandardMaterial(THEME.wall, 0.76, 0.08)
    const wainscotMat = getStandardMaterial(THEME.panelMid, 0.8, 0.08)
    const tealMat = getStandardMaterial(THEME.teal, 0.74, 0.15)
    const glassMat = getStandardMaterial('#B4CBD9', 0.25, 0.1, 0.28, true)

    // 1. Cutaway Climate-Controlled Quality Metrology Lab (x = 14.5, z = -3.8, 6.8 x 11.6 m)
    const lab = new THREE.Group()
    lab.position.set(14.5, 0, -3.8)
    const labW = 6.8
    const labD = 11.6
    const labH = 3.4
    const kneeH = 0.92

    const labFloor = makeMesh(getRoundedBoxGeometry(labW, 0.055, labD, 0.02), getStandardMaterial('#F3F5F8', 0.72, 0.05), false, shadows)
    labFloor.position.y = 0.028
    lab.add(labFloor)

    // Thin graphite frame posts & top/mid perimeter rails
    const postPositions: Array<[number, number]> = [
      [-labW / 2, -labD / 2],
      [0, -labD / 2],
      [labW / 2, -labD / 2],
      [-labW / 2, 0],
      [labW / 2, 0],
      [-labW / 2, labD / 2],
      [-1.1, labD / 2],
      [1.1, labD / 2],
      [labW / 2, labD / 2],
    ]
    postPositions.forEach(([px, pz]) => {
      const post = makeMesh(getBoxGeometry(0.095, labH, 0.095), graphiteMat)
      post.position.set(px, labH / 2, pz)
      lab.add(post)
    })

    // Top & mid horizontal frame rails
    ;[kneeH, labH].forEach((ry) => {
      const railN = makeMesh(getBoxGeometry(labW + 0.09, 0.08, 0.09), graphiteMat)
      railN.position.set(0, ry, -labD / 2)
      const railW = makeMesh(getBoxGeometry(0.09, 0.08, labD), graphiteMat)
      railW.position.set(-labW / 2, ry, 0)
      const railE = makeMesh(getBoxGeometry(0.09, 0.08, labD), graphiteMat)
      railE.position.set(labW / 2, ry, 0)
      lab.add(railN, railW, railE)
    })
    const topS = makeMesh(getBoxGeometry(labW + 0.09, 0.09, 0.09), graphiteMat)
    topS.position.set(0, labH, labD / 2)
    lab.add(topS)

    // Lower solid knee partition walls (0..0.92m)
    const kneeBack = makeMesh(getBoxGeometry(labW - 0.1, kneeH, 0.06), wainscotMat)
    kneeBack.position.set(0, kneeH / 2, -labD / 2)
    const kneeLeft = makeMesh(getBoxGeometry(0.06, kneeH, labD - 0.1), wainscotMat)
    kneeLeft.position.set(-labW / 2, kneeH / 2, 0)
    const kneeRight = makeMesh(getBoxGeometry(0.06, kneeH, labD - 0.1), wainscotMat)
    kneeRight.position.set(labW / 2, kneeH / 2, 0)
    const kneeFrontL = makeMesh(getBoxGeometry(2.15, kneeH, 0.06), wainscotMat)
    kneeFrontL.position.set(-2.25, kneeH / 2, labD / 2)
    const kneeFrontR = makeMesh(getBoxGeometry(2.15, kneeH, 0.06), wainscotMat)
    kneeFrontR.position.set(2.25, kneeH / 2, labD / 2)
    lab.add(kneeBack, kneeLeft, kneeRight, kneeFrontL, kneeFrontR)

    // Upper clear safety glass panels (0.92..3.4m)
    const glassH = labH - kneeH - 0.08
    const glassY = kneeH + glassH / 2 + 0.02

    const glassBack = makeMesh(getBoxGeometry(labW - 0.12, glassH, 0.03), glassMat, false, false)
    glassBack.position.set(0, glassY, -labD / 2)
    glassBack.userData.noShadow = true

    const glassLeft = makeMesh(getBoxGeometry(0.03, glassH, labD - 0.12), glassMat, false, false)
    glassLeft.position.set(-labW / 2, glassY, 0)
    glassLeft.userData.noShadow = true

    const glassRight = makeMesh(getBoxGeometry(0.03, glassH, labD - 0.12), glassMat, false, false)
    glassRight.position.set(labW / 2, glassY, 0)
    glassRight.userData.noShadow = true

    const glassFrontL = makeMesh(getBoxGeometry(2.15, glassH, 0.03), glassMat, false, false)
    glassFrontL.position.set(-2.25, glassY, labD / 2)
    glassFrontL.userData.noShadow = true

    const glassFrontR = makeMesh(getBoxGeometry(2.15, glassH, 0.03), glassMat, false, false)
    glassFrontR.position.set(2.25, glassY, labD / 2)
    glassFrontR.userData.noShadow = true

    lab.add(glassBack, glassLeft, glassRight, glassFrontL, glassFrontR)

    // 2. Coordinate Measuring Machine (CMM: Dark Granite Surface Plate + Animated Bridge Gantry)
    const cmm = new THREE.Group()
    cmm.position.set(-0.45, 0.05, -1.85)
    cmm.add(makeContactShadow(2.85, 3.45, 0.15))

    ;[-0.96, 0.96].forEach((lx) => {
      ;[-1.22, 1.22].forEach((lz) => {
        const leg = makeMesh(getRoundedBoxGeometry(0.34, 0.78, 0.34, 0.03), graphiteMat)
        leg.position.set(lx, 0.39, lz)
        cmm.add(leg)
      })
    })

    const graniteTable = makeMesh(getRoundedBoxGeometry(2.35, 0.38, 3.05, 0.03), graniteMat)
    graniteTable.position.set(0, 0.96, 0)
    cmm.add(graniteTable)

    // Machined gearbox housing being inspected on the granite table
    const partUnderTest = makeMesh(getRoundedBoxGeometry(0.46, 0.38, 0.46, 0.05), getStandardMaterial(THEME.steelLight, 0.35, 0.58))
    partUnderTest.position.set(0.08, 1.34, 0.02)
    cmm.add(partUnderTest)

    // Animated Bridge Gantry Assembly
    const gantry = new THREE.Group()
    gantry.userData.dynamic = true

    const pillarL = makeMesh(getRoundedBoxGeometry(0.22, 1.46, 0.38, 0.03), wallMat)
    pillarL.position.set(-1.1, 1.85, 0)
    const pillarR = makeMesh(getRoundedBoxGeometry(0.22, 1.46, 0.38, 0.03), wallMat)
    pillarR.position.set(1.1, 1.85, 0)

    const crossBeam = makeMesh(getRoundedBoxGeometry(2.5, 0.28, 0.38, 0.04), wallMat)
    crossBeam.position.set(0, 2.58, 0)

    const beamAccent = makeMesh(getBoxGeometry(2.52, 0.065, 0.4), tealMat)
    beamAccent.position.set(0, 2.48, 0)

    const zCarriage = makeMesh(getRoundedBoxGeometry(0.35, 0.44, 0.44, 0.03), graphiteMat)
    zCarriage.position.set(0.08, 2.58, 0.02)

    const zRam = makeMesh(getBoxGeometry(0.11, 1.18, 0.11), getStandardMaterial(THEME.steelLight, 0.42, 0.52))
    zRam.position.set(0.08, 2.22, 0.12)

    // Ruby probe tip
    const rubyTip = makeMesh(getCylinderGeometry(0.025, 0.025, 0.05, 10), getStandardMaterial('#C0432D', 0.3, 0.1))
    rubyTip.position.set(0.08, 1.6, 0.12)

    gantry.add(pillarL, pillarR, crossBeam, beamAccent, zCarriage, zRam, rubyTip)
    cmm.add(gantry)
    lab.add(cmm)

    // 3. Metrology Desk with Dual CAD Monitors & Calibration Shelf (at z = +2.8 inside lab)
    const desk = new THREE.Group()
    desk.position.set(0.6, 0.05, 2.8)
    desk.add(makeContactShadow(2.35, 1.15, 0.11))

    const deskTop = makeMesh(getRoundedBoxGeometry(2.25, 0.07, 1.02, 0.02), wallMat)
    deskTop.position.y = 0.78
    const deskLegL = makeMesh(getBoxGeometry(0.08, 0.76, 0.92), graphiteMat)
    deskLegL.position.set(-1.0, 0.38, 0)
    const deskLegR = makeMesh(getBoxGeometry(0.08, 0.76, 0.92), graphiteMat)
    deskLegR.position.set(1.0, 0.38, 0)

    ;[-0.38, 0.38].forEach((mx) => {
      const monitor = makeMesh(getRoundedBoxGeometry(0.58, 0.36, 0.04, 0.01), graphiteMat)
      monitor.position.set(mx, 1.08, -0.22)
      const stand = makeMesh(getBoxGeometry(0.08, 0.16, 0.08), graphiteMat)
      stand.position.set(mx, 0.88, -0.22)
      desk.add(monitor, stand)
    })

    desk.add(deskTop, deskLegL, deskLegR)
    lab.add(desk)

    group.add(lab)

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))

    // Smooth CMM Bridge Gantry scanning motion when inspection zone is active
    const unregister = registerTick((_, elapsed) => {
      if (status === 'idle') return
      gantry.position.z = Math.sin(elapsed * 0.95) * 0.52
    })

    return () => {
      unregister()
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, zone, registerTick])

  return <Worker position={[15.1, 0.05, -0.1]} rotationY={Math.PI} stageId="inspection" hasTablet={true} />
}

// ============================================================================
// ZONE 5: PACKAGING (23.5, -1) 9 x 26 m — Roller Conveyor, Packing Station & Turntable
// ============================================================================

export const Packaging: FC = () => {
  const { scene, quality, statuses, registerTick } = useFactoryScene()
  const zone = ZONES[4]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    const graphiteMat = getStandardMaterial(THEME.graphite, 0.78, 0.22)
    const steelMat = getStandardMaterial(THEME.steelLight, 0.5, 0.45)
    const tealMat = getStandardMaterial(THEME.teal, 0.74, 0.15)
    const boxMat = getStandardMaterial(THEME.cardboard, 0.84, 0.03)
    const boxDarkMat = getStandardMaterial(THEME.cardboardDark, 0.85, 0.03)
    const woodMat = getStandardMaterial(THEME.wood, 0.85, 0.03)
    const wrapMat = getStandardMaterial('#DCE8F2', 0.38, 0.05, 0.52, true)

    // 1. Powered Roller Conveyor Spur with Automated Strapping Arch (x = 23.0, z = -5.5)
    const conv = new THREE.Group()
    conv.position.set(23.0, 0, -5.5)
    conv.add(makeContactShadow(5.9, 1.25, 0.12))

    const cLen = 5.6
    const cH = 0.78
    const railF = makeMesh(getBoxGeometry(cLen, 0.12, 0.075), graphiteMat)
    railF.position.set(0, cH, 0.42)
    const railB = makeMesh(getBoxGeometry(cLen, 0.12, 0.075), graphiteMat)
    railB.position.set(0, cH, -0.42)
    conv.add(railF, railB)

    ;[-2.5, -0.85, 0.85, 2.5].forEach((lx) => {
      const leg = makeMesh(getBoxGeometry(0.08, cH, 0.82), graphiteMat)
      leg.position.set(lx, cH / 2, 0)
      conv.add(leg)
    })

    const rGeo = getCylinderGeometry(0.038, 0.038, 0.76, 10)
    rGeo.rotateX(Math.PI / 2)
    for (let i = 0; i < 18; i++) {
      const roller = makeMesh(rGeo, steelMat)
      roller.position.set(-2.55 + i * 0.3, cH + 0.015, 0)
      conv.add(roller)
    }

    // Over-belt automated strapping arch (#17708A & #F7F8F9)
    const strapArch = makeMesh(getRoundedBoxGeometry(0.48, 0.88, 1.12, 0.04), tealMat)
    strapArch.position.set(0.3, cH + 0.42, 0)

    ;[-1.85, -0.75, 0.3, 1.55].forEach((bx, idx) => {
      const cBox = makeMesh(getRoundedBoxGeometry(0.62, 0.44, 0.52, 0.03), idx % 2 === 0 ? boxMat : boxDarkMat)
      cBox.position.set(bx, cH + 0.25, (idx % 2) * 0.03)
      conv.add(cBox)
    })

    conv.add(strapArch)
    group.add(conv)

    // 2. Ergonomic Packing Table with Overhead Carton Rack & Boxes (x = 22.8, z = -1.2)
    const packTable = new THREE.Group()
    packTable.position.set(22.8, 0, -1.2)
    packTable.add(makeContactShadow(3.65, 1.5, 0.12))

    const top = makeMesh(getRoundedBoxGeometry(3.45, 0.08, 1.26, 0.02), getStandardMaterial(THEME.panelLight, 0.78, 0.05))
    top.position.y = 0.86
    packTable.add(top)

    ;[-1.58, 0, 1.58].forEach((lx) => {
      ;[-0.52, 0.52].forEach((lz) => {
        const leg = makeMesh(getBoxGeometry(0.075, 0.84, 0.075), graphiteMat)
        leg.position.set(lx, 0.42, lz)
        packTable.add(leg)
      })
    })

    // Overhead carton rack posts & shelf
    ;[-1.52, 1.52].forEach((px) => {
      const post = makeMesh(getBoxGeometry(0.06, 0.7, 0.06), graphiteMat)
      post.position.set(px, 1.22, -0.38)
      packTable.add(post)
    })
    const upperShelf = makeMesh(getBoxGeometry(3.25, 0.05, 0.48), graphiteMat)
    upperShelf.position.set(0, 1.55, -0.38)
    packTable.add(upperShelf)

    ;[-1.05, -0.2, 0.7].forEach((bx, i) => {
      const b = makeMesh(getRoundedBoxGeometry(0.56, 0.38 + (i % 2) * 0.1, 0.48, 0.03), i % 2 === 0 ? boxMat : boxDarkMat)
      b.position.set(bx, 1.09, 0.1)
      packTable.add(b)
    })

    group.add(packTable)

    // 3. Automated Rotary Stretch-Wrap Turntable Machine (x = 24.4, z = 3.2)
    const wrapper = new THREE.Group()
    wrapper.position.set(24.4, 0, 3.2)
    wrapper.add(makeContactShadow(2.9, 2.45, 0.13))

    const baseBridge = makeMesh(getBoxGeometry(1.8, 0.08, 0.56), graphiteMat)
    baseBridge.position.set(0.86, 0.04, 0)

    const mast = makeMesh(getRoundedBoxGeometry(0.28, 2.58, 0.34, 0.03), graphiteMat)
    mast.position.set(1.56, 1.29, 0)

    // Animated Film Roll Carriage riding up and down the mast
    const carriageGroup = new THREE.Group()
    carriageGroup.userData.dynamic = true
    carriageGroup.position.set(1.34, 1.25, 0)

    const carriageBody = makeMesh(getRoundedBoxGeometry(0.38, 0.52, 0.52, 0.03), tealMat)
    const filmRoll = makeMesh(getCylinderGeometry(0.115, 0.115, 0.46, 14), getStandardMaterial(THEME.wall, 0.5, 0.05))
    filmRoll.position.set(-0.06, 0, 0.28)
    carriageGroup.add(carriageBody, filmRoll)

    // Animated Rotating Turntable Disk & Wrapped Pallet Load
    const rotatingLoad = new THREE.Group()
    rotatingLoad.userData.dynamic = true
    const turntable = makeMesh(getCylinderGeometry(0.98, 1.0, 0.09, 28), graphiteMat)
    turntable.position.set(0, 0.045, 0)

    const pallet = makeMesh(getRoundedBoxGeometry(1.15, 0.14, 1.15, 0.02), woodMat)
    pallet.position.set(0, 0.16, 0)

    const boxCluster = makeMesh(getRoundedBoxGeometry(1.02, 1.06, 1.02, 0.04), boxMat)
    boxCluster.position.set(0, 0.76, 0)

    const stretchFilm = makeMesh(getRoundedBoxGeometry(1.06, 1.09, 1.06, 0.05), wrapMat, false, false)
    stretchFilm.position.set(0, 0.76, 0)
    stretchFilm.userData.noShadow = true

    rotatingLoad.add(turntable, pallet, boxCluster, stretchFilm)

    wrapper.add(baseBridge, mast, carriageGroup, rotatingLoad)
    group.add(wrapper)

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))

    // Smooth turntable rotation & vertical film carriage motion
    const unregister = registerTick((dt, elapsed) => {
      if (status === 'idle') return
      rotatingLoad.rotation.y += dt * 0.85
      carriageGroup.position.y = 0.85 + Math.sin(elapsed * 1.4) * 0.48
    })

    return () => {
      unregister()
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, zone, registerTick])

  return <Worker position={[22.8, 0, 0.15]} rotationY={Math.PI} stageId="packaging" />
}

// ============================================================================
// ZONE 6: SHIPPING (31, -1) 6 x 26 m — Staging Lanes, Wrapped Pallets, Dock & Truck
// ============================================================================

export const Shipping: FC = () => {
  const { scene, quality, statuses } = useFactoryScene()
  const zone = ZONES[5]
  const status = statuses[zone.id]

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    const woodMat = getStandardMaterial(THEME.wood, 0.85, 0.03)
    const boxMat = getStandardMaterial(THEME.cardboard, 0.84, 0.03)
    const wrapMat = getStandardMaterial('#DCE8F2', 0.36, 0.05, 0.48, true)
    const graphiteMat = getStandardMaterial(THEME.graphite, 0.78, 0.24)
    const laneMat = getBasicMaterial(THEME.yellow, 0.75, true, true)

    // Staged Pallets of Stretch-Wrapped Boxes in Painted Outbound Staging Lanes
    const palletCoords: Array<[number, number, number]> = [
      [29.6, -10.5, 1.12],
      [31.4, -10.5, 0.92],
      [29.6, -8.55, 1.12],
      [31.4, -8.55, 1.12],
      [29.6, 2.2, 0.96],
      [31.4, 2.2, 1.16],
      [29.6, 4.15, 0.88],
    ]

    palletCoords.forEach(([px, pz, h]) => {
      const sh = makeContactShadow(1.32, 1.32, 0.12)
      sh.position.set(px, 0, pz)
      group.add(sh)

      // Painted yellow staging bay outline
      const bayLine = makeMesh(getBoxGeometry(1.3, 0.006, 0.05), laneMat, false, false)
      bayLine.position.set(px, 0.008, pz + 0.66)
      bayLine.userData.noShadow = true
      group.add(bayLine)

      const pallet = makeMesh(getRoundedBoxGeometry(1.15, 0.14, 1.15, 0.02), woodMat)
      pallet.position.set(px, 0.07, pz)

      const cartons = makeMesh(getRoundedBoxGeometry(1.04, h, 1.04, 0.04), boxMat)
      cartons.position.set(px, 0.14 + h / 2, pz)

      const film = makeMesh(getRoundedBoxGeometry(1.08, h + 0.02, 1.08, 0.05), wrapMat, false, false)
      film.position.set(px, 0.14 + h / 2, pz)
      film.userData.noShadow = true

      group.add(pallet, cartons, film)
    })

    // Hydraulic Dock Leveler Plate at the right roll-up gate (x = 33.1, z = -4.5)
    const dockPlate = makeMesh(getRoundedBoxGeometry(1.65, 0.045, 3.65, 0.01), graphiteMat, false, shadows)
    dockPlate.position.set(33.1, 0.022, -4.5)
    group.add(dockPlate)

    tagGroupStage(group, zone.id, shadows)
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, status, zone])

  return (
    <>
      <Forklift position={[30.45, 0, -4.5]} rotationY={0} stageId="shipping" hasPallet={true} boxLoad={true} />
      <Truck side="right" stageId="shipping" />
      <Worker position={[31.8, 0, -1.05]} rotationY={-Math.PI / 2} stageId="shipping" hasTablet={true} />
    </>
  )
}
