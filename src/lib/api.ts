/**
 * Клиент HTTP API сервера на Laravel.
 * Сессия — в зашифрованной httpOnly-cookie (JavaScript её не видит).
 * Защита от CSRF: значение cookie XSRF-TOKEN отправляется в заголовке X-XSRF-TOKEN.
 */

export class ApiError extends Error {
  readonly status: number
  readonly field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.status = status
    this.field = field
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

let socketIdProvider: () => string | undefined = () => undefined

/** Идентификатор WebSocket-соединения (Reverb) для заголовка X-Socket-ID: сервер не шлёт автору его же событие. */
export function setSocketIdProvider(provider: () => string | undefined) {
  socketIdProvider = provider
}

async function send(method: Method, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const xsrf = readCookie('XSRF-TOKEN')
  if (xsrf && method !== 'GET') headers['X-XSRF-TOKEN'] = xsrf
  const socketId = socketIdProvider()
  if (socketId) headers['X-Socket-ID'] = socketId
  return fetch(path, {
    method,
    credentials: 'same-origin',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function api<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await send(method, path, body)
    // Первый изменяющий запрос до получения CSRF-cookie: берём cookie и повторяем один раз.
    if (res.status === 419 && method !== 'GET') {
      await send('GET', '/api/auth/me').catch(() => undefined)
      res = await send(method, path, body)
    }
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Проверьте, что он запущен (npm run dev), и повторите попытку.')
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // Ответ не JSON — например, прокси вернул страницу ошибки.
  }
  if (!res.ok) {
    const err = (data ?? {}) as { message?: string; error?: string; errors?: Record<string, string[]>; field?: string }
    // Ошибки проверки Laravel: { message, errors: { поле: [сообщения] } } — показываем первое по полю.
    const firstField = err.errors ? Object.keys(err.errors)[0] : undefined
    const fieldMessage = firstField ? err.errors![firstField]?.[0] : undefined
    const fallback =
      res.status === 502 || res.status === 503 || res.status === 504 || (!data && res.status >= 500)
        ? 'Сервер не отвечает. Запустите его командой npm run dev.'
        : `Ошибка ${res.status}`
    throw new ApiError(res.status, fieldMessage ?? err.message ?? err.error ?? fallback, firstField ?? err.field)
  }
  return data as T
}
