/**
 * Подключение к WebSocket-серверу Laravel Reverb (протокол Pusher) через Laravel Echo.
 * Подписка на закрытые каналы авторизуется серверной сессией: POST /api/broadcasting/auth
 * тем же клиентом API (cookie сессии + X-XSRF-TOKEN).
 */
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api, setSocketIdProvider } from './api'

export interface RealtimeConfig {
  key: string
  host: string
  port: number
  scheme: 'http' | 'https'
}

/** Состояние соединения Pusher: initialized, connecting, connected, unavailable, failed, disconnected. */
export type SocketState = string

let echo: Echo<'reverb'> | null = null

// Запросы к API передают идентификатор сокета: сервер не шлёт автору его же изменения.
setSocketIdProvider(() => echo?.socketId())

export function connectRealtime(config: RealtimeConfig, onState: (state: SocketState) => void): Echo<'reverb'> {
  disconnectRealtime()
  const tls = config.scheme === 'https'
  const client = new Pusher(config.key, {
    cluster: '',
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: tls,
    enabledTransports: tls ? ['wss'] : ['ws'],
    disableStats: true,
    channelAuthorization: {
      endpoint: '/api/broadcasting/auth',
      transport: 'ajax',
      customHandler: ({ socketId, channelName }, callback) => {
        api<{ auth: string; channel_data?: string }>('POST', '/api/broadcasting/auth', { socket_id: socketId, channel_name: channelName })
          .then((data) => callback(null, data))
          .catch((e: unknown) => callback(e instanceof Error ? e : new Error(String(e)), null))
      },
    },
  })
  client.connection.bind('state_change', ({ current }: { current: SocketState }) => onState(current))
  echo = new Echo({ broadcaster: 'reverb', key: config.key, client, withoutInterceptors: true })
  return echo
}

export function disconnectRealtime() {
  echo?.disconnect()
  echo = null
}
