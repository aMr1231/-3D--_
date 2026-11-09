import { useEffect, type CSSProperties } from 'react'
import { Outlet, useNavigation } from 'react-router'
import { useAuthStore } from '@/store/auth'
import { useScenarioStore } from '@/store/scenarios'
import { Toaster } from '../ui/Toaster'
import { MobileTabBar } from './MobileTabBar'
import { NAV_ITEMS } from './nav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const navigation = useNavigation()
  const role = useAuthStore((s) => s.user?.role ?? 'guest')
  const userId = useAuthStore((s) => s.user?.id)
  const loadScenarios = useScenarioStore((s) => s.load)
  const clearScenarios = useScenarioStore((s) => s.clear)
  const hasTabBar = NAV_ITEMS.filter((i) => i.roles.includes(role) && !i.desktopOnly).length > 1

  // Сценарии и журнал прогонов хранятся на сервере: загружаем для руководителя, очищаем при смене пользователя.
  useEffect(() => {
    if (userId && role === 'manager') void loadScenarios()
    return () => clearScenarios()
  }, [userId, role, loadScenarios, clearScenarios])

  return (
    <div className="flex h-dvh overflow-hidden" style={{ '--tabbar-h': hasTabBar ? '56px' : '0px' } as CSSProperties}>
      <a
        href="#main"
        className="sr-only z-[70] rounded-md bg-accent px-3 py-2 text-13 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Перейти к содержимому
      </a>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar />
        {navigation.state === 'loading' && (
          <div className="absolute inset-x-0 top-12 z-40 h-0.5 overflow-hidden bg-accent-soft" role="progressbar" aria-label="Загрузка раздела">
            <div className="h-full w-1/3 animate-progress bg-accent" />
          </div>
        )}
        <main
          id="main"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] outline-none md:pb-0"
        >
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <Toaster />
    </div>
  )
}
