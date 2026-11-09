import clsx from 'clsx'
import { Ellipsis } from 'lucide-react'
import type { ReactNode } from 'react'
import { Popover } from './Popover'

export interface MenuItem {
  key: string
  label: string
  icon?: ReactNode
  onSelect: () => void
  disabled?: boolean
  /** Почему пункт недоступен — показывается под ним, только когда он выключен. */
  disabledHint?: string
  tone?: 'danger'
}

/** Меню «…» для второстепенных действий: на экране остаются только основные кнопки. */
export function OverflowMenu({ label, items, align = 'end' }: { label: string; items: MenuItem[]; align?: 'start' | 'end' }) {
  return (
    <Popover
      label={label}
      align={align}
      className="w-[256px] p-1.5"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={label}
          title={label}
          className={clsx(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors pointer-coarse:size-10',
            open ? 'bg-sunken text-ink' : 'text-muted hover:bg-subtle hover:text-ink',
          )}
        >
          <Ellipsis className="size-[18px]" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  close()
                  item.onSelect()
                }}
                className={clsx(
                  'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
                  item.tone === 'danger' ? 'text-crit hover:bg-crit-soft' : 'text-ink-2 hover:bg-subtle hover:text-ink',
                  'disabled:hover:bg-transparent',
                )}
              >
                <span className={item.tone === 'danger' ? 'text-crit' : 'text-muted'} aria-hidden>
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block">{item.label}</span>
                  {item.disabled && item.disabledHint && <span className="mt-0.5 block text-13 text-muted">{item.disabledHint}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  )
}
