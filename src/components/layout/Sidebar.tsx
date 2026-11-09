import clsx from 'clsx'
import { NavLink } from 'react-router'
import { APP } from '@/config/app'
import { ENTERPRISE } from '@/data/demo/enterprise'
import { useAuthStore } from '@/store/auth'
import { BrandMark, BrandName } from './Brand'
import { NAV_ITEMS } from './nav'

const GROUP_LABEL = { production: 'Производство', presentation: 'Презентация', admin: 'Администрирование' } as const

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role ?? 'guest')
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role))
  const groups = (['production', 'presentation', 'admin'] as const).filter((g) => items.some((i) => i.group === g))

  return (
    <nav
      aria-label="Основная навигация"
      className="hidden shrink-0 flex-col border-r border-black/40 bg-graphite text-graphite-ink md:flex md:w-[60px] xl:w-[248px]"
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-white/[0.06] px-[14px] xl:px-4">
        <BrandMark className="size-8" />
        <div className="hidden min-w-0 xl:block">
          <BrandName className="block leading-tight text-white" />
          <span className="block text-2xs whitespace-nowrap text-graphite-muted">{APP.tagline}</span>
        </div>
      </div>

      <div className="hidden border-b border-white/[0.06] px-4 py-3 xl:block">
        <p className="text-2xs tracking-[0.06em] text-graphite-muted uppercase">Предприятие</p>
        <p className="mt-0.5 text-13 leading-snug font-medium text-white">
          {ENTERPRISE.name}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-graphite-muted">{ENTERPRISE.site}</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-1 hidden px-2 text-2xs tracking-[0.06em] text-graphite-muted uppercase xl:block">{GROUP_LABEL[g]}</p>
            <ul className="space-y-0.5">
              {items
                .filter((i) => i.group === g)
                .map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      title={item.label}
                      data-tour={item.to === '/tour' ? 'tour-nav' : undefined}
                      className={({ isActive }) =>
                        clsx(
                          'group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-13 font-medium transition-colors',
                          'justify-center xl:justify-start',
                          isActive ? 'bg-white/[0.08] text-white' : 'text-graphite-ink hover:bg-white/[0.04] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent-bright" aria-hidden />}
                          <item.icon className={clsx('size-[18px] shrink-0', isActive ? 'text-accent-bright' : 'text-graphite-muted group-hover:text-graphite-ink')} />
                          <span className="hidden xl:inline">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
