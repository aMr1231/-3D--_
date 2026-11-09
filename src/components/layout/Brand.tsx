import clsx from 'clsx'
import { APP } from '@/config/app'

/** Знак продукта: два участка, связанных потоком (мотив мнемосхемы). */
export function BrandMark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx('shrink-0', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill={tone === 'dark' ? '#22272c' : '#14171a'} />
      <rect x="6.5" y="10.5" width="7" height="11" rx="1.5" fill="none" stroke="#5fb3c7" strokeWidth="1.8" />
      <rect x="18.5" y="10.5" width="7" height="11" rx="1.5" fill="none" stroke="#e8ecef" strokeWidth="1.8" />
      <path d="M13.5 16h5" stroke="#5fb3c7" strokeWidth="1.8" />
    </svg>
  )
}

export function BrandName({ className }: { className?: string }) {
  return <span className={clsx('text-[15px] font-semibold tracking-[-0.01em]', className)}>{APP.name}</span>
}
