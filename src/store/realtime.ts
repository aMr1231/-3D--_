import { useEffect } from 'react'
import { create } from 'zustand'
import { ROLE_LABEL, type Role } from '@/domain/types'
import { ApiError, api } from '@/lib/api'
import type { RealtimeConfig, SocketState } from '@/lib/realtime'
import { useAuthStore } from './auth'
import { useScenarioStore } from './scenarios'
import { toast } from './toast'

/** Срез живой смены (php artisan twinline:live). Данные синтетические. */
export interface LiveStage {
  id: string
  /** Ждут обработки. */
  queue: number
  /** Сейчас в обработке. */
  inWork: number
  units: number
  /** Исправных единиц оборудования. */
  up: number
  /** Загрузка доступного оборудования за последний час, 0…1. */
  utilization: number
}

export interface LiveEvent {
  id: number
  clock: string
  type: 'down' | 'up' | 'shift'
  stageId?: string
  unit?: number
  minutes?: number
  shift?: number
}

export interface LiveSnapshot {
  seq: number
  at: string
  clock: string
  shift: number
  shiftMinute: number
  shiftLength: number
  minutesPerTick: number
  produced: number
  plan: number
  scrap: number
  ratePerHour: number
  wip: number
  stages: LiveStage[]
  events: LiveEvent[]
}

export interface OnlineMember {
  id: number
  login: string
}

/** off — вещание выключено на сервере; offline — сервер Reverb недоступен. */
export type RealtimeStatus = 'off' | 'connecting' | 'live' | 'offline'

interface RealtimeState {
  status: RealtimeStatus
  members: OnlineMember[]
  live: LiveSnapshot | null
  /** Счётчики изменений: страницы перечитывают данные при их росте. */
  usersVersion: number
  auditVersion: number
}

const INITIAL: RealtimeState = { status: 'off', members: [], live: null, usersVersion: 0, auditVersion: 0 }

export const useRealtimeStore = create<RealtimeState>()(() => INITIAL)

const set = useRealtimeStore.setState

/** Клиент Echo/Pusher (~60 КБ) загружается отдельным файлом — экрану входа он не нужен. */
let realtimeLib: typeof import('@/lib/realtime') | null = null

function socketStatus(state: SocketState): RealtimeStatus {
  if (state === 'connected') return 'live'
  if (state === 'initialized' || state === 'connecting') return 'connecting'
  return 'offline'
}

const SCENARIO_VERB: Record<string, string> = {
  created: 'создал сценарий',
  updated: 'изменил сценарий',
  deleted: 'удалил сценарий',
  reset: 'сбросил демо-сценарии',
  cleared: 'очистил журнал прогонов',
}

interface ScenariosChanged {
  kind: 'scenario' | 'runs'
  action: string
  name: string | null
  actor: string | null
}

interface UserChanged {
  action: 'registered' | 'role' | 'deleted' | 'password'
  userId: number
  login: string
  role: Role | null
  actor: string | null
}

/** Изменения собственной учётной записи: права применяются сразу, без перезагрузки. */
async function onOwnAccountChanged(e: UserChanged) {
  const auth = useAuthStore.getState()
  await auth.init()
  const user = useAuthStore.getState().user
  if (!user) {
    if (e.action === 'deleted') toast.error('Учётная запись удалена', `Руководитель ${e.actor ?? ''} удалил вашу учётную запись.`.trim())
    else if (e.action === 'password') toast.info('Пароль изменён', 'Пароль сменили в другом окне — войдите с новым паролем.')
    return
  }
  if (e.action === 'role' && e.role) toast.info('Права изменены', `Ваша роль теперь — «${ROLE_LABEL[e.role]}».`)
}

/**
 * Подключение к реальному времени на время сессии пользователя.
 * Все: живая смена и личный канал. Руководители: присутствие и изменения общих данных.
 */
export function useRealtimeConnection() {
  const userId = useAuthStore((s) => s.user?.id)
  const role = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    if (!userId || !role) return
    let cancelled = false
    let refreshTimer: number | undefined

    void (async () => {
      let config: RealtimeConfig | null = null
      try {
        config = (await api<{ realtime: RealtimeConfig | null }>('GET', '/api/realtime')).realtime
      } catch (e) {
        if (!(e instanceof ApiError)) throw e
      }
      if (cancelled) return
      if (!config) {
        set({ status: 'off' })
        return
      }
      set({ status: 'connecting' })
      realtimeLib ??= await import('@/lib/realtime')
      if (cancelled) return
      const echo = realtimeLib.connectRealtime(config, (state) => set({ status: socketStatus(state) }))

      // Текущий срез — сразу, не дожидаясь следующего шага (2 с).
      api<{ live: LiveSnapshot | null }>('GET', '/api/live')
        .then(({ live }) => {
          if (!cancelled && live) set((s) => (s.live && s.live.seq > live.seq ? s : { live }))
        })
        .catch(() => undefined)

      echo.private('twinline.live').listen('.live.tick', (snapshot: LiveSnapshot) => set({ live: snapshot }))
      echo.private(`twinline.user.${userId}`).listen('.user.changed', (e: UserChanged) => void onOwnAccountChanged(e))

      if (role === 'manager') {
        echo
          .join('twinline.managers')
          .here((members: OnlineMember[]) => set({ members }))
          .joining((m: OnlineMember) => set((s) => ({ members: [...s.members.filter((x) => x.id !== m.id), m] })))
          .leaving((m: OnlineMember) => set((s) => ({ members: s.members.filter((x) => x.id !== m.id) })))
          .listen('.scenarios.changed', (e: ScenariosChanged) => {
            // Несколько изменений подряд — одна перезагрузка данных.
            window.clearTimeout(refreshTimer)
            refreshTimer = window.setTimeout(() => void useScenarioStore.getState().refresh(), 250)
            const verb = SCENARIO_VERB[e.action]
            if (verb && e.actor) toast.info(`${e.actor} ${verb}${e.name ? ` «${e.name}»` : ''}`)
          })
          .listen('.user.changed', () => set((s) => ({ usersVersion: s.usersVersion + 1 })))
          .listen('.audit.recorded', () => set((s) => ({ auditVersion: s.auditVersion + 1 })))
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(refreshTimer)
      realtimeLib?.disconnectRealtime()
      set(INITIAL)
    }
  }, [userId, role])
}
