import clsx from 'clsx'
import { useAuthStore } from '@/store/auth'
import { showInfo, useInfoStore } from '@/store/info'
import { useRealtimeStore, type RealtimeStatus } from '@/store/realtime'

export const REALTIME_STATUS_TEXT: Record<RealtimeStatus, string> = {
  live: 'Реальное время подключено',
  connecting: 'Подключение к реальному времени…',
  offline: 'Нет связи с сервером реального времени',
  off: 'Реальное время выключено на сервере',
}

/**
 * Состояние WebSocket-соединения — одна точка (для руководителя — с числом людей в сети).
 * Подробности и список руководителей в сети — в «Справке», секция «Подключение».
 */
export function OnlineIndicator() {
  const me = useAuthStore((s) => s.user)
  const status = useRealtimeStore((s) => s.status)
  const members = useRealtimeStore((s) => s.members)
  const infoOpen = useInfoStore((s) => s.open)
  if (!me) return null
  const manager = me.role === 'manager'
  const live = status === 'live'
  const label = live && manager ? `В сети: ${members.length}. ${REALTIME_STATUS_TEXT[status]}` : REALTIME_STATUS_TEXT[status]

  return (
    <button
      type="button"
      onClick={() => showInfo('connection')}
      aria-label={label}
      aria-controls="info-drawer"
      aria-expanded={infoOpen}
      title={label}
      className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-13 font-medium text-muted hover:bg-subtle hover:text-ink pointer-coarse:h-11"
    >
      <span className="relative flex size-2">
        {live && <span className="absolute inline-flex size-full rounded-full bg-ok opacity-50 motion-safe:animate-ping" />}
        <span className={clsx('relative inline-flex size-2 rounded-full', live ? 'bg-ok' : status === 'connecting' ? 'bg-warn-mark' : 'bg-faint')} />
      </span>
      {live && manager && <span className="tabular-nums">{members.length}</span>}
    </button>
  )
}
