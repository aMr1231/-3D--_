import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/ui/Feedback'
import LoginPage from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import DashboardPage from '@/features/dashboard/DashboardPage'
import { NotFoundPage, RouteError } from '@/features/system/RouteError'

/** Ленивая загрузка тяжёлых разделов (React Flow, Recharts, Three.js) отдельными чанками. */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: (
              <RequireAuth roles={['manager']}>
                <DashboardPage />
              </RequireAuth>
            ),
          },
          {
            path: 'twin',
            lazy: async () => {
              const { default: TwinPage } = await import('@/features/twin/TwinPage')
              return {
                element: (
                  <RequireAuth roles={['manager']}>
                    <TwinPage />
                  </RequireAuth>
                ),
              }
            },
          },
          {
            path: 'scenarios',
            lazy: async () => {
              const { default: ScenariosPage } = await import('@/features/scenarios/ScenariosPage')
              return {
                element: (
                  <RequireAuth roles={['manager']}>
                    <ScenariosPage />
                  </RequireAuth>
                ),
              }
            },
          },
          {
            path: 'analytics',
            lazy: async () => {
              const { default: AnalyticsPage } = await import('@/features/analytics/AnalyticsPage')
              return {
                element: (
                  <RequireAuth roles={['manager']}>
                    <AnalyticsPage />
                  </RequireAuth>
                ),
              }
            },
          },
          {
            path: 'users',
            lazy: async () => {
              const { default: UsersPage } = await import('@/features/users/UsersPage')
              return {
                element: (
                  <RequireAuth roles={['manager']}>
                    <UsersPage />
                  </RequireAuth>
                ),
              }
            },
          },
          {
            path: 'tour',
            lazy: async () => {
              const { default: TourPage } = await import('@/features/tour/TourPage')
              return { element: <TourPage /> }
            },
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
