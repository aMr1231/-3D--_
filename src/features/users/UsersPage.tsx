import { RefreshCw, Trash, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Controls'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { PageHeader, Panel } from '@/components/ui/Panel'
import { formatDateTime } from '@/domain/format'
import { ROLE_ACCESS, ROLE_LABEL, type Role } from '@/domain/types'
import { ApiError, api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/store/toast'

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
    <div className="mx-auto max-w-[1080px] space-y-4 p-4 md:p-6">
      <PageHeader
        title="Пользователи"
        description="Новые пользователи регистрируются сами и получают роль «Гость экскурсии». Здесь руководитель выдаёт полный доступ или удаляет учётные записи."
        actions={
          <Button variant="secondary" icon={<RefreshCw />} onClick={() => void load()}>
            Обновить
          </Button>
        }
      />

      <Panel
        title="Учётные записи"
        subtitle={users ? `${users.length} всего · руководителей: ${managers}` : undefined}
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
          <div className="space-y-2 p-4" role="status" aria-label="Загрузка пользователей">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users />} title="Пользователей нет" />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[560px] text-13">
              <caption className="sr-only">Пользователи системы</caption>
              <thead>
                <tr className="border-b border-line bg-subtle/70 text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-2 font-medium">Логин</th>
                  <th scope="col" className="px-3 py-2 font-medium">Роль</th>
                  <th scope="col" className="px-3 py-2 font-medium">Доступ</th>
                  <th scope="col" className="px-3 py-2 font-medium">Зарегистрирован</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">Действия</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.id === me?.id
                  return (
                    <tr key={u.id} className="border-b border-line last:border-0">
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">
                        <span className="font-mono text-13">{u.login}</span>
                        {self && <span className="ml-2 rounded-[3px] bg-accent-soft px-1.5 py-px text-2xs font-normal text-accent">вы</span>}
                      </th>
                      <td className="px-3 py-2">
                        <Select
                          size="sm"
                          aria-label={`Роль пользователя ${u.login}`}
                          value={u.role}
                          disabled={self || busyId === u.id}
                          title={self ? 'Собственную роль изменить нельзя' : undefined}
                          onChange={(e) => void changeRole(u, e.target.value as Role)}
                          className="w-[180px]"
                        >
                          <option value="manager">{ROLE_LABEL.manager}</option>
                          <option value="guest">{ROLE_LABEL.guest}</option>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted">{ROLE_ACCESS[u.role]}</td>
                      <td className="tnum px-3 py-2.5 text-xs text-muted">{formatDateTime(u.createdAt)}</td>
                      <td className="px-3 py-2 text-right">
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

      <p className="text-xs text-muted">
        Хранятся только логин, хеш пароля, роль и дата регистрации. Смена роли и удаление действуют сразу — без повторного входа.
      </p>

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить пользователя?"
        description={<>Учётная запись «{toDelete?.login}» будет удалена, все её сессии завершены. Отменить нельзя.</>}
        confirmLabel="Удалить"
        tone="danger"
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && void remove(toDelete)}
      />
    </div>
  )
}
