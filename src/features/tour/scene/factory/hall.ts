/** Здание цеха в разрезе и транспортный конвейер вдоль фронта линии. */
import { useEffect, useRef, type FC } from 'react'
import * as THREE from 'three'
import {
  THEME,
  buildSafetyBarrier,
  getBasicMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  getRoundedBoxGeometry,
  getStandardMaterial,
  makeMesh,
  useFactoryScene,
} from './kit'
import { bakeStatic, disposeBaked } from './bake'

// ============================================================================
// COMPONENT: HALL (68 x 32 m Cutaway Shell, Plinth, Ribbon Windows, Trusses)
// ============================================================================

export const Hall: FC = () => {
  const { scene, quality } = useFactoryScene()

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'

    const wallMat = getStandardMaterial(THEME.wall, 0.84, 0.04)
    const wainscotMat = getStandardMaterial(THEME.wainscot, 0.85, 0.05)
    const graphiteMat = getStandardMaterial(THEME.graphite, 0.76, 0.22)
    const tealMat = getStandardMaterial(THEME.teal, 0.76, 0.14)
    const glassMat = getStandardMaterial('#C4D5E2', 0.35, 0.08, 0.42, true)
    const steelMat = getStandardMaterial(THEME.steelMid, 0.68, 0.28)

    // 1. Multi-Layered Architectural Maquette Plinth & Floor Slab (68 x 32 m)
    const outerPlinth = makeMesh(getRoundedBoxGeometry(70.8, 0.42, 34.4, 0.1), getStandardMaterial('#A7B0BA', 0.8, 0.1), false, shadows)
    outerPlinth.position.set(0, -0.24, 0)
    group.add(outerPlinth)

    const concreteLip = makeMesh(getRoundedBoxGeometry(69.2, 0.16, 32.9, 0.05), getStandardMaterial('#D3D9DF', 0.88, 0.04), false, shadows)
    concreteLip.position.set(0, -0.07, 0)
    group.add(concreteLip)

    const floor = makeMesh(getBoxGeometry(68, 0.08, 32), getStandardMaterial(THEME.floor, 0.88, 0.03), false, shadows)
    floor.position.set(0, -0.04, 0)
    group.add(floor)

    // Subtle concrete expansion joint grid lines across the 68 x 32 m floor
    const gridMat = getBasicMaterial(THEME.floorGrid, 0.85, false, true)
    const xJoints = 16 // every 4m
    const zJoints = 7 // every 4m
    const dummy = new THREE.Object3D()

    const xGridGeo = getBoxGeometry(0.035, 0.004, 31.8)
    const xGridInst = new THREE.InstancedMesh(xGridGeo, gridMat, xJoints)
    xGridInst.userData.noShadow = true
    for (let i = 0; i < xJoints; i++) {
      const gx = -30 + i * 4
      dummy.position.set(gx, 0.002, 0)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      xGridInst.setMatrixAt(i, dummy.matrix)
    }
    xGridInst.instanceMatrix.needsUpdate = true

    const zGridGeo = getBoxGeometry(67.8, 0.004, 0.035)
    const zGridInst = new THREE.InstancedMesh(zGridGeo, gridMat, zJoints)
    zGridInst.userData.noShadow = true
    for (let i = 0; i < zJoints; i++) {
      const gz = -12 + i * 4
      dummy.position.set(0, 0.002, gz)
      dummy.updateMatrix()
      zGridInst.setMatrixAt(i, dummy.matrix)
    }
    zGridInst.instanceMatrix.needsUpdate = true
    group.add(xGridInst, zGridInst)

    // 2. Back Wall (z = -16, height 8 m, x from -34 to 34) with Clerestory Ribbon Window
    const backWallLower = makeMesh(getBoxGeometry(68.72, 4.2, 0.38), wallMat, shadows, shadows)
    backWallLower.position.set(0, 2.1, -16.19)

    const backWallUpper = makeMesh(getBoxGeometry(68.72, 1.4, 0.38), wallMat, shadows, shadows)
    backWallUpper.position.set(0, 7.3, -16.19)

    const backCoping = makeMesh(getBoxGeometry(68.8, 0.14, 0.46), graphiteMat, shadows, shadows)
    backCoping.position.set(0, 8.05, -16.19)

    // Interior light-grey wainscoting & compressed-air utility pipe along back wall
    const backWainscot = makeMesh(getBoxGeometry(68.0, 1.35, 0.06), wainscotMat, false, shadows)
    backWainscot.position.set(0, 0.675, -15.98)

    const airPipe = makeMesh(getCylinderGeometry(0.045, 0.045, 67.2, 10), tealMat, false, false)
    airPipe.rotation.z = Math.PI / 2
    airPipe.position.set(0, 3.55, -15.92)

    const elecBus = makeMesh(getBoxGeometry(67.2, 0.12, 0.09), graphiteMat, false, false)
    elecBus.position.set(0, 3.82, -15.92)

    // Continuous Clerestory Ribbon Window (y = 4.2..6.6 m) with graphite sills & mullions
    const ribbonGlass = makeMesh(getBoxGeometry(67.2, 2.4, 0.08), glassMat, false, false)
    ribbonGlass.position.set(0, 5.4, -16.16)
    ribbonGlass.userData.noShadow = true

    const sillBottom = makeMesh(getBoxGeometry(68.4, 0.12, 0.44), graphiteMat, shadows, shadows)
    sillBottom.position.set(0, 4.2, -16.19)
    const sillTop = makeMesh(getBoxGeometry(68.4, 0.12, 0.44), graphiteMat, shadows, shadows)
    sillTop.position.set(0, 6.6, -16.19)

    // Window vertical mullions every 3m via InstancedMesh
    const mullionCount = 21
    const mullionGeo = getBoxGeometry(0.08, 2.4, 0.16)
    const mullionInst = new THREE.InstancedMesh(mullionGeo, graphiteMat, mullionCount)
    for (let i = 0; i < mullionCount; i++) {
      dummy.position.set(-30 + i * 3, 5.4, -16.16)
      dummy.updateMatrix()
      mullionInst.setMatrixAt(i, dummy.matrix)
    }
    mullionInst.instanceMatrix.needsUpdate = true

    group.add(backWallLower, backWallUpper, backCoping, backWainscot, airPipe, elecBus, ribbonGlass, sillBottom, sillTop, mullionInst)

    // 3. End Walls (x = -34 and x = +34) with 4.6 m x 4.8 m Sectional Roll-Up Gates & Canopies
    // Gate centered at z = -4.5 (z from -6.8 to -2.2)
    ;[-34.19, 34.19].forEach((wallX) => {
      const sign = wallX < 0 ? -1 : 1

      // Back wall segment (z from -16.38 to -6.8, length 9.58m)
      const backSec = makeMesh(getBoxGeometry(0.38, 8.0, 9.58), wallMat, shadows, shadows)
      backSec.position.set(wallX, 4.0, -11.59)

      // Front wall segment (z from -2.2 to +16.0, length 18.2m)
      const frontSec = makeMesh(getBoxGeometry(0.38, 8.0, 18.2), wallMat, shadows, shadows)
      frontSec.position.set(wallX, 4.0, 6.9)

      // Header above gate (z from -6.8 to -2.2, y from 4.8 to 8.0m)
      const headerSec = makeMesh(getBoxGeometry(0.38, 3.2, 4.6), wallMat, shadows, shadows)
      headerSec.position.set(wallX, 6.4, -4.5)

      // Top wall coping
      const endCoping = makeMesh(getBoxGeometry(0.46, 0.14, 32.4), graphiteMat, shadows, shadows)
      endCoping.position.set(wallX, 8.05, -0.1)

      // Gate portal frame & dock seal cushions
      const portalTop = makeMesh(getBoxGeometry(0.52, 0.42, 5.1), graphiteMat, shadows, shadows)
      portalTop.position.set(wallX, 4.95, -4.5)

      const portalL = makeMesh(getBoxGeometry(0.5, 4.8, 0.26), graphiteMat, shadows, shadows)
      portalL.position.set(wallX, 2.4, -6.92)

      const portalR = makeMesh(getBoxGeometry(0.5, 4.8, 0.26), graphiteMat, shadows, shadows)
      portalR.position.set(wallX, 2.4, -2.08)

      // Partially raised sectional roll-up door panels (clearance up to 3.85m)
      const doorPanel = makeMesh(getBoxGeometry(0.18, 0.95, 4.56), steelMat, shadows, shadows)
      doorPanel.position.set(wallX, 4.3, -4.5)

      // Exterior Cantilevered Rain Canopy over the Loading Dock Gate
      const canopy = makeMesh(getRoundedBoxGeometry(2.1, 0.22, 6.4, 0.04), graphiteMat, shadows, shadows)
      canopy.position.set(wallX + sign * 1.15, 5.45, -4.5)

      const canopyFascia = makeMesh(getBoxGeometry(2.14, 0.08, 6.44), tealMat, false, false)
      canopyFascia.position.set(wallX + sign * 1.15, 5.45, -4.5)

      // Interior & exterior safety yellow dock bollards
      const bollardMat = getStandardMaterial(THEME.yellow, 0.75, 0.1)
      ;[-7.25, -1.75].forEach((bz) => {
        const innerBollard = makeMesh(getCylinderGeometry(0.095, 0.095, 1.18, 12), bollardMat, shadows, shadows)
        innerBollard.position.set(wallX - sign * 0.58, 0.59, bz)

        const outerBollard = makeMesh(getCylinderGeometry(0.095, 0.095, 1.18, 12), bollardMat, shadows, shadows)
        outerBollard.position.set(wallX + sign * 0.65, 0.59, bz)
        group.add(innerBollard, outerBollard)
      })

      group.add(backSec, frontSec, headerSec, endCoping, portalTop, portalL, portalR, doorPanel, canopy, canopyFascia)
    })

    // 4. Колонны вдоль задней стены. Фермы, связи и передний ряд колонн убраны:
    // в обзоре сверху они перечёркивали участки. Каркас — светлая сталь, а не графит.
    const frameMat = getStandardMaterial('#B9C2CB', 0.7, 0.25)
    const columnX = [-34, -22, -10, 2, 14, 26, 34]
    const colGeo = getBoxGeometry(0.32, 8.0, 0.32)
    const colInst = new THREE.InstancedMesh(colGeo, frameMat, columnX.length)
    colInst.castShadow = shadows
    colInst.receiveShadow = shadows

    const baseGeo = getRoundedBoxGeometry(0.56, 0.18, 0.56, 0.03)
    const baseInst = new THREE.InstancedMesh(baseGeo, getStandardMaterial(THEME.yellow, 0.78, 0.1), columnX.length)

    columnX.forEach((cx, i) => {
      dummy.position.set(cx, 4.0, -15.65)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      colInst.setMatrixAt(i, dummy.matrix)

      dummy.position.set(cx, 0.09, -15.65)
      dummy.updateMatrix()
      baseInst.setMatrixAt(i, dummy.matrix)
    })
    colInst.instanceMatrix.needsUpdate = true
    baseInst.instanceMatrix.needsUpdate = true
    group.add(colInst, baseInst)

    // 6. Yellow Pedestrian Walkway Lines, Safety Handrails & Directional Floor Arrows
    const yellowFloorMat = getBasicMaterial(THEME.yellow, 0.92, true, true)

    // Main front transport & walkway corridor lines (z = 7.45 and z = 10.55)
    ;[7.48, 10.52, 12.2].forEach((lz) => {
      const line = makeMesh(getBoxGeometry(65.0, 0.008, 0.13), yellowFloorMat, false, false)
      line.position.set(0, 0.006, lz)
      line.userData.noShadow = true
      group.add(line)
    })

    // Dashed yellow walkway dividers between the 6 zones
    const dividerX = [-20.75, -9.5, 9.5, 19.0, 28.0]
    const dashGeo = getBoxGeometry(0.11, 0.008, 0.92)
    const dashesPerLine = 14
    const dashInst = new THREE.InstancedMesh(dashGeo, yellowFloorMat, dividerX.length * dashesPerLine)
    dashInst.userData.noShadow = true
    let dIdx = 0
    dividerX.forEach((dx) => {
      for (let i = 0; i < dashesPerLine; i++) {
        dummy.position.set(dx, 0.007, -13.0 + i * 1.9)
        dummy.updateMatrix()
        dashInst.setMatrixAt(dIdx++, dummy.matrix)
      }
    })
    dashInst.instanceMatrix.needsUpdate = true
    group.add(dashInst)

    // Protective yellow safety handrail barriers along the front aisle openings
    const barrierCoords: Array<[number, number]> = [
      [-23.5, 7.25],
      [-11.5, 7.25],
      [-5.5, 7.25],
      [5.5, 7.25],
      [12.5, 7.25],
      [21.5, 7.25],
    ]
    barrierCoords.forEach(([bx, bz]) => {
      const barrier = buildSafetyBarrier(2.2, 1.0)
      barrier.position.set(bx, 0, bz)
      group.add(barrier)
    })

    // Large Flow Arrows on the floor pointing Left -> Right (+X)
    const arrowShape = new THREE.Shape()
    arrowShape.moveTo(-0.88, -0.22)
    arrowShape.lineTo(0.15, -0.22)
    arrowShape.lineTo(0.15, -0.54)
    arrowShape.lineTo(0.98, 0)
    arrowShape.lineTo(0.15, 0.54)
    arrowShape.lineTo(0.15, 0.22)
    arrowShape.lineTo(-0.88, 0.22)
    arrowShape.closePath()

    const arrowGeo = new THREE.ShapeGeometry(arrowShape)
    arrowGeo.rotateX(-Math.PI / 2)

    const arrowCoords: Array<[number, number]> = [
      [-27.5, 6.2],
      [-20.75, -1.0],
      [-15.0, 6.2],
      [-9.5, -3.5],
      [0.0, 6.2],
      [9.5, -3.5],
      [14.5, 6.2],
      [19.0, -1.0],
      [23.5, 6.2],
      [28.0, -1.0],
      [-22.0, 11.35],
      [-7.0, 11.35],
      [8.0, 11.35],
      [23.0, 11.35],
    ]
    arrowCoords.forEach(([ax, az]) => {
      const arrowMesh = makeMesh(arrowGeo, yellowFloorMat, false, false)
      arrowMesh.position.set(ax, 0.012, az)
      arrowMesh.userData.noShadow = true
      group.add(arrowMesh)
    })

    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality])

  return null
}

