import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/Feedback'

/** Граница ошибок раздела: сбой одного экрана не ломает всё приложение. */
export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const chunkFailed = error instanceof Error && /dynamically imported module|Failed to fetch|Importing a module script/i.test(error.message)
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Неизвестная ошибка'

  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <ErrorState
        title={chunkFailed ? 'Не удалось загрузить раздел' : 'В разделе произошла ошибка'}
        description={
          <>
            <p>
              {chunkFailed
                ? 'Проверьте соединение с сервером разработки и обновите страницу.'
                : 'Остальные разделы продолжают работать. Попробуйте открыть раздел заново.'}
            </p>
            <p className="mt-2 font-mono text-xs break-all text-faint">{message}</p>
          </>
        }
        actions={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
            <Button onClick={() => navigate('/')}>На главную</Button>
          </>
        }
      />
    </div>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <ErrorState
        title="Страница не найдена"
        description="Адрес устарел или введён с ошибкой."
        actions={
          <Button variant="primary" onClick={() => navigate('/')}>
            К обзору производства
          </Button>
        }
      />
    </div>
  )
}
