import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
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
}

/**
 * Немодальная панель деталей: справа поверх холста на планшете/ПК, нижний лист на телефоне.
 * Холст под ней остаётся интерактивным. Esc закрывает панель.
 */
export function SidePanel({ open, onClose, title, eyebrow, headerExtra, children, footer, label, className }: SidePanelProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <aside
      ref={ref}
      aria-label={label}
      className={clsx(
        'z-20 flex flex-col overflow-hidden border border-line bg-surface shadow-[0_12px_32px_rgb(16_24_32/0.14)]',
        'fixed inset-x-0 bottom-[calc(var(--tabbar-h,56px)+env(safe-area-inset-bottom))] max-h-[62dvh] animate-slide-in-up rounded-t-xl',
        'md:absolute md:inset-x-auto md:top-3 md:right-3 md:bottom-3 md:max-h-none md:w-[360px] md:animate-slide-in-right md:rounded-lg',
        className,
      )}
    >
      <div className="mx-auto mt-1.5 h-1 w-9 shrink-0 rounded-full bg-line-strong md:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 pt-3 pb-3">
        <div className="min-w-0 space-y-1">
          {eyebrow && <div className="flex flex-wrap items-center gap-1.5">{eyebrow}</div>}
          <h2 className="text-[15px] leading-snug font-semibold text-ink">{title}</h2>
          {headerExtra}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Закрыть панель" className="-mr-1.5">
          <X />
        </Button>
      </header>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer && <footer className="border-t border-line bg-subtle/60 px-4 py-3">{footer}</footer>}
    </aside>
  )
}
