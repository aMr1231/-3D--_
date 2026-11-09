/** Люди и транспорт цеха: оператор, погрузчик, грузовик у ворот. */
import { useEffect, type FC } from 'react'
import * as THREE from 'three'
import {
  THEME,
  getBasicMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  getRoundedBoxGeometry,
  getStandardMaterial,
  makeContactShadow,
  makeMesh,
  tagGroupStage,
  useFactoryScene,
  type StageId,
} from './kit'
import { bakeStatic, disposeBaked } from './bake'

// ============================================================================
// COMPONENT: WORKER (Stylized 1.75m Faceless Industrial Worker)
// ============================================================================

export interface WorkerProps {
  position: [number, number, number]
  rotationY?: number
  stageId: StageId
  hasTablet?: boolean
}

export const Worker: FC<WorkerProps> = ({ position, rotationY = 0, stageId, hasTablet = false }) => {
  const { scene, quality } = useFactoryScene()

  useEffect(() => {
    const group = new THREE.Group()
    group.position.set(...position)
    group.rotation.y = rotationY

    const overallsMat = getStandardMaterial('#4A525D', 0.84, 0.05)
    const vestMat = getStandardMaterial(THEME.yellow, 0.78, 0.05)
    const stripeMat = getStandardMaterial('#D9E0E6', 0.55, 0.15)
    const skinMat = getStandardMaterial('#DECBB8', 0.82, 0.02)
    const helmetMat = getStandardMaterial(THEME.wall, 0.52, 0.08)
    const bootMat = getStandardMaterial(THEME.graphite, 0.85, 0.1)

    group.add(makeContactShadow(0.62, 0.62, 0.11, 0.25))

    // Safety Boots (0..0.12m)
    const leftBoot = makeMesh(getRoundedBoxGeometry(0.14, 0.12, 0.25, 0.03), bootMat)
    leftBoot.position.set(-0.11, 0.06, 0.03)
    const rightBoot = makeMesh(getRoundedBoxGeometry(0.14, 0.12, 0.25, 0.03), bootMat)
    rightBoot.position.set(0.11, 0.06, 0.03)
    group.add(leftBoot, rightBoot)

    // Trousers (0.12..0.84m)
    const leftLeg = makeMesh(getRoundedBoxGeometry(0.15, 0.72, 0.16, 0.04), overallsMat)
    leftLeg.position.set(-0.11, 0.48, 0)
    const rightLeg = makeMesh(getRoundedBoxGeometry(0.15, 0.72, 0.16, 0.04), overallsMat)
    rightLeg.position.set(0.11, 0.48, 0)
    group.add(leftLeg, rightLeg)

    // Torso with Hi-Vis Safety Vest (0.84..1.38m)
    const torso = makeMesh(getRoundedBoxGeometry(0.42, 0.55, 0.24, 0.06), vestMat)
    torso.position.set(0, 1.11, 0)
    group.add(torso)

    // Reflective grey safety stripes on vest
    const stripe1 = makeMesh(getBoxGeometry(0.43, 0.04, 0.25), stripeMat)
    stripe1.position.set(0, 0.97, 0)
    const stripe2 = makeMesh(getBoxGeometry(0.43, 0.04, 0.25), stripeMat)
    stripe2.position.set(0, 1.14, 0)
    group.add(stripe1, stripe2)

    // Articulated shoulders & arms
    const leftArm = makeMesh(getRoundedBoxGeometry(0.12, 0.5, 0.12, 0.04), overallsMat)
    leftArm.position.set(-0.28, 1.09, 0.05)
    leftArm.rotation.x = -0.22

    const rightArm = makeMesh(getRoundedBoxGeometry(0.12, 0.5, 0.12, 0.04), overallsMat)
    rightArm.position.set(0.28, 1.09, hasTablet ? 0.13 : 0.05)
    rightArm.rotation.x = hasTablet ? -0.68 : -0.22
    group.add(leftArm, rightArm)

    if (hasTablet) {
      const tablet = makeMesh(getRoundedBoxGeometry(0.24, 0.022, 0.17, 0.006), getStandardMaterial(THEME.graphite, 0.5, 0.2))
      tablet.position.set(0.18, 1.02, 0.28)
      tablet.rotation.x = 0.42
      group.add(tablet)
    }

    // Neck & Faceless Sculpted Head (1.38..1.65m)
    const head = makeMesh(getRoundedBoxGeometry(0.21, 0.25, 0.21, 0.08), skinMat)
    head.position.set(0, 1.52, 0)
    group.add(head)

    // White Hard Hat (reaches 1.75m total height)
    const dome = makeMesh(getRoundedBoxGeometry(0.25, 0.13, 0.27, 0.06), helmetMat)
    dome.position.set(0, 1.68, 0)
    const brim = makeMesh(getRoundedBoxGeometry(0.28, 0.025, 0.33, 0.01), helmetMat)
    brim.position.set(0, 1.62, 0.025)
    group.add(dome, brim)

    tagGroupStage(group, stageId, quality === 'high')
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, position, rotationY, stageId, hasTablet, quality])

  return null
}

