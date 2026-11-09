import clsx from 'clsx'
import { CircleQuestionMark, Info, KeyRound, LogOut, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ROLE_LABEL } from '@/domain/types'
import { useOnboardingStore } from '@/features/onboarding/OnboardingTour'
import { useAuthStore } from '@/store/auth'
import { useInfoStore } from '@/store/info'
import { Popover } from '../ui/Popover'
import { BrandMark, BrandName } from './Brand'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { OnlineIndicator } from './OnlineIndicator'

const menuItem = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-subtle hover:text-ink'

/** Шапка: только состояние связи, «Справка» и меню пользователя. */
export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const startOnboarding = useOnboardingStore((s) => s.start)
  const infoOpen = useInfoStore((s) => s.open)
  const toggleInfo = useInfoStore((s) => s.toggle)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2.5 md:hidden">
        <BrandMark className="size-7" tone="light" />
        <BrandName className="text-ink" />
      </div>
      <div className="hidden md:block" />

      <div className="flex shrink-0 items-center gap-1">
        <OnlineIndicator />
        <button
          type="button"
          onClick={toggleInfo}
          aria-expanded={infoOpen}
          aria-controls="info-drawer"
          aria-label="Справка"
          title="Справка (I)"
          className={clsx(
            'inline-flex size-9 items-center justify-center rounded-lg transition-colors pointer-coarse:size-11',
            infoOpen ? 'bg-sunken text-ink' : 'text-muted hover:bg-subtle hover:text-ink',
          )}
        >
          <Info className="size-[18px]" aria-hidden />
        </button>

        {user && (
          <Popover
            label="Меню пользователя"
            className="w-[240px] p-1.5"
            trigger={({ open, toggle, id }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls={id}
                aria-label="Меню пользователя"
                className="ml-1 flex h-9 items-center gap-2 rounded-lg pr-2 pl-1 hover:bg-subtle pointer-coarse:h-11"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {user.login.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium text-ink-2 lg:inline">{user.login}</span>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="px-2.5 pt-1.5 pb-2">
                  <p className="text-sm font-medium text-ink">{user.login}</p>
                  <p className="mt-0.5 text-13 text-muted">{ROLE_LABEL[user.role]}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                {user.role === 'manager' && (
                  <button
                    type="button"
                    className={menuItem}
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
                    className={menuItem}
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
                  className={menuItem}
                  onClick={() => {
                    close()
                    setPasswordOpen(true)
                  }}
                >
                  <KeyRound className="size-4 text-muted" aria-hidden /> Сменить пароль
                </button>
                <button
                  type="button"
                  className={menuItem}
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
