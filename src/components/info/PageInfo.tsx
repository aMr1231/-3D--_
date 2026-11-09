import clsx from 'clsx'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useInfoStore } from '@/store/info'

/**
 * Контекст текущего раздела в «Справке». Рендерится страницей (с её живыми данными),
 * а выводится порталом в панель — на экране раздела этих пояснений нет.
 */
export function PageInfo({ title, children }: { title: string; children: ReactNode }) {
  const slot = useInfoStore((s) => s.slot)
  if (!slot) return null
  return createPortal(
    <div className="space-y-8">
      <p className="text-meta font-medium text-faint">{title}</p>
      {children}
    </div>,
    slot,
  )
}

/** Секция справки: заголовок 13 px semibold и спокойный текст. */
export function InfoSection({ id, title, children, className }: { id?: string; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id ? `info-${id}` : undefined} className={clsx('scroll-mt-4', className)}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-3 text-meta leading-relaxed text-muted">{children}</div>
    </section>
  )
}

/** Список терминов: название — пояснение. */
export function InfoTerms({ items }: { items: { term: ReactNode; text: ReactNode; key?: string }[] }) {
  return (
    <dl className="space-y-3">
      {items.map((i, idx) => (
        <div key={i.key ?? idx}>
          <dt className="font-medium text-ink-2">{i.term}</dt>
          <dd className="mt-0.5">{i.text}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Справочные значения: подпись — число. */
export function InfoFacts({ items }: { items: { label: ReactNode; value: ReactNode; key?: string }[] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map((i, idx) => (
        <div key={i.key ?? idx} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt>{i.label}</dt>
          <dd className="tnum text-right font-medium text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Маркированный список коротких фактов. */
export function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[9px] size-1 shrink-0 rounded-full bg-faint" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}
