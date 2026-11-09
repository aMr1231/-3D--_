import clsx from 'clsx'
import { ArrowRight, ChevronDown, Cuboid, LayoutDashboard, Lock, UserPlus } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { BrandMark, BrandName } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { APP } from '@/config/app'
import { ENTERPRISE } from '@/data/demo/enterprise'
import { DEMO_ACCOUNTS } from '@/data/demo/users'
import { ROLE_LABEL } from '@/domain/types'
import { homePathFor, useAuthStore, type AuthResult } from '@/store/auth'
import { LoginShowcase } from './LoginShowcase'

type Mode = 'login' | 'register'

const inputClass = (invalid: boolean) =>
  clsx(
    'h-10 w-full rounded-lg border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-line',
    invalid ? 'border-crit' : 'border-line-strong',
  )

export default function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const connectionError = useAuthStore((s) => s.connectionError)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [mode, setMode] = useState<Mode>('login')
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<{ text: string; field?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const loginId = useId()
  const passwordId = useId()
  const password2Id = useId()
  const errorId = useId()
  const loginHintId = useId()
  const passwordHintId = useId()

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  const run = async (action: () => Promise<AuthResult>) => {
    setBusy(true)
    setError(null)
    try {
      const result = await action()
      if (!result.ok) {
        setError({ text: result.error, field: result.field })
        return
      }
      const target = from && (result.user.role === 'manager' || from.startsWith('/tour')) ? from : homePathFor(result.user.role)
      navigate(target, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'register') {
      if (password !== password2) {
        setError({ text: 'Пароли не совпадают.', field: 'password2' })
        return
      }
      void run(() => register(loginValue, password))
    } else {
      void run(() => login(loginValue, password))
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setPassword('')
    setPassword2('')
  }

  const invalid = (field: string) => !!error && (!error.field || error.field === field)

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(440px,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8" tone="light" />
          <BrandName className="text-ink" />
        </div>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <h1 className="text-title font-semibold text-ink">{mode === 'login' ? 'Вход в систему' : 'Регистрация'}</h1>
          <p className="mt-1.5 text-sm text-muted">{ENTERPRISE.name}</p>

          <SegmentedControl
            className="mt-6 flex w-full [&>button]:flex-1 [&>button]:justify-center"
            size="md"
            label="Вход или регистрация"
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'login', label: 'Вход' },
              { value: 'register', label: 'Регистрация' },
            ]}
          />

          {connectionError && (
            <p role="alert" className="mt-4 rounded-lg bg-warn-soft px-4 py-3 text-13 text-warn">
              {connectionError}
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor={loginId} className="text-13 font-medium text-ink-2">
                Логин
              </label>
              <input
                id={loginId}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={loginValue}
                onChange={(e) => {
                  setLoginValue(e.target.value)
                  setError(null)
                }}
                aria-invalid={invalid('login')}
                aria-describedby={[error ? errorId : '', mode === 'register' ? loginHintId : ''].filter(Boolean).join(' ') || undefined}
                className={inputClass(invalid('login'))}
              />
              {mode === 'register' && (
                <p id={loginHintId} className="text-13 text-muted">
                  3–32 латинские буквы или цифры
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={passwordId} className="text-13 font-medium text-ink-2">
                Пароль
              </label>
              <input
                id={passwordId}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                aria-invalid={invalid('password')}
                aria-describedby={[error ? errorId : '', mode === 'register' ? passwordHintId : ''].filter(Boolean).join(' ') || undefined}
                className={inputClass(invalid('password'))}
              />
              {mode === 'register' && (
                <p id={passwordHintId} className="text-13 text-muted">
                  От 8 символов, буквы и цифры
                </p>
              )}
            </div>
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={password2Id} className="text-13 font-medium text-ink-2">
                    Повторите пароль
                  </label>
                  <input
                    id={password2Id}
                    type="password"
                    autoComplete="new-password"
                    value={password2}
                    onChange={(e) => {
                      setPassword2(e.target.value)
                      setError(null)
                    }}
                    aria-invalid={invalid('password2')}
                    aria-describedby={error ? errorId : undefined}
                    className={inputClass(invalid('password2'))}
                  />
                </div>
              </>
            )}
            {error && (
              <p id={errorId} role="alert" className="text-13 text-crit">
                {error.text}
              </p>
            )}
            <Button type="submit" variant="primary" className="h-10 w-full" loading={busy} icon={mode === 'login' ? <Lock /> : <UserPlus />}>
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-10">
              <p className="text-13 font-semibold text-ink-2">Демо-доступ для жюри</p>
              <div className="mt-3 divide-y divide-line rounded-xl border border-line">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.login}
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => login(a.login, a.password))}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-subtle disabled:opacity-60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-muted group-hover:text-accent">
                      {a.role === 'manager' ? <LayoutDashboard className="size-4" /> : <Cuboid className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{a.title}</span>
                      <span className="block font-mono text-13 text-muted">
                        {a.login} / {a.password}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <details className="group mt-8 text-13 text-muted">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
              Подробнее о доступе и данных
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="mt-3 space-y-2 leading-relaxed">
              <li>Пароли проверяются на сервере и хранятся только в виде хеша; сессия — в защищённой cookie на 12 часов.</li>
              <li>Собираются только логин и пароль, без ФИО и контактов (152-ФЗ).</li>
              <li>Новые пользователи получают роль «{ROLE_LABEL.guest}»; полный доступ выдаёт руководитель.</li>
              <li>
                Данные предприятия демонстрационные. {APP.name} {APP.version}.
              </li>
            </ul>
          </details>
        </div>
      </div>

      <LoginShowcase />
    </div>
  )
}