// ============================================================================
// COMPONENT: FORKLIFT (Detailed Counterbalance Forklift)
// ============================================================================

export interface ForkliftProps {
  position: [number, number, number]
  rotationY?: number
  stageId: StageId
  hasPallet?: boolean
  boxLoad?: boolean
}

export const Forklift: FC<ForkliftProps> = ({ position, rotationY = 0, stageId, hasPallet = true, boxLoad = false }) => {
  const { scene, quality } = useFactoryScene()

  useEffect(() => {
    const group = new THREE.Group()
    group.position.set(...position)
    group.rotation.y = rotationY

    const yellowMat = getStandardMaterial(THEME.yellow, 0.76, 0.1)
    const graphiteMat = getStandardMaterial(THEME.graphite, 0.8, 0.22)
    const darkMat = getStandardMaterial(THEME.graphiteDark, 0.9, 0.1)
    const tealMat = getStandardMaterial(THEME.teal, 0.76, 0.12)
    const rimMat = getStandardMaterial(THEME.steelLight, 0.6, 0.3)

    group.add(makeContactShadow(2.9, 1.48, 0.13, 0.22))

    // Main body chassis (+X is forward toward forks)
    const chassis = makeMesh(getRoundedBoxGeometry(1.75, 0.68, 1.14, 0.09), yellowMat)
    chassis.position.set(-0.2, 0.52, 0)
    group.add(chassis)

    // Sculpted rear graphite counterweight
    const counterweight = makeMesh(getRoundedBoxGeometry(0.52, 0.78, 1.16, 0.12), graphiteMat)
    counterweight.position.set(-0.92, 0.57, 0)
    group.add(counterweight)

    // Teal side accent stripe
    const stripe = makeMesh(getBoxGeometry(1.12, 0.1, 1.17), tealMat)
    stripe.position.set(-0.14, 0.52, 0)
    group.add(stripe)

    // Operator cab floor, bucket seat, steering column & wheel
    const seat = makeMesh(getRoundedBoxGeometry(0.38, 0.44, 0.44, 0.05), darkMat)
    seat.position.set(-0.32, 1.06, 0)
    const column = makeMesh(getCylinderGeometry(0.045, 0.055, 0.52, 10), graphiteMat)
    column.position.set(0.26, 1.06, 0)
    column.rotation.z = 0.34
    const wheel = makeMesh(getCylinderGeometry(0.14, 0.14, 0.03, 12), darkMat)
    wheel.position.set(0.17, 1.29, 0)
    wheel.rotation.z = 0.34
    group.add(seat, column, wheel)

    // Overhead ROPS safety guard (4 pillars + slatted roof frame + amber beacon)
    const postCoords: Array<[number, number]> = [
      [-0.68, -0.49],
      [-0.68, 0.49],
      [0.42, -0.49],
      [0.42, 0.49],
    ]
    postCoords.forEach(([px, pz]) => {
      const post = makeMesh(getCylinderGeometry(0.032, 0.032, 1.18, 8), graphiteMat)
      post.position.set(px, 1.44, pz)
      group.add(post)
    })
    const cageTop = makeMesh(getRoundedBoxGeometry(1.2, 0.06, 1.06, 0.02), graphiteMat)
    cageTop.position.set(-0.13, 2.02, 0)
    const beacon = makeMesh(getCylinderGeometry(0.05, 0.06, 0.1, 10), yellowMat)
    beacon.position.set(-0.55, 2.09, 0)
    group.add(cageTop, beacon)

    // 4 Tires + Steel Wheel Hubs
    const wheelPositions: Array<[number, number, number]> = [
      [0.42, 0.27, -0.55],
      [0.42, 0.27, 0.55],
      [-0.82, 0.23, -0.53],
      [-0.82, 0.23, 0.53],
    ]
    wheelPositions.forEach(([wx, wy, wz]) => {
      const tire = makeMesh(getCylinderGeometry(wy, wy, 0.2, 16), darkMat)
      tire.rotation.x = Math.PI / 2
      tire.position.set(wx, wy, wz)
      const hub = makeMesh(getCylinderGeometry(wy * 0.52, wy * 0.52, 0.21, 12), rimMat)
      hub.rotation.x = Math.PI / 2
      hub.position.set(wx, wy, wz)
      group.add(tire, hub)
    })

    // Dual-stage Hydraulic Mast, Lift Cylinder & Fork Carriage
    const mastL = makeMesh(getBoxGeometry(0.11, 2.3, 0.09), graphiteMat)
    mastL.position.set(0.74, 1.24, -0.35)
    const mastR = makeMesh(getBoxGeometry(0.11, 2.3, 0.09), graphiteMat)
    mastR.position.set(0.74, 1.24, 0.35)
    const liftCyl = makeMesh(getCylinderGeometry(0.045, 0.045, 1.9, 10), rimMat)
    liftCyl.position.set(0.72, 1.1, 0)
    const carriage = makeMesh(getBoxGeometry(0.08, 0.58, 0.92), graphiteMat)
    carriage.position.set(0.83, 0.52, 0)
    group.add(mastL, mastR, liftCyl, carriage)

    // Two L-shaped steel forks
    const forkL = makeMesh(getBoxGeometry(1.14, 0.05, 0.12), graphiteMat)
    forkL.position.set(1.4, 0.26, -0.27)
    const forkR = makeMesh(getBoxGeometry(1.14, 0.05, 0.12), graphiteMat)
    forkR.position.set(1.4, 0.26, 0.27)
    group.add(forkL, forkR)

    // Optional loaded pallet on the forks
    if (hasPallet) {
      const woodMat = getStandardMaterial(THEME.wood, 0.85, 0.02)
      const pallet = makeMesh(getRoundedBoxGeometry(1.12, 0.14, 1.02, 0.02), woodMat)
      pallet.position.set(1.42, 0.35, 0)
      group.add(pallet)

      if (boxLoad) {
        const boxMat = getStandardMaterial(THEME.cardboard, 0.84, 0.02)
        const wrapMat = getStandardMaterial('#DCE8F2', 0.4, 0.05, 0.5, true)
        const load = makeMesh(getRoundedBoxGeometry(0.98, 0.78, 0.9, 0.04), boxMat)
        load.position.set(1.42, 0.81, 0)
        const film = makeMesh(getRoundedBoxGeometry(1.01, 0.8, 0.93, 0.05), wrapMat, false, false)
        film.position.set(1.42, 0.81, 0)
        film.userData.noShadow = true
        group.add(load, film)
      } else {
        const ironMat = getStandardMaterial(THEME.castIron, 0.72, 0.32)
        for (let ix = -1; ix <= 1; ix += 2) {
          for (let iz = -1; iz <= 1; iz += 2) {
            const casting = makeMesh(getRoundedBoxGeometry(0.38, 0.34, 0.38, 0.05), ironMat)
            casting.position.set(1.42 + ix * 0.23, 0.59, iz * 0.23)
            const boss = makeMesh(getCylinderGeometry(0.12, 0.12, 0.1, 10), ironMat)
            boss.position.set(1.42 + ix * 0.23, 0.79, iz * 0.23)
            group.add(casting, boss)
          }
        }
      }
    }

    tagGroupStage(group, stageId, quality === 'high')
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, position, rotationY, stageId, hasPallet, boxLoad, quality])

  return null
}

