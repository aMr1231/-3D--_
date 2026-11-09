/**
 * Ограничение попыток: после `max` неудач за окно `windowMs` ключ блокируется до конца окна.
 * Хранится в памяти процесса — для одного сервера этого достаточно.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>()
  private readonly max: number
  private readonly windowMs: number

  constructor(max: number, windowMs: number) {
    this.max = max
    this.windowMs = windowMs
  }

  /** Сколько миллисекунд осталось до разблокировки (0 — ключ не заблокирован). */
  blockedFor(key: string, now = Date.now()): number {
    const entry = this.hits.get(key)
    if (!entry || entry.resetAt <= now) return 0
    return entry.count >= this.max ? entry.resetAt - now : 0
  }

  fail(key: string, now = Date.now()): void {
    const entry = this.hits.get(key)
    if (!entry || entry.resetAt <= now) this.hits.set(key, { count: 1, resetAt: now + this.windowMs })
    else entry.count++
  }

  reset(key: string): void {
    this.hits.delete(key)
  }
}
