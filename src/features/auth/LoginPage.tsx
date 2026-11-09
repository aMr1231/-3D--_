import clsx from 'clsx'
import { ChevronDown, Cuboid, Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { BrandMark } from '@/components/layout/Brand'
import { Button } from '@/components/ui/Button'
import { APP } from '@/config/app'
import { ENTERPRISE } from '@/data/demo/enterprise'
import { DEMO_ACCOUNTS } from '@/data/demo/users'
import { ROLE_LABEL } from '@/domain/types'
import { homePathFor, useAuthStore, type AuthResult } from '@/store/auth'

type Mode = 'login' | 'register'

const inputClass = (invalid: boolean) =>
  clsx(
    'h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent-line/60',
    invalid ? 'border-crit' : 'border-line-strong',
  )

/** Поле ввода с подписью и необязательной подсказкой под ним. */
function Field({ id, label, hint, hintId, children }: { id: string; label: string; hint?: string; hintId?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-meta font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-meta text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Пароль с кнопкой «показать». */
function PasswordInput({ invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...rest} type={visible ? 'text' : 'password'} className={clsx(inputClass(invalid), 'pr-11')} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint hover:text-ink"
      >
        {visible ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
      </button>
    </div>
  )
}

/** Вход и регистрация: одна спокойная колонка по центру, демо-доступ — двумя крупными кнопками. */
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
  const describedBy = (...ids: (string | false)[]) => ids.filter(Boolean).join(' ') || undefined

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center">
            <BrandMark className="size-12" tone="light" />
            <h1 className="mt-6 text-title font-semibold text-ink">{mode === 'login' ? `Вход в ${APP.name}` : 'Регистрация'}</h1>
            <p className="mt-2 text-sm text-muted">Цифровой двойник производства · {ENTERPRISE.name}</p>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            {connectionError && (
              <p role="alert" className="mb-6 rounded-xl bg-warn-soft px-4 py-3 text-meta text-warn">
                {connectionError}
              </p>
            )}

            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <Field id={loginId} label="Логин" hint={mode === 'register' ? '3–32 латинские буквы или цифры' : undefined} hintId={loginHintId}>
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
                  aria-describedby={describedBy(!!error && errorId, mode === 'register' && loginHintId)}
                  className={inputClass(invalid('login'))}
                />
              </Field>

              <Field id={passwordId} label="Пароль" hint={mode === 'register' ? 'Не короче 8 символов, буквы и цифры' : undefined} hintId={passwordHintId}>
                <PasswordInput
                  id={passwordId}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  invalid={invalid('password')}
                  aria-invalid={invalid('password')}
                  aria-describedby={describedBy(!!error && errorId, mode === 'register' && passwordHintId)}
                />
              </Field>

              {mode === 'register' && (
                <Field id={password2Id} label="Повторите пароль">
                  <PasswordInput
                    id={password2Id}
                    autoComplete="new-password"
                    value={password2}
                    onChange={(e) => {
                      setPassword2(e.target.value)
                      setError(null)
                    }}
                    invalid={invalid('password2')}
                    aria-invalid={invalid('password2')}
                    aria-describedby={error ? errorId : undefined}
                  />
                </Field>
              )}

              {error && (
                <p id={errorId} role="alert" className="text-meta text-crit">
                  {error.text}
                </p>
              )}

              <Button type="submit" variant="primary" className="h-11 w-full rounded-xl text-sm" loading={busy}>
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>
          </div>

          {mode === 'login' && (
            <section aria-labelledby="demo-title" className="mt-8">
              <h2 id="demo-title" className="text-center text-meta text-muted">
                Быстрый вход для демонстрации
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.login}
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => login(a.login, a.password))}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-5 text-center transition-colors hover:border-accent-line hover:bg-accent-soft/40 disabled:opacity-60"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-subtle text-muted transition-colors group-hover:bg-surface group-hover:text-accent">
                      {a.role === 'manager' ? <LayoutDashboard className="size-5" aria-hidden /> : <Cuboid className="size-5" aria-hidden />}
                    </span>
                    <span className="text-sm font-medium text-ink">{a.role === 'manager' ? 'Руководитель' : 'Гость'}</span>
                    <span className="sr-only">
                      {a.title}: логин {a.login}, пароль {a.password}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <p className="mt-8 text-center text-sm text-muted">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="font-medium text-accent hover:text-accent-hover">
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>

          <details className="group mt-6 text-center text-meta text-muted">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 hover:text-ink [&::-webkit-details-marker]:hidden">
              О доступе и данных
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="mt-4 space-y-2 rounded-2xl border border-line bg-surface p-5 text-left leading-relaxed">
              <li>
                Демо-учётки: руководитель — <span className="font-mono text-ink-2">{DEMO_ACCOUNTS[0].login} / {DEMO_ACCOUNTS[0].password}</span>, гость —{' '}
                <span className="font-mono text-ink-2">
                  {DEMO_ACCOUNTS[1].login} / {DEMO_ACCOUNTS[1].password}
                </span>
                .
              </li>
              <li>Руководитель видит все разделы, гость — только 3D-тур.</li>
              <li>Новые пользователи получают роль «{ROLE_LABEL.guest}»; полный доступ выдаёт руководитель.</li>
              <li>Пароли проверяются на сервере и хранятся только в виде хеша; сессия — в защищённой cookie на 12 часов.</li>
              <li>Собираются только логин и пароль, без ФИО и контактов (152-ФЗ).</li>
              <li>Данные предприятия демонстрационные. {APP.name} {APP.version}.</li>
            </ul>
          </details>
        </div>
      </main>
    </div>
  )
}
