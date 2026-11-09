import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { PageSkeleton } from '@/components/ui/Feedback'
import type { Role } from '@/domain/types'
import { homePathFor, useAuthStore } from '@/store/auth'

interface RequireAuthProps {
  children: ReactNode
  roles?: Role[]
}

/**
 * Защищённый маршрут: пока сервер проверяет сессию — скелетон;
 * без сессии — на вход; без нужной роли — на домашний раздел роли.
 * Окончательная проверка прав выполняется сервером на каждом запросе к API.
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (status === 'loading') return <PageSkeleton />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <>{children}</>
}
