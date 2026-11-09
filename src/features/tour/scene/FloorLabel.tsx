import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

interface FloorLabelProps {
  code: string
  name: string
  x: number
  z: number
  width: number
}

const CANVAS_W = 1024
const CANVAS_H = 256

function draw(canvas: HTMLCanvasElement, code: string, name: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.fillStyle = 'rgba(48, 56, 64, 0.62)'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '600 118px "JetBrains Mono Variable", ui-monospace, monospace'
  ctx.fillText(code, 8, 118)
  ctx.font = '650 76px "Inter Variable", system-ui, sans-serif'
  const label = name.toUpperCase()
  // Длинные названия ужимаем по ширине холста, чтобы не обрезались.
  const width = ctx.measureText(label).width
  const scale = Math.min(1, (CANVAS_W - 24) / width)
  ctx.save()
  ctx.scale(scale, 1)
  ctx.fillText(label, 8 / scale, 222)
  ctx.restore()
}

/**
 * Надпись участка, «нанесённая» на пол краской. Текстура рисуется на canvas в браузере —
 * без загрузки шрифтов из сети (в отличие от 3D-текста).
 */
export function FloorLabel({ code, name, x, z, width }: FloorLabelProps) {
  const { texture, canvas } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = CANVAS_W
    c.height = CANVAS_H
    draw(c, code, name)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return { texture: t, canvas: c }
  }, [code, name])

  useEffect(() => {
    let alive = true
    // Перерисовать, когда веб-шрифты будут готовы.
    void document.fonts?.ready.then(() => {
      if (!alive) return
      draw(canvas, code, name)
      texture.needsUpdate = true
    })
    return () => {
      alive = false
      texture.dispose()
    }
  }, [canvas, code, name, texture])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.009, z]}>
      <planeGeometry args={[width, (width * CANVAS_H) / CANVAS_W]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
