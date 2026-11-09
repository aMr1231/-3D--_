import { useFrame, useThree } from '@react-three/fiber'
import clsx from 'clsx'
import type { RefObject } from 'react'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import { POINTS_OF_INTEREST, TOUR_ROUTE } from '@/data/demo/tour'
import { STATUS_META } from '@/domain/status'
import { STATUS_HEX } from '@/components/ui/Status'
import { formatPercent } from '@/domain/format'
import type { SimulationResult } from '@/domain/types'

export type HotspotElements = RefObject<Record<string, HTMLElement | null>>

/**
 * Проекция якорей точек интереса в экранные координаты (внутри Canvas).
 * Позиции пишутся напрямую в style.transform DOM-кнопок — без перерисовки React на каждом кадре.
 */
export function AnchorProjector({ elements }: { elements: HotspotElements }) {
  const { camera, size } = useThree()
  const anchors = useMemo(() => POINTS_OF_INTEREST.map((p) => ({ id: p.id, v: new Vector3(...p.anchor) })), [])
  const tmp = useMemo(() => new Vector3(), [])

  useFrame(() => {
    const els = elements.current
    if (!els) return
    for (const a of anchors) {
      const el = els[a.id]
      if (!el) continue
      tmp.copy(a.v).project(camera)
      const visible = tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15
      const x = ((tmp.x + 1) / 2) * size.width
      const y = ((1 - tmp.y) / 2) * size.height
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-12px, -50%)`
      el.style.visibility = visible ? 'visible' : 'hidden'
    }
  })
  return null
}

/** Длина окружности кольца загрузки (r = 12,5). */
const RING_LEN = 2 * Math.PI * 12.5

interface HotspotOverlayProps {
  elements: HotspotElements
  result: SimulationResult
  selectedPoiId: string | null
  onSelect: (poiId: string) => void
  showLabels: boolean
  showStatus: boolean
}

/** Метки точек интереса — обычные кнопки поверх холста (доступны с клавиатуры и для скринридеров). */
export function HotspotOverlay({ elements, result, selectedPoiId, onSelect, showLabels, showStatus }: HotspotOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-label="Точки интереса" role="group">
      {POINTS_OF_INTEREST.map((poi) => {
        const index = TOUR_ROUTE.stops.indexOf(poi.id)
        const stage = poi.stageId ? result.stages.find((s) => s.stageId === poi.stageId) : undefined
        const active = poi.id === selectedPoiId
        const name = poi.stageId ? poi.title : 'Обзор цеха'
        return (
          <button
            key={poi.id}
            ref={(el) => {
              if (elements.current) elements.current[poi.id] = el
            }}
            type="button"
            onClick={() => onSelect(poi.id)}
            aria-label={`Точка интереса ${index + 1}: ${poi.subtitle}${stage && showStatus ? `, ${STATUS_META[stage.status].label}, загрузка ${formatPercent(stage.utilization)}` : ''}`}
            aria-pressed={active}
            style={{ visibility: 'hidden' }}
            className={clsx(
              'group pointer-events-auto absolute top-0 left-0 flex items-center gap-1.5 rounded-full border bg-surface/95 p-0.5 whitespace-nowrap shadow-[0_2px_8px_rgb(16_24_32/0.18)] transition-colors will-change-transform',
              active ? 'z-10 border-accent pr-2.5' : 'border-line-strong hover:border-accent hover:pr-2.5 focus-visible:pr-2.5',
              showLabels && 'pr-2.5',
            )}
          >
            <span className="relative flex size-7 shrink-0 items-center justify-center">
              {stage && showStatus && (
                <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="14" cy="14" r="12.5" fill="none" stroke="#e3e6ea" strokeWidth="2.5" />
                  <circle
                    cx="14"
                    cy="14"
                    r="12.5"
                    fill="none"
                    stroke={STATUS_HEX[stage.status]}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(stage.utilization, 1) * RING_LEN} ${RING_LEN}`}
                  />
                </svg>
              )}
              <span
                className={clsx(
                  'relative flex size-[22px] items-center justify-center rounded-full text-xs font-semibold text-white',
                  active ? 'bg-accent' : 'bg-graphite',
                )}
              >
                {index + 1}
              </span>
            </span>
            <span className={clsx('text-meta font-medium text-ink', active || showLabels ? 'inline' : 'hidden group-hover:inline group-focus-visible:inline')}>
              {name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
