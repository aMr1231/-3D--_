import type { PluralForms } from './types'

const LOCALE = 'ru-RU'
const NBSP = ' '

const cache = new Map<string, Intl.NumberFormat>()
function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, options)
    cache.set(key, f)
  }
  return f
}

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—'
  return nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

/** Число с «умной» точностью: 1 знак для малых значений, 0 — для больших. */
export function formatSmart(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  return formatNumber(value, abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 1 : 2)
}

export function formatPercent(share: number, digits = 0): string {
  if (!Number.isFinite(share)) return '—'
  return `${formatNumber(share * 100, digits)}${NBSP}%`
}

export function formatRub(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumber(value, digits)}${NBSP}₽`
}

/** 806 тыс. ₽ / 1,24 млн ₽ */
export function formatRubCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)}${NBSP}млн${NBSP}₽`
  if (abs >= 10_000) return `${formatNumber(value / 1000, 0)}${NBSP}тыс.${NBSP}₽`
  return formatRub(value)
}

/** Длительность из минут: «2 ч 09 мин», «55 мин», «4,2 мин». */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—'
  if (minutes < 10) return `${formatNumber(minutes, 1)}${NBSP}мин`
  const total = Math.round(minutes)
  if (total < 60) return `${total}${NBSP}мин`
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}${NBSP}ч${NBSP}${String(m).padStart(2, '0')}${NBSP}мин`
}

/** Короткая длительность для осей графиков: «2,2 ч» или «45 мин». */
export function formatDurationShort(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—'
  if (minutes >= 90) return `${formatNumber(minutes / 60, 1)}${NBSP}ч`
  return `${Math.round(minutes)}${NBSP}мин`
}

export function plural(n: number, forms: PluralForms): string {
  const abs = Math.abs(Math.round(n)) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms.many
  if (last > 1 && last < 5) return forms.few
  if (last === 1) return forms.one
  return forms.many
}

export function formatSigned(value: number, formatter: (v: number) => string): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) < 1e-9) return formatter(0)
  return `${value > 0 ? '+' : '−'}${formatter(Math.abs(value))}`
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const fullDateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso)).replace('.', '')
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso))
}

export function formatFullDate(date: Date): string {
  const s = fullDateFmt.format(date)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** «3 мин назад», «вчера, 14:20» */
export function formatRelative(iso: string, now = Date.now()): string {
  const diff = (now - new Date(iso).getTime()) / 1000
  if (diff < 45) return 'только что'
  if (diff < 3600) {
    const m = Math.round(diff / 60)
    return `${m} ${plural(m, { one: 'минуту', few: 'минуты', many: 'минут' })} назад`
  }
  if (diff < 86400) {
    const h = Math.round(diff / 3600)
    return `${h} ${plural(h, { one: 'час', few: 'часа', many: 'часов' })} назад`
  }
  return formatDateTime(iso)
}
