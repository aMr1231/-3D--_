import { useState, type KeyboardEvent } from 'react'
import { STAGES } from '@/data/demo/enterprise'
import { formatPercent } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import type { SimulationResult } from '@/domain/types'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { STATUS_HEX } from './ui/Status'

/* Геометрия (единицы viewBox). */
const NODE_W = 95
const NODE_H = 68
const GAP = 14
const TOP = 8
const MID = TOP + NODE_H / 2
const VIEW_W = STAGES.length * NODE_W + (STAGES.length - 1) * GAP
const VIEW_H = TOP + NODE_H + 8
const x0 = (i: number) => i * (NODE_W + GAP)

const THEMES = {
  dark: {
    node: '#20252a',
    nodeCrit: '#2a1f1d',
    stroke: '#353b42',
    name: '#eef0f2',
    pct: '#c5cad1',
    track: '#353b42',
    link: '#3a4148',
    arrow: '#5a636c',
    particle: '#5fb3c7',
    focus: '#5fb3c7',
  },
  light: {
    node: '#ffffff',
    nodeCrit: '#fdf1ee',
    stroke: '#e2e2e7',
    name: '#111113',
    pct: '#3a3a40',
    track: '#ececf0',
    link: '#d9d9de',
    arrow: '#b4b4bc',
    particle: '#17708a',
    focus: '#17708a',
  },
} as const

interface LineDiagramProps {
  result: SimulationResult
  theme: 'dark' | 'light'
  /** Клик по участку (делает узлы кнопками). */
  onSelect?: (stageId: string) => void
  className?: string
}

/**
 * Живая мнемосхема линии: участки со статусом и загрузкой, движение изделий по связям,
 * пульсация перегруженного участка и выноска с очередью. Все значения — из расчёта модели.
 */
export function LineDiagram({ result: r, theme, onSelect, className }: LineDiagramProps) {
  const reduced = usePrefersReducedMotion()
  const [focused, setFocused] = useState<number | null>(null)
  const c = THEMES[theme]
  // Скорость точек потока пропорциональна выпуску (ограничена разумными пределами).
  const dur = Math.max(1.1, Math.min(2.4, 1.6 * (22.3 / Math.max(r.outputPerHour, 1))))

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(id)
    }
  }

  return (
    <svg
      viewBox={`-6 0 ${VIEW_W + 12} ${VIEW_H}`}
      className={className}
      role={onSelect ? 'group' : 'img'}
      aria-label={`Мнемосхема линии: ${STAGES.map((s, i) => `${s.code} ${s.name} ${formatPercent(r.stages[i].utilization)}, ${STATUS_META[r.stages[i].status].label}`).join('; ')}`}
    >
      {STAGES.slice(0, -1).map((s, i) => {
        const x1 = x0(i) + NODE_W
        const x2 = x0(i + 1)
        return (
          <g key={`link-${s.id}`}>
            <line x1={x1} y1={MID} x2={x2 - 1} y2={MID} stroke={c.link} strokeWidth={1.5} />
            <path d={`M${x2 - 6},${MID - 4} L${x2 - 1},${MID} L${x2 - 6},${MID + 4}`} fill="none" stroke={c.arrow} strokeWidth={1.5} />
            {!reduced &&
              [0, dur / 2].map((delay) => (
                <circle key={delay} r={1.8} fill={c.particle} opacity={0}>
                  <animateMotion dur={`${dur}s`} begin={`${delay + i * 0.27}s`} repeatCount="indefinite" path={`M${x1},${MID} L${x2 - 7},${MID}`} />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur={`${dur}s`} begin={`${delay + i * 0.27}s`} repeatCount="indefinite" />
                </circle>
              ))}
          </g>
        )
      })}

      {STAGES.map((s, i) => {
        const st = r.stages[i]
        const color = STATUS_HEX[st.status]
        const flagged = st.status === 'bottleneck' || st.status === 'high'
        const x = x0(i)
        const interactive = !!onSelect
        return (
          <g
            key={s.id}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${s.code} ${s.name}: ${STATUS_META[st.status].label}, загрузка ${formatPercent(st.utilization)}. Открыть на схеме` : undefined}
            onClick={interactive ? () => onSelect(s.id) : undefined}
            onKeyDown={interactive ? (e) => onKey(e, s.id) : undefined}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            style={{ cursor: interactive ? 'pointer' : undefined, outline: 'none' }}
            className={interactive ? 'line-node' : undefined}
          >
            {st.status === 'bottleneck' && !reduced && (
              <rect x={x} y={TOP} width={NODE_W} height={NODE_H} rx={8} fill="none" stroke={color} strokeWidth={1.5}>
                <animate attributeName="stroke-width" values="1.5;7;1.5" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
              </rect>
            )}
            <rect
              x={x}
              y={TOP}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              fill={st.status === 'bottleneck' ? c.nodeCrit : c.node}
              stroke={focused === i ? c.focus : flagged ? color : c.stroke}
              strokeWidth={focused === i ? 2.2 : flagged ? 1.4 : 1}
              className="line-node-box"
            />
            <text x={x + 11} y={TOP + 25} fill={c.name} fontSize={11.5} fontWeight={500} letterSpacing={-0.1} fontFamily="Inter Variable, sans-serif">
              {s.shortName}
            </text>
            <rect x={x + 11} y={TOP + 47} width={40} height={3} rx={1.5} fill={c.track} />
            <rect x={x + 11} y={TOP + 47} width={40 * Math.min(st.utilization, 1)} height={3} rx={1.5} fill={color} />
            <text
              x={x + NODE_W - 11}
              y={TOP + 52}
              textAnchor="end"
              fill={c.pct}
              fontSize={12}
              fontFamily="Inter Variable, sans-serif"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatPercent(st.utilization)}
            </text>
          </g>
        )
      })}

    </svg>
  )
}
