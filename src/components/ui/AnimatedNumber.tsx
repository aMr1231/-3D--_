import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

interface AnimatedNumberProps {
  value: number
  format: (v: number) => string
  /** Длительность перехода, мс. */
  duration?: number
  /** Анимировать от нуля при первом показе. */
  countUpOnMount?: boolean
}

const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3)

/**
 * Число, которое плавно «докручивается» к новому значению — видно, что именно изменилось.
 * При prefers-reduced-motion значение меняется мгновенно.
 */
export function AnimatedNumber({ value, format, duration = 650, countUpOnMount = false }: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(countUpOnMount && !reduced ? 0 : value)
  const current = useRef(display)

  useEffect(() => {
    const from = current.current
    if (reduced || !Number.isFinite(from) || Math.abs(from - value) < 1e-9) {
      current.current = value
      setDisplay(value)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min((t - start) / duration, 1)
      const v = from + (value - from) * easeOutCubic(k)
      current.current = v
      setDisplay(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Страховка: если кадры не отрисовываются (вкладка в фоне), всё равно показать итог.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      current.current = value
      setDisplay(value)
    }, duration + 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
    }
  }, [value, duration, reduced])

  return (
    <>
      <span aria-hidden>{format(display)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
