import clsx from 'clsx'
import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toast'

const ICONS = { success: CircleCheck, info: Info, error: CircleX }
const ICON_CLASS = { success: 'text-ok', info: 'text-accent', error: 'text-crit' }

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h,56px)+8px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-4 md:bottom-4 md:items-end"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.tone]
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-[380px] animate-slide-in-up items-start gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-overlay"
          >
            <Icon className={clsx('mt-0.5 size-4 shrink-0', ICON_CLASS[t.tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-13 text-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded p-0.5 text-faint hover:bg-subtle hover:text-ink"
              aria-label="Закрыть уведомление"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