// ============================================================================
// COMPONENT: CONVEYOR (Front Transport Conveyor z = 9, height 0.55m, x = -31..31.5)
// ============================================================================

export interface ConveyorProps {
  flowRate: number
}

export const Conveyor: FC<ConveyorProps> = ({ flowRate }) => {
  const { scene, quality, registerTick } = useFactoryScene()
  const flowRateRef = useRef(flowRate)
  flowRateRef.current = flowRate

  useEffect(() => {
    const group = new THREE.Group()
    const shadows = quality === 'high'
    const startX = -31.0
    const endX = 31.5
    const length = endX - startX // 62.5m
    const centerX = (startX + endX) / 2 // 0.25m
    const zPos = 9.0
    const height = 0.55

    const graphiteMat = getStandardMaterial(THEME.graphite, 0.76, 0.22)
    const tealMat = getStandardMaterial(THEME.teal, 0.75, 0.14)
    const steelMat = getStandardMaterial(THEME.steelLight, 0.52, 0.38)
    const yellowMat = getStandardMaterial(THEME.yellow, 0.76, 0.1)

    // Side C-channel rails along the 62.5m transport conveyor
    const railGeo = getBoxGeometry(length, 0.13, 0.075)
    const frontRail = makeMesh(railGeo, graphiteMat, shadows, shadows)
    frontRail.position.set(centerX, height, zPos + 0.43)
    const backRail = makeMesh(railGeo, graphiteMat, shadows, shadows)
    backRail.position.set(centerX, height, zPos - 0.43)
    group.add(frontRail, backRail)

    // Teal side accent strip along front rail
    const trim = makeMesh(getBoxGeometry(length, 0.048, 0.085), tealMat, false, false)
    trim.position.set(centerX, height, zPos + 0.435)
    group.add(trim)

    // Support H-legs every ~3.1m + optical side sensors via InstancedMesh
    const legCount = 21
    const legGeo = getBoxGeometry(0.085, height - 0.03, 0.86)
    const legInst = new THREE.InstancedMesh(legGeo, graphiteMat, legCount)
    legInst.castShadow = shadows

    const sensorGeo = getBoxGeometry(0.08, 0.16, 0.08)
    const sensorInst = new THREE.InstancedMesh(sensorGeo, yellowMat, 7)

    const dummy = new THREE.Object3D()
    for (let i = 0; i < legCount; i++) {
      const lx = startX + (i / (legCount - 1)) * length
      dummy.position.set(lx, (height - 0.03) / 2, zPos)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      legInst.setMatrixAt(i, dummy.matrix)

      if (i % 3 === 0 && i / 3 < 7) {
        dummy.position.set(lx, height + 0.12, zPos - 0.48)
        dummy.updateMatrix()
        sensorInst.setMatrixAt(Math.floor(i / 3), dummy.matrix)
      }
    }
    legInst.instanceMatrix.needsUpdate = true
    sensorInst.instanceMatrix.needsUpdate = true
    group.add(legInst, sensorInst)

    // Instanced Steel Rollers along the conveyor
    const rollerCount = quality === 'high' ? 148 : 78
    const rollerGeo = getCylinderGeometry(0.034, 0.034, 0.8, 10)
    rollerGeo.rotateX(Math.PI / 2)
    const rollerInst = new THREE.InstancedMesh(rollerGeo, steelMat, rollerCount)
    for (let i = 0; i < rollerCount; i++) {
      const rx = startX + 0.25 + (i / (rollerCount - 1)) * (length - 0.5)
      dummy.position.set(rx, height + 0.012, zPos)
      dummy.updateMatrix()
      rollerInst.setMatrixAt(i, dummy.matrix)
    }
    rollerInst.instanceMatrix.needsUpdate = true
    group.add(rollerInst)

    // Moving small boxes & totes with machined parts along the conveyor
    const maxBoxes = 38
    const boxGeo = getRoundedBoxGeometry(0.58, 0.34, 0.48, 0.035)
    const boxMat = getStandardMaterial(THEME.cardboard, 0.82, 0.04)
    const boxInst = new THREE.InstancedMesh(boxGeo, boxMat, maxBoxes)
    boxInst.castShadow = shadows
    boxInst.receiveShadow = shadows

    const partGeo = getRoundedBoxGeometry(0.3, 0.15, 0.26, 0.025)
    const partMat = getStandardMaterial(THEME.teal, 0.68, 0.18)
    const partInst = new THREE.InstancedMesh(partGeo, partMat, maxBoxes)
    partInst.castShadow = shadows

    group.add(boxInst, partInst)
    scene.add(bakeStatic(group))

    let offset = 0
    const unregister = registerTick((dt) => {
      const rate = Math.max(0, flowRateRef.current)
      const speed = (rate / 60) * 1.45
      offset = (offset + dt * speed) % 1.0

      const activeCount = rate <= 0 ? 0 : Math.min(maxBoxes, Math.max(6, Math.round((rate / 180) * maxBoxes)))

      for (let i = 0; i < maxBoxes; i++) {
        if (i < activeCount) {
          const t = ((i + offset) / activeCount) % 1.0
          const bx = startX + 0.65 + t * (length - 1.3)
          dummy.position.set(bx, height + 0.22, zPos)
          dummy.scale.set(1, 1, 1)
          dummy.updateMatrix()
          boxInst.setMatrixAt(i, dummy.matrix)

          dummy.position.set(bx, height + 0.43, zPos)
          dummy.updateMatrix()
          partInst.setMatrixAt(i, dummy.matrix)
        } else {
          dummy.position.set(0, -25, 0)
          dummy.scale.set(0.001, 0.001, 0.001)
          dummy.updateMatrix()
          boxInst.setMatrixAt(i, dummy.matrix)
          partInst.setMatrixAt(i, dummy.matrix)
        }
      }
      boxInst.instanceMatrix.needsUpdate = true
      partInst.instanceMatrix.needsUpdate = true
    })

    return () => {
      unregister()
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, quality, registerTick])

  return null
}
