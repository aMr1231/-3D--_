import clsx from 'clsx'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/store/toast'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Dialog'

const field = (invalid: boolean) =>
  clsx(
    'h-9 w-full rounded-lg border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-line',
    invalid ? 'border-crit' : 'border-line-strong',
  )

/** Смена пароля: проверка текущего на сервере, остальные сессии пользователя завершаются. */
export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const changePassword = useAuthStore((s) => s.changePassword)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<{ text: string; field?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const ids = { current: useId(), next: useId(), repeat: useId(), error: useId() }

  useEffect(() => {
    if (open) {
      setCurrent('')
      setNext('')
      setRepeat('')
      setError(null)
    }
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next !== repeat) {
      setError({ text: 'Новые пароли не совпадают.', field: 'repeat' })
      return
    }
    setBusy(true)
    const r = await changePassword(current, next)
    setBusy(false)
    if (!r.ok) {
      setError({ text: r.error, field: r.field })
      return
    }
    toast.success('Пароль изменён', 'Сеансы на других устройствах завершены.')
    onClose()
  }

  const bad = (f: string) => error?.field === f

  return (
    <Modal open={open} onClose={onClose} title="Сменить пароль">
      <form onSubmit={submit} className="space-y-3" noValidate>
        {(
          [
            ['current', 'Текущий пароль', current, setCurrent, 'current-password', 'currentPassword'],
            ['next', 'Новый пароль', next, setNext, 'new-password', 'newPassword'],
            ['repeat', 'Повторите новый пароль', repeat, setRepeat, 'new-password', 'repeat'],
          ] as const
        ).map(([key, label, value, setter, auto, errField]) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={ids[key]} className="text-13 font-medium text-ink-2">
              {label}
            </label>
            <input
              id={ids[key]}
              type="password"
              autoComplete={auto}
              value={value}
              onChange={(e) => {
                setter(e.target.value)
                setError(null)
              }}
              aria-invalid={bad(errField)}
              aria-describedby={error ? ids.error : undefined}
              className={field(bad(errField))}
            />
          </div>
        ))}
        <p className="text-13 text-muted">Не короче 8 символов, буквы и цифры, без логина.</p>
        {error && (
          <p id={ids.error} role="alert" className="text-13 text-crit">
            {error.text}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2 pb-5">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" loading={busy}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  )
}
