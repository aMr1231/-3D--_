/**
 * Объединение статичной геометрии: сотни мелких деталей одного материала превращаются в одну сетку.
 * Число вызовов отрисовки падает в десятки раз — это главное условие плавной сцены на телефоне.
 * Не трогаются: InstancedMesh (уже объединены) и узлы с userData.dynamic (их двигает анимация).
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const ATTRIBUTES = ['position', 'normal', 'uv'] as const

function isDynamic(obj: THREE.Object3D, root: THREE.Object3D): boolean {
  for (let o: THREE.Object3D | null = obj; o && o !== root; o = o.parent) {
    if (o.userData.dynamic) return true
  }
  return false
}

/** Геометрия детали в системе координат корня: неиндексированная, только position/normal/uv. */
function prepare(mesh: THREE.Mesh, toRoot: THREE.Matrix4): THREE.BufferGeometry {
  const src = mesh.geometry
  const g = src.index ? src.toNonIndexed() : src.clone()
  for (const name of Object.keys(g.attributes)) {
    if (!(ATTRIBUTES as readonly string[]).includes(name)) g.deleteAttribute(name)
  }
  if (!g.attributes.normal) g.computeVertexNormals()
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  g.clearGroups()
  g.applyMatrix4(toRoot)
  // Зеркальное преобразование выворачивает треугольники — возвращаем порядок обхода.
  if (toRoot.determinant() < 0) {
    for (const name of ATTRIBUTES) {
      const attr = g.attributes[name] as THREE.BufferAttribute
      const size = attr.itemSize
      const arr = attr.array as Float32Array
      for (let i = 0; i < attr.count; i += 3) {
        for (let k = 0; k < size; k++) {
          const a = (i + 1) * size + k
          const b = (i + 2) * size + k
          const t = arr[a]
          arr[a] = arr[b]
          arr[b] = t
        }
      }
    }
  }
  return g
}

export function bakeStatic<T extends THREE.Object3D>(root: T): T {
  root.updateMatrixWorld(true)
  const rootInverse = root.matrixWorld.clone().invert()
  const buckets = new Map<string, { material: THREE.Material; cast: boolean; receive: boolean; meshes: THREE.Mesh[] }>()

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || Array.isArray(mesh.material)) return
    if (isDynamic(mesh, root)) return
    const material = mesh.material as THREE.Material
    const key = `${material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { material, cast: mesh.castShadow, receive: mesh.receiveShadow, meshes: [] }
      buckets.set(key, bucket)
    }
    bucket.meshes.push(mesh)
  })

  const toRoot = new THREE.Matrix4()
  for (const { material, cast, receive, meshes } of buckets.values()) {
    if (meshes.length < 2) continue
    const parts = meshes.map((m) => prepare(m, toRoot.multiplyMatrices(rootInverse, m.matrixWorld)))
    const merged = mergeGeometries(parts, false)
    parts.forEach((p) => p.dispose())
    if (!merged) continue
    merged.computeBoundingSphere()
    meshes.forEach((m) => m.removeFromParent())
    const baked = new THREE.Mesh(merged, material)
    baked.castShadow = cast
    baked.receiveShadow = receive
    baked.userData.baked = true
    root.add(baked)
  }
  return root
}

/** Освобождает объединённые геометрии (общие геометрии и материалы из кеша не трогаются). */
export function disposeBaked(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj.userData.baked) (obj as THREE.Mesh).geometry.dispose()
  })
}
