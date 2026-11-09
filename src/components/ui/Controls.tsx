import clsx from 'clsx'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode, type SelectHTMLAttributes } from 'react'

/* ───────── SegmentedControl ───────── */

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  title?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx('inline-flex items-center rounded-md border border-line bg-subtle p-0.5', className)}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        e.preventDefault()
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-[4px] font-medium transition-colors [&_svg]:size-3.5',
              size === 'sm' ? 'h-6 px-2 text-xs pointer-coarse:h-9 pointer-coarse:px-3' : 'h-7 px-2.5 text-13 pointer-coarse:h-10',
              active ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(16_24_32/0.08),0_0_0_1px_rgb(16_24_32/0.06)]' : 'text-muted hover:text-ink',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ───────── Select ───────── */

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md'
}

export function Select({ className, size = 'md', children, ...rest }: SelectProps) {
  return (
    <div className={clsx('relative inline-flex', className)}>
      <select
        className={clsx(
          'w-full appearance-none rounded-md border border-line-strong bg-surface pr-7 pl-2.5 font-medium text-ink hover:border-[#c4cad1]',
          size === 'sm' ? 'h-7 text-xs pointer-coarse:h-10' : 'h-8 text-13 pointer-coarse:h-11',
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-faint" aria-hidden />
    </div>
  )
}

/* ───────── ParamField: ползунок + числовое поле ───────── */

interface ParamFieldProps {
  label: string
  value: number
  baseValue?: number
  min: number
  max: number
  step: number
  unit?: string
  digits?: number
  onChange: (value: number) => void
  /** Формат значения для подписи «база». */
  format?: (v: number) => string
  hint?: string
  compact?: boolean
  showSlider?: boolean
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

function roundToStep(v: number, step: number) {
  const decimals = (step.toString().split('.')[1] ?? '').length
  return Number((Math.round(v / step) * step).toFixed(decimals))
}

export function ParamField({
  label,
  value,
  baseValue,
  min,
  max,
  step,
  unit,
  digits = 0,
  onChange,
  format,
  hint,
  compact,
  showSlider = true,
}: ParamFieldProps) {
  const id = useId()
  const [text, setText] = useState(value.toFixed(digits).replace('.', ','))
  useEffect(() => setText(value.toFixed(digits).replace('.', ',')), [value, digits])

  const commit = (raw: string) => {
    const parsed = Number(raw.replace(',', '.').replace(/\s/g, ''))
    if (!Number.isFinite(parsed)) {
      setText(value.toFixed(digits).replace('.', ','))
      return
    }
    onChange(clamp(roundToStep(parsed, step), min, max))
  }

  const changed = baseValue !== undefined && Math.abs(value - baseValue) > 1e-9
  const fill = ((value - min) / (max - min)) * 100

  return (
    <div className={clsx('min-w-0', compact ? 'space-y-1' : 'space-y-1.5')}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="truncate text-xs text-muted" title={hint}>
          {label}
        </label>
        {changed && baseValue !== undefined && (
          <span className="tnum shrink-0 text-2xs text-faint">
            база {format ? format(baseValue) : baseValue.toFixed(digits).replace('.', ',')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSlider && (
          <input
            type="range"
            className="range min-w-0 flex-1"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={label}
            style={{ ['--fill' as string]: `${fill}%` }}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )}
        <div
          className={clsx(
            'flex h-7 shrink-0 items-center rounded-[5px] border bg-surface pointer-coarse:h-10',
            changed ? 'border-accent-line bg-accent-soft/50' : 'border-line-strong',
            showSlider ? 'w-[104px] pointer-coarse:w-[132px]' : 'w-full',
          )}
        >
          <button
            type="button"
            className="flex h-full w-6 items-center justify-center text-faint hover:text-ink disabled:opacity-40 pointer-coarse:w-9"
            onClick={() => onChange(clamp(roundToStep(value - step, step), min, max))}
            disabled={value <= min}
            aria-label={`Уменьшить: ${label}`}
            tabIndex={-1}
          >
            <Minus className="size-3" />
          </button>
          <input
            id={id}
            inputMode="decimal"
            className="tnum h-full w-full min-w-0 bg-transparent text-center text-13 font-medium text-ink outline-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                onChange(clamp(roundToStep(value + step, step), min, max))
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                onChange(clamp(roundToStep(value - step, step), min, max))
              }
            }}
            aria-describedby={unit ? `${id}-unit` : undefined}
          />
          {unit && (
            <span id={`${id}-unit`} className="pr-1 text-2xs whitespace-nowrap text-faint">
              {unit}
            </span>
          )}
          <button
            type="button"
            className="flex h-full w-6 items-center justify-center text-faint hover:text-ink disabled:opacity-40 pointer-coarse:w-9"
            onClick={() => onChange(clamp(roundToStep(value + step, step), min, max))}
            disabled={value >= max}
            aria-label={`Увеличить: ${label}`}
            tabIndex={-1}
          >
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
