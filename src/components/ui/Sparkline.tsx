import { useId } from 'react'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  /** Подсветить последнюю точку. */
  highlightLast?: boolean
  label: string
}

/** Компактный тренд без осей (de-emphasis-цвет, текущее значение — акцентом). */
export function Sparkline({ values, width = 96, height = 28, highlightLast = true, label }: SparklineProps) {
  const id = useId()
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 3
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1b7fa6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1b7fa6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke="#9aa3ad" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {highlightLast && <circle cx={lx} cy={ly} r={3} fill="#1b7fa6" stroke="#fff" strokeWidth={1.5} />}
    </svg>
  )
}