// ============================================================================
// COMPONENT: TRUCK (Semi-Trailer Truck on Exterior Concrete Loading Dock Apron)
// ============================================================================

export interface TruckProps {
  side: 'left' | 'right'
  stageId: StageId
}

export const Truck: FC<TruckProps> = ({ side, stageId }) => {
  const { scene, quality } = useFactoryScene()

  useEffect(() => {
    const group = new THREE.Group()
    const dir = side === 'left' ? -1 : 1
    const dockZ = -4.5
    group.position.set(dir * 34.35, 0, dockZ)
    if (side === 'left') {
      group.rotation.y = Math.PI // +X local always points outward from gate
    }

    const trailerMat = getStandardMaterial(THEME.wall, 0.8, 0.06)
    const frameMat = getStandardMaterial(THEME.graphite, 0.8, 0.22)
    const tireMat = getStandardMaterial(THEME.graphiteDark, 0.9, 0.08)
    const rimMat = getStandardMaterial(THEME.steelLight, 0.55, 0.35)
    const tealMat = getStandardMaterial(THEME.teal, 0.76, 0.12)
    const yellowMat = getStandardMaterial(THEME.yellow, 0.76, 0.08)
    const glassMat = getStandardMaterial('#8AA2B4', 0.4, 0.1, 0.68, true)

    // 1. Architectural Exterior Concrete Loading Dock Apron (connects seamlessly to hall plinth)
    const apronBase = makeMesh(
      getRoundedBoxGeometry(16.2, 0.38, 12.0, 0.08),
      getStandardMaterial(THEME.graphite, 0.85, 0.12),
      false,
      quality === 'high',
      stageId,
    )
    apronBase.position.set(7.8, -0.21, 0)

    const apronTop = makeMesh(
      getRoundedBoxGeometry(15.9, 0.08, 11.7, 0.04),
      getStandardMaterial('#DFE3E7', 0.88, 0.03),
      false,
      quality === 'high',
      stageId,
    )
    apronTop.position.set(7.8, -0.02, 0)
    group.add(apronBase, apronTop)

    // Yellow reversing bay guide stripes & safety wheel chocks on the dock apron
    const guideMat = getBasicMaterial(THEME.yellow, 0.9, false)
    ;[-1.72, 1.72].forEach((gz) => {
      const stripe = makeMesh(getBoxGeometry(13.8, 0.012, 0.15), guideMat, false, false, stageId)
      stripe.position.set(7.2, 0.024, gz)
      stripe.userData.noShadow = true
      group.add(stripe)
    })

    // Rubber dock bumpers at gate wall (x = 0)
    ;[-1.4, 1.4].forEach((bz) => {
      const bumper = makeMesh(getBoxGeometry(0.24, 0.55, 0.35), tireMat, true, true, stageId)
      bumper.position.set(0.05, 0.95, bz)
      group.add(bumper)
    })

    // Grounding shadow under trailer & tractor
    const truckShadow = makeContactShadow(14.2, 2.85, 0.15, 0.25)
    truckShadow.position.set(7.2, 0.015, 0)
    group.add(truckShadow)

    // 2. Semi-Trailer Box (9.6m long x 2.55m wide x 2.85m tall)
    const trailer = makeMesh(getRoundedBoxGeometry(9.6, 2.82, 2.55, 0.08), trailerMat)
    trailer.position.set(4.95, 2.56, 0)
    group.add(trailer)

    // Teal horizontal logistics band + subtle side panel ribs
    const stripe = makeMesh(getBoxGeometry(9.0, 0.28, 2.58), tealMat)
    stripe.position.set(4.95, 2.12, 0)
    const lowerSkirt = makeMesh(getRoundedBoxGeometry(4.8, 0.36, 2.48, 0.03), getStandardMaterial(THEME.panelMid, 0.8, 0.1))
    lowerSkirt.position.set(5.6, 0.92, 0)
    group.add(stripe, lowerSkirt)

    // Trailer undercarriage, kingpin plate & landing gear legs
    const underFrame = makeMesh(getBoxGeometry(9.2, 0.32, 1.9), frameMat)
    underFrame.position.set(4.95, 1.02, 0)
    const landingGear = makeMesh(getBoxGeometry(0.18, 0.98, 1.85), frameMat)
    landingGear.position.set(8.15, 0.55, 0)
    group.add(underFrame, landingGear)

    // 3. Modern Aerodynamic European/Industrial Tractor Cab
    const cabChassis = makeMesh(getBoxGeometry(4.1, 0.38, 2.22), frameMat)
    cabChassis.position.set(11.3, 0.72, 0)

    const cabBody = makeMesh(getRoundedBoxGeometry(2.35, 2.52, 2.45, 0.14), trailerMat)
    cabBody.position.set(12.0, 2.12, 0)

    // Roof wind deflector fairing
    const roofFairing = makeMesh(getRoundedBoxGeometry(1.45, 0.55, 2.38, 0.1), trailerMat)
    roofFairing.position.set(11.65, 3.52, 0)
    roofFairing.rotation.z = -0.22

    const cabAccent = makeMesh(getRoundedBoxGeometry(2.39, 0.55, 2.48, 0.06), tealMat)
    cabAccent.position.set(12.0, 1.25, 0)

    // Front windshield & side cab windows
    const windshield = makeMesh(getBoxGeometry(0.08, 0.88, 2.18), glassMat, false, false)
    windshield.position.set(13.15, 2.42, 0)
    windshield.userData.noShadow = true

    const sideWindows = makeMesh(getBoxGeometry(1.15, 0.76, 2.48), glassMat, false, false)
    sideWindows.position.set(12.25, 2.38, 0)
    sideWindows.userData.noShadow = true

    // Front radiator grille, bumper & side mirrors
    const grille = makeMesh(getRoundedBoxGeometry(0.1, 0.95, 1.56, 0.03), frameMat)
    grille.position.set(13.17, 1.38, 0)

    ;[-1.32, 1.32].forEach((mz) => {
      const mirror = makeMesh(getRoundedBoxGeometry(0.12, 0.48, 0.16, 0.02), frameMat)
      mirror.position.set(12.95, 2.35, mz)
      group.add(mirror)
    })

    group.add(cabChassis, cabBody, roofFairing, cabAccent, windshield, sideWindows, grille)

    // 4. Axles, Tires, Steel Rims & Yellow Wheel Chocks
    const axleX = [1.85, 3.05, 4.25, 9.85, 12.25]
    axleX.forEach((ax) => {
      ;[-1.16, 1.16].forEach((wz) => {
        const wheel = makeMesh(getCylinderGeometry(0.52, 0.52, 0.3, 18), tireMat)
        wheel.rotation.x = Math.PI / 2
        wheel.position.set(ax, 0.52, wz)

        const rim = makeMesh(getCylinderGeometry(0.28, 0.28, 0.31, 14), rimMat)
        rim.rotation.x = Math.PI / 2
        rim.position.set(ax, 0.52, wz)
        group.add(wheel, rim)
      })
    })

    // Safety yellow wheel chocks wedged under rear trailer axle
    ;[-1.16, 1.16].forEach((wz) => {
      const chock = makeMesh(getRoundedBoxGeometry(0.28, 0.18, 0.26, 0.02), yellowMat)
      chock.position.set(3.65, 0.11, wz)
      group.add(chock)
    })

    tagGroupStage(group, stageId, quality === 'high')
    scene.add(bakeStatic(group))
    return () => {
      scene.remove(group)
      disposeBaked(group)
    }
  }, [scene, side, stageId, quality])

  return null
}
