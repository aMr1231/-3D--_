/** Клиент HTTP API сервера авторизации. Cookie сессии httpOnly — JavaScript её не видит. */

export class ApiError extends Error {
  readonly status: number
  readonly field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.status = status
    this.field = field
  }
}

export async function api<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
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
    const err = (data ?? {}) as { error?: string; field?: string }
    const fallback =
      res.status === 502 || res.status === 504 || (!data && res.status >= 500)
        ? 'Сервер авторизации не отвечает. Запустите его командой npm run dev.'
        : `Ошибка ${res.status}`
    throw new ApiError(res.status, err.error ?? fallback, err.field)
  }
  return data as T
}
