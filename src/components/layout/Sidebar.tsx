import clsx from 'clsx'
import { NavLink } from 'react-router'
import { useAuthStore } from '@/store/auth'
import { BrandMark, BrandName } from './Brand'
import { NAV_ITEMS } from './nav'

/** Светлое боковое меню: логотип и разделы; группы разделены только отступом. */
export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role ?? 'guest')
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role))
  const groups = (['production', 'presentation', 'admin'] as const).filter((g) => items.some((i) => i.group === g))

  return (
    <nav aria-label="Основная навигация" className="hidden shrink-0 flex-col border-r border-line bg-canvas md:flex md:w-16 xl:w-[232px]">
      <div className="flex h-14 items-center gap-2.5 px-[18px] xl:px-5">
        <BrandMark className="size-7" tone="light" />
        <BrandName className="hidden text-ink xl:inline" />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <ul key={g} className="space-y-0.5">
            {items
              .filter((i) => i.group === g)
              .map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    title={item.label}
                    aria-label={item.label}
                    data-tour={item.to === '/tour' ? 'tour-nav' : undefined}
                    className={({ isActive }) =>
                      clsx(
                        'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
                        'justify-center xl:justify-start',
                        isActive ? 'bg-sunken text-ink' : 'text-muted hover:bg-subtle hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={clsx('size-[18px] shrink-0', isActive ? 'text-accent' : 'text-faint group-hover:text-ink-2')} aria-hidden />
                        <span className="hidden xl:inline">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
          </ul>
        ))}
      </div>
    </nav>
  )
}
