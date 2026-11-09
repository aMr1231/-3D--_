import { History, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { formatDateTime } from '@/domain/format'
import { ApiError, api } from '@/lib/api'

interface Entry {
  id: number
  login: string | null
  action: string
  subject: string | null
  ip: string | null
  at: string
}

const ACTIONS: Record<string, { label: string; tone?: 'warn' | 'crit' }> = {
  login: { label: 'Вход' },
  logout: { label: 'Выход' },
  login_failed: { label: 'Неудачный вход', tone: 'warn' },
  register: { label: 'Регистрация' },
  password_changed: { label: 'Смена пароля' },
  role_changed: { label: 'Смена роли', tone: 'warn' },
  user_deleted: { label: 'Удаление пользователя', tone: 'crit' },
  scenario_created: { label: 'Создан сценарий' },
  scenario_deleted: { label: 'Удалён сценарий' },
  scenarios_reset: { label: 'Сброс демо-сценариев', tone: 'warn' },
  runs_cleared: { label: 'Очищен журнал прогонов' },
}

/** Журнал действий, важных для безопасности (последние 100 записей, хранится на сервере). */
export function AuditLog() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setEntries((await api<{ entries: Entry[] }>('GET', '/api/audit-log')).entries)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить журнал.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Panel
      title="Журнал действий"
      subtitle="Входы, регистрации, смена ролей и паролей, удаления — последние 100 записей"
      flush
      actions={
        <Button size="xs" variant="ghost" icon={<RefreshCw />} onClick={() => void load()}>
          Обновить
        </Button>
      }
    >
      {error ? (
        <ErrorState title="Журнал недоступен" description={error} />
      ) : !entries ? (
        <div className="space-y-2 p-4" role="status" aria-label="Загрузка журнала">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<History />} title="Записей пока нет" />
      ) : (
        <div className="scrollbar-thin max-h-[420px] overflow-auto">
          <table className="w-full min-w-[560px] text-13">
            <caption className="sr-only">Журнал действий</caption>
            <thead className="sticky top-0 bg-subtle">
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-2 font-medium">Время</th>
                <th scope="col" className="px-3 py-2 font-medium">Пользователь</th>
                <th scope="col" className="px-3 py-2 font-medium">Действие</th>
                <th scope="col" className="px-3 py-2 font-medium">Объект</th>
                <th scope="col" className="px-3 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const meta = ACTIONS[e.action] ?? { label: e.action }
                return (
                  <tr key={e.id} className="border-b border-line last:border-0">
                    <td className="tnum px-4 py-2 text-xs whitespace-nowrap text-muted">{formatDateTime(e.at)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-2">{e.login ?? '—'}</td>
                    <td
                      className={
                        meta.tone === 'crit' ? 'px-3 py-2 text-xs font-medium text-crit' : meta.tone === 'warn' ? 'px-3 py-2 text-xs font-medium text-warn' : 'px-3 py-2 text-xs text-ink'
                      }
                    >
                      {meta.label}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-xs text-muted" title={e.subject ?? undefined}>
                      {e.subject ?? '—'}
                    </td>
                    <td className="tnum px-3 py-2 font-mono text-2xs text-faint">{e.ip ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
