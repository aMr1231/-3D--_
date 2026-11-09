import { RefreshCw, Trash, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Controls'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Page, PageHeader, Panel } from '@/components/ui/Panel'
import { formatDateTime } from '@/domain/format'
import { ROLE_LABEL, type Role } from '@/domain/types'
import { ApiError, api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useRealtimeStore } from '@/store/realtime'
import { toast } from '@/store/toast'
import { AuditLog } from './AuditLog'
import { UsersInfo } from './UsersInfo'

interface UserListItem {
  id: number
  login: string
  role: Role
  createdAt: string
}

/** Управление пользователями: роли и удаление. Все проверки прав — на сервере. */
export default function UsersPage() {
  const me = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<UserListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<UserListItem | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const { users } = await api<{ users: UserListItem[] }>('GET', '/api/users')
      setUsers(users)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить пользователей.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Регистрации, смена ролей и удаления другими руководителями — без кнопки «Обновить».
  const usersVersion = useRealtimeStore((s) => s.usersVersion)
  const online = useRealtimeStore((s) => s.members)
  useEffect(() => {
    if (usersVersion > 0) void load()
  }, [usersVersion, load])

  const changeRole = async (u: UserListItem, role: Role) => {
    setBusyId(u.id)
    try {
      await api('PATCH', `/api/users/${u.id}`, { role })
      setUsers((list) => list?.map((x) => (x.id === u.id ? { ...x, role } : x)) ?? null)
      toast.success('Роль изменена', `${u.login}: ${ROLE_LABEL[role]}. Действует сразу.`)
    } catch (e) {
      toast.error('Роль не изменена', e instanceof ApiError ? e.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (u: UserListItem) => {
    setToDelete(null)
    setBusyId(u.id)
    try {
      await api('DELETE', `/api/users/${u.id}`)
      setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null)
      toast.info('Пользователь удалён', `${u.login} — сессии завершены.`)
    } catch (e) {
      toast.error('Не удалось удалить', e instanceof ApiError ? e.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  const managers = users?.filter((u) => u.role === 'manager').length ?? 0

  return (
    <Page width="narrow">
      <PageHeader
        title="Пользователи"
        actions={
          <Button variant="secondary" icon={<RefreshCw />} onClick={() => void load()}>
            Обновить
          </Button>
        }
      />

      <Panel
        title={
          <>
            Учётные записи
            {users && <span className="tnum ml-2 font-normal text-faint">{users.length}</span>}
          </>
        }
        flush
      >
        {error ? (
          <ErrorState
            title="Список недоступен"
            description={error}
            actions={
              <Button variant="primary" onClick={() => void load()}>
                Повторить
              </Button>
            }
          />
        ) : !users ? (
          <div className="space-y-2 px-5 pb-5 md:px-6" role="status" aria-label="Загрузка пользователей">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users />} title="Пользователей нет" />
        ) : (
          <div className="scrollbar-thin overflow-x-auto pb-2">
            <table className="w-full text-sm sm:min-w-[560px]">
              <caption className="sr-only">Пользователи системы</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="py-3 pr-1 pl-4 font-medium sm:px-5 md:px-6">Логин</th>
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">Роль</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Зарегистрирован</th>
                  <th scope="col" className="px-5 py-3 md:px-6"><span className="sr-only">Действия</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.id === me?.id
                  return (
                    <tr key={u.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-3 pr-1 pl-4 text-left font-medium text-ink sm:px-5 md:px-6">
                        <span className="inline-flex items-center gap-2">
                          {online.some((m) => m.id === u.id) ? (
                            <span className="size-2 shrink-0 rounded-full bg-ok" title="В сети">
                              <span className="sr-only">В сети.</span>
                            </span>
                          ) : (
                            <span className="size-2 shrink-0" aria-hidden />
                          )}
                          <span className="font-mono">{u.login}</span>
                          {self && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">вы</span>}
                        </span>
                      </th>
                      <td className="px-2 py-2 sm:px-3">
                        <Select
                          size="sm"
                          aria-label={`Роль пользователя ${u.login}`}
                          value={u.role}
                          disabled={self || busyId === u.id}
                          title={self ? 'Собственную роль изменить нельзя' : undefined}
                          onChange={(e) => void changeRole(u, e.target.value as Role)}
                          className="w-[136px] sm:w-[180px]"
                        >
                          <option value="manager">{ROLE_LABEL.manager}</option>
                          <option value="guest">Гость</option>
                        </Select>
                      </td>
                      <td className="tnum hidden px-3 py-3 text-meta text-muted sm:table-cell">{formatDateTime(u.createdAt)}</td>
                      <td className="py-2 pr-2 pl-0 text-right sm:px-5 md:px-6">
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={<Trash />}
                          disabled={self || busyId === u.id}
                          onClick={() => setToDelete(u)}
                          className="hover:text-crit"
                          aria-label={`Удалить ${u.login}`}
                        >
                          <span className="max-sm:hidden">Удалить</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AuditLog />

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить пользователя?"
        description={<>Учётная запись «{toDelete?.login}» будет удалена, все её сессии завершены. Отменить нельзя.</>}
        confirmLabel="Удалить"
        tone="danger"
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && void remove(toDelete)}
      />
      <UsersInfo total={users?.length ?? null} managers={managers} />
    </Page>
  )
}
