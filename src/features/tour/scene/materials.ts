import { MeshStandardMaterial } from 'three'

/**
 * Общие материалы сцены (переиспользуются всеми объектами — меньше материалов и шейдеров).
 * Палитра сдержанная: светлое оборудование, графитовые детали, один акцент — цвет продукта.
 * Отражения даёт процедурное окружение (StudioEnvironment), поэтому металл и пол выглядят «живыми».
 */
const std = (color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...extra })

export const MAT = {
  // Пол и корпус цеха
  floor: std('#cdd2d7', { roughness: 0.42, metalness: 0.02 }),
  floorZone: std('#c4cad0', { roughness: 0.45 }),
  ground: std('#b9bfc5', { roughness: 0.95 }),
  wall: std('#dfe3e7', { roughness: 0.6 }),
  wallDark: std('#a9b0b7', { roughness: 0.8 }),
  plinth: std('#7e8790', { roughness: 0.75 }),
  rib: std('#c9ced3', { roughness: 0.55, metalness: 0.2 }),
  windowGlass: std('#cfe6ef', { roughness: 0.1, metalness: 0.1, emissive: '#bfe0ec', emissiveIntensity: 0.55 }),
  steel: std('#7d868f', { roughness: 0.32, metalness: 0.75 }),

  // Оборудование
  machine: std('#f1f3f5', { roughness: 0.32, metalness: 0.05 }),
  machineDark: std('#30363c', { roughness: 0.5, metalness: 0.2 }),
  accent: std('#17708a', { roughness: 0.38, metalness: 0.15 }),
  glassDark: std('#1b2730', { roughness: 0.05, metalness: 0.6 }),
  interior: std('#9fd2e3', { roughness: 0.4, emissive: '#7cc4dc', emissiveIntensity: 0.65 }),
  screen: std('#0f2a33', { roughness: 0.2, emissive: '#2a9bb8', emissiveIntensity: 0.9 }),
  glass: std('#b9d3dc', { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }),
  granite: std('#3f444a', { roughness: 0.22, metalness: 0.1 }),
  monitor: std('#1c2126', { roughness: 0.3 }),

  // Разметка и транспорт
  safety: std('#d6ab38', { roughness: 0.6 }),
  lane: std('#aeb6be', { roughness: 0.5 }),
  laneArrow: std('#eef1f3', { roughness: 0.6 }),
  truck: std('#f4f5f6', { roughness: 0.35 }),
  truckCab: std('#24435e', { roughness: 0.35, metalness: 0.3 }),
  rubber: std('#22262a', { roughness: 0.9 }),

  // Грузы
  pallet: std('#b48a5a', { roughness: 0.85 }),
  cardboard: std('#c9a46c', { roughness: 0.9 }),
  casting: std('#5b6168', { roughness: 0.65, metalness: 0.45 }),
  machined: std('#c3cad1', { roughness: 0.22, metalness: 0.85 }),
  rack: std('#2f5d8a', { roughness: 0.5, metalness: 0.3 }),
  rackBeam: std('#e07b2e', { roughness: 0.5 }),
  wood: std('#9c7a52', { roughness: 0.85 }),

  // Люди (условные фигуры для масштаба)
  hivis: std('#ef7d2c', { roughness: 0.7 }),
  workwear: std('#33414f', { roughness: 0.85 }),
  helmet: std('#f5f6f7', { roughness: 0.35 }),
  skin: std('#d8bfa4', { roughness: 0.8 }),
}
