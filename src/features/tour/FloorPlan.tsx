import clsx from 'clsx'
import { STATUS_HEX } from '@/components/ui/Status'
import { getStage } from '@/data/demo/enterprise'
import { HALL, POINTS_OF_INTEREST, TOUR_ROUTE, ZONES } from '@/data/demo/tour'
import type { SimulationResult } from '@/domain/types'

interface FloorPlanProps {
  result: SimulationResult
  selectedPoiId: string | null
  onSelect: (poiId: string) => void
  showStatus: boolean
  compact?: boolean
  className?: string
}

/**
 * План цеха сверху (карта точек интереса). Используется как мини-карта рядом со сценой
 * и как полноценная замена 3D, если WebGL недоступен.
 */
export function FloorPlan({ result, selectedPoiId, onSelect, showStatus, compact, className }: FloorPlanProps) {
  const pad = 2
  const vbW = HALL.width + pad * 2
  const vbH = HALL.depth + pad * 2
  const tx = (x: number) => x + HALL.width / 2 + pad
  const tz = (z: number) => z + HALL.depth / 2 + pad

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className={clsx('w-full', className)} role="group" aria-label="План цеха с точками интереса">
      <rect x={pad} y={pad} width={HALL.width} height={HALL.depth} rx={0.6} fill="#f4f5f6" stroke="#aeb5bc" strokeWidth={0.25} />
      {ZONES.map((z) => {
        const def = getStage(z.stageId)!
        const st = result.stages.find((s) => s.stageId === z.stageId)!
        const poi = POINTS_OF_INTEREST.find((p) => p.stageId === z.stageId)
        const active = poi?.id === selectedPoiId
        return (
          <g key={z.stageId}>
            <rect
              x={tx(z.center[0] - z.size[0] / 2) + 0.25}
              y={tz(z.center[1] - z.size[1] / 2)}
              width={z.size[0] - 0.5}
              height={z.size[1]}
              rx={0.4}
              fill={active ? '#e8f2f5' : '#ffffff'}
              stroke={active ? '#17708a' : showStatus ? STATUS_HEX[st.status] : '#c5cbd2'}
              strokeWidth={active ? 0.35 : 0.22}
            />
            {!compact && (
              <>
                <text x={tx(z.center[0])} y={tz(z.center[1]) - 1.2} textAnchor="middle" fontSize={1.3} fill="#5f6670" fontFamily="JetBrains Mono Variable, monospace">
                  {def.code}
                </text>
                <text x={tx(z.center[0])} y={tz(z.center[1]) + 0.6} textAnchor="middle" fontSize={1.35} fill="#15181c" fontFamily="Inter Variable, sans-serif">
                  {def.shortName}
                </text>
              </>
            )}
          </g>
        )
      })}
      <line x1={tx(-31)} y1={tz(9)} x2={tx(31.5)} y2={tz(9)} stroke="#9aa3ad" strokeWidth={0.35} strokeDasharray="1 0.8" />
      {POINTS_OF_INTEREST.map((poi) => {
        const idx = TOUR_ROUTE.stops.indexOf(poi.id)
        const active = poi.id === selectedPoiId
        const cx = tx(poi.anchor[0])
        const cy = tz(poi.stageId ? poi.anchor[2] + (compact ? 4 : 5) : -12)
        return (
          <g
            key={poi.id}
            role="button"
            tabIndex={0}
            aria-label={`Точка ${idx + 1}: ${poi.title}`}
            aria-pressed={active}
            onClick={() => onSelect(poi.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(poi.id)
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[#17708a]"
          >
            <circle cx={cx} cy={cy} r={compact ? 1.6 : 1.4} fill={active ? '#17708a' : '#14171a'} stroke="#fff" strokeWidth={0.3} />
            <text x={cx} y={cy + 0.5} textAnchor="middle" fontSize={compact ? 1.6 : 1.3} fontWeight={600} fill="#fff" fontFamily="Inter Variable, sans-serif">
              {idx + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
