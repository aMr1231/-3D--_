import { CircleQuestionMark, Database, KeyRound, LogOut, ShieldCheck, Users } from 'lucide-react'
import { useOnboardingStore } from '@/features/onboarding/OnboardingTour'
import { useState } from 'react'
import { ROLE_ACCESS, ROLE_LABEL } from '@/domain/types'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { useNavigate } from 'react-router'
import { ENTERPRISE } from '@/data/demo/enterprise'
import { useAuthStore } from '@/store/auth'
import { Popover } from '../ui/Popover'
import { BrandMark, BrandName } from './Brand'
import { OnlineIndicator } from './OnlineIndicator'

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const startOnboarding = useOnboardingStore((s) => s.start)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center gap-2 md:hidden">
          <BrandMark className="size-7" tone="light" />
          <BrandName className="text-ink" />
        </div>
        <p className="hidden min-w-0 items-center gap-1.5 truncate text-13 text-muted md:flex">
          <span className="truncate text-ink-2">{ENTERPRISE.name}</span>
          <span className="text-faint">/</span>
          <span className="truncate">{ENTERPRISE.site}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <OnlineIndicator />
        <Popover
          label="О демонстрационных данных"
          className="w-[300px] p-3.5"
          trigger={({ open, toggle, id }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={id}
              className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-warn-mark/40 bg-warn-soft px-2 text-xs font-medium text-warn hover:border-warn-mark/70"
            >
              <Database className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Демо-данные</span>
              <span className="sm:hidden">Демо</span>
            </button>
          )}
        >
          <p className="text-13 font-semibold text-ink">Демонстрационный режим</p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted">
            <li>Предприятие, процессы и показатели — синтетические, внутренне согласованные данные.</li>
            <li>Метрики двойника и сценариев вычисляет модель линии в браузере, случайных значений нет.</li>
            <li>«Линия сейчас» — синтетический поток с сервера: случайные поступления, отказы и ремонты.</li>
            <li>Интеграции с ERP, MES и 1С не используются.</li>
            <li>Сценарии и журнал расчётов хранятся на сервере (Laravel) и общие для руководителей.</li>
          </ul>
        </Popover>

        {user && (
          <Popover
            label="Меню пользователя"
            className="w-[240px] py-1.5"
            trigger={({ open, toggle, id }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={id}
                aria-label="Меню пользователя"
                className="flex h-8 items-center gap-2 rounded-md pr-1.5 pl-1 hover:bg-subtle"
              >
                <span className="flex size-6 items-center justify-center rounded-[5px] bg-graphite text-2xs font-semibold text-white">
                  {user.login.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-13 font-medium text-ink-2 lg:inline">{user.login}</span>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="border-b border-line px-3 pt-1.5 pb-2.5">
                  <p className="text-13 font-medium text-ink">{user.login}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <ShieldCheck className="size-3.5" aria-hidden /> {ROLE_LABEL[user.role]} · {ROLE_ACCESS[user.role].toLowerCase()}
                  </p>
                </div>
                {user.role === 'manager' && (
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-left text-13 text-ink-2 hover:bg-subtle"
                    onClick={() => {
                      close()
                      navigate('/')
                      window.setTimeout(startOnboarding, 350)
                    }}
                  >
                    <CircleQuestionMark className="size-4 text-muted" aria-hidden /> Как пользоваться
                  </button>
                )}
                {user.role === 'manager' && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-13 text-ink-2 hover:bg-subtle"
                    onClick={() => {
                      close()
                      navigate('/users')
                    }}
                  >
                    <Users className="size-4 text-muted" aria-hidden /> Пользователи
                  </button>
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-13 text-ink-2 hover:bg-subtle first:mt-1"
                  onClick={() => {
                    close()
                    setPasswordOpen(true)
                  }}
                >
                  <KeyRound className="size-4 text-muted" aria-hidden /> Сменить пароль
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-13 text-ink-2 hover:bg-subtle"
                  onClick={async () => {
                    close()
                    await logout()
                    navigate('/login', { replace: true })
                  }}
                >
                  <LogOut className="size-4 text-muted" aria-hidden /> Выйти
                </button>
              </>
            )}
          </Popover>
        )}
      </div>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  )
}
