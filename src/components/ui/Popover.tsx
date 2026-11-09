import clsx from 'clsx'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  className?: string
  label: string
}

/** Лёгкий поповер: закрывается по клику снаружи и Esc. */
export function Popover({ trigger, children, align = 'end', className, label }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v), id })}
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={clsx(
            'absolute top-[calc(100%+6px)] z-50 animate-fade-in rounded-lg border border-line bg-surface shadow-[0_12px_32px_rgb(16_24_32/0.14)]',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}
