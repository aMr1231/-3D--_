import clsx from 'clsx'
import { useAuthStore } from '@/store/auth'
import { useRealtimeStore, type RealtimeStatus } from '@/store/realtime'
import { Popover } from '../ui/Popover'

const STATUS_TEXT: Record<RealtimeStatus, string> = {
  live: 'Реальное время подключено',
  connecting: 'Подключение к реальному времени…',
  offline: 'Нет связи с сервером реального времени',
  off: 'Реальное время выключено на сервере',
}

/** Состояние WebSocket-соединения; для руководителей — кто сейчас в системе (presence-канал). */
export function OnlineIndicator() {
  const me = useAuthStore((s) => s.user)
  const status = useRealtimeStore((s) => s.status)
  const members = useRealtimeStore((s) => s.members)
  if (!me) return null
  const manager = me.role === 'manager'
  const live = status === 'live'

  return (
    <Popover
      label="Реальное время"
      className="w-[240px] p-3"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={live && manager ? `В сети: ${members.length}` : STATUS_TEXT[status]}
          className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-line px-2 text-xs font-medium text-ink-2 hover:border-line-strong"
        >
          <span className="relative flex size-2">
            {live && <span className="absolute inline-flex size-full rounded-full bg-ok opacity-50 motion-safe:animate-ping" />}
            <span className={clsx('relative inline-flex size-2 rounded-full', live ? 'bg-ok' : status === 'connecting' ? 'bg-warn' : 'bg-faint')} />
          </span>
          {live && manager ? (
            <span className="tabular-nums">
              <span className="hidden sm:inline">В сети </span>
              {members.length}
            </span>
          ) : (
            <span className="hidden sm:inline">{live ? 'Онлайн' : 'Офлайн'}</span>
          )}
        </button>
      )}
    >
      <p className="text-13 font-semibold text-ink">{STATUS_TEXT[status]}</p>
      <p className="mt-1 text-xs text-muted">
        Изменения сценариев, прав и журнала приходят без обновления страницы; линия обновляется каждые 2 с.
      </p>
      {manager && live && (
        <>
          <p className="mt-3 text-2xs tracking-[0.06em] text-muted uppercase">Руководители в сети</p>
          <ul className="mt-1.5 space-y-1">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-13 text-ink">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                <span className="font-mono">{m.login}</span>
                {m.id === me.id && <span className="text-2xs text-muted">вы</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </Popover>
  )
}
