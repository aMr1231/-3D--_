import clsx from 'clsx'
import { NavLink } from 'react-router'
import { useAuthStore } from '@/store/auth'
import { NAV_ITEMS } from './nav'

export function MobileTabBar() {
  const role = useAuthStore((s) => s.user?.role ?? 'guest')
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role) && !i.desktopOnly)
  if (items.length < 2) return null
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-14" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              data-tour={item.to === '/tour' ? 'tour-nav' : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs font-medium',
                  isActive ? 'text-accent' : 'text-faint',
                )
              }
            >
              <item.icon className="size-5" aria-hidden />
              {item.shortLabel}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
