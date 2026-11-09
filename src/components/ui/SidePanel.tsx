import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Button } from './Button'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  headerExtra?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Доступное имя области. */
  label: string
  className?: string
  /** На телефоне — более низкий лист в свёрнутом виде (чтобы была видна сцена). */
  compactMobile?: boolean
  /** Горизонтальное смахивание по содержимому на телефоне (например, следующая остановка маршрута). */
  onSwipe?: (direction: -1 | 1) => void
}

const DRAG_THRESHOLD = 70

/**
 * Немодальная панель деталей: справа поверх холста на планшете/ПК, нижний лист на телефоне.
 * Лист на телефоне можно тянуть: вверх — развернуть, вниз — свернуть или закрыть.
 * Холст под панелью остаётся интерактивным. Esc закрывает панель.
 */
export function SidePanel({ open, onClose, title, eyebrow, headerExtra, children, footer, label, className, compactMobile, onSwipe }: SidePanelProps) {
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const [dragY, setDragY] = useState(0)
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const justDragged = useRef(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const onHandleDown = (e: ReactPointerEvent<HTMLElement>) => {
    drag.current = { y: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onHandleMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return
    const dy = e.clientY - drag.current.y
    if (Math.abs(dy) > 4) drag.current.moved = true
    setDragY(dy)
  }
  const onHandleUp = () => {
    const d = drag.current
    drag.current = null
    const dy = dragY
    setDragY(0)
    if (!d || !d.moved) return
    // После перетаскивания следующий click не должен переключать размер.
    justDragged.current = true
    if (dy < -DRAG_THRESHOLD) setExpanded(true)
    else if (dy > DRAG_THRESHOLD) {
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  const mobileHeight = expanded ? '88dvh' : compactMobile ? '48dvh' : '62dvh'

  return (
    <aside
      aria-label={label}
      className={clsx(
        'z-20 flex flex-col overflow-hidden border border-line bg-surface shadow-[0_12px_32px_rgb(16_24_32/0.14)]',
        'fixed inset-x-0 bottom-[calc(var(--tabbar-h,56px)+env(safe-area-inset-bottom))] animate-slide-in-up rounded-t-xl',
        'md:absolute md:inset-x-auto md:top-3 md:right-3 md:bottom-3 md:w-[360px] md:animate-slide-in-right md:rounded-lg',
        className,
      )}
      style={
        isMobile
          ? {
              maxHeight: mobileHeight,
              height: expanded ? mobileHeight : undefined,
              transform: dragY ? `translateY(${Math.max(dragY, -120)}px)` : undefined,
              transition: drag.current ? 'none' : 'max-height 220ms ease, height 220ms ease, transform 200ms ease',
            }
          : undefined
      }
    >
      {isMobile && (
        <button
          type="button"
          className="flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          aria-label={expanded ? 'Свернуть панель' : 'Развернуть панель'}
          aria-expanded={expanded}
          onClick={() => {
            // Нажатие (палец, мышь, Enter/Пробел) переключает размер листа.
            if (justDragged.current) {
              justDragged.current = false
              return
            }
            setExpanded((v) => !v)
          }}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={() => {
            drag.current = null
            setDragY(0)
          }}
        >
          <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden />
        </button>
      )}
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 pt-1 pb-3 md:pt-3">
        <div className="min-w-0 space-y-1">
          {eyebrow && <div className="flex flex-wrap items-center gap-1.5">{eyebrow}</div>}
          <h2 className="text-[15px] leading-snug font-semibold text-ink">{title}</h2>
          {headerExtra}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Закрыть панель" className="-mr-1.5">
          <X />
        </Button>
      </header>
      <div
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
        style={onSwipe && isMobile ? { touchAction: 'pan-y' } : undefined}
        onPointerDown={
          onSwipe && isMobile
            ? (e) => {
                if (e.pointerType === 'touch') swipe.current = { x: e.clientX, y: e.clientY }
              }
            : undefined
        }
        onPointerUp={
          onSwipe && isMobile
            ? (e) => {
                const s = swipe.current
                swipe.current = null
                if (!s) return
                const dx = e.clientX - s.x
                const dy = e.clientY - s.y
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? 1 : -1)
              }
            : undefined
        }
      >
        {children}
      </div>
      {footer && <footer className="border-t border-line bg-subtle/60 px-4 py-3">{footer}</footer>}
    </aside>
  )
}
