import { X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

/* ───────── Состояние: открыт ли тур (можно открыть из меню пользователя) ───────── */

interface OnboardingState {
  open: boolean
  start: () => void
  close: () => void
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  open: false,
  start: () => set({ open: true }),
  close: () => set({ open: false }),
}))

const seenKey = (login: string) => `twinline.onboarding.v1:${login}`

function wasSeen(login: string): boolean {
  try {
    return localStorage.getItem(seenKey(login)) === '1'
  } catch {
    return true
  }
}

function markSeen(login: string) {
  try {
    localStorage.setItem(seenKey(login), '1')
  } catch {
    // Хранилище недоступно — тур просто покажется снова в следующий раз.
  }
}

/* ───────── Шаги ───────── */

interface Step {
  target: string
  title: string
  text: string
}

const STEPS: Step[] = [
  {
    target: 'line',
    title: 'Где перегрузка',
    text: 'Красный участок с пульсацией — ограничение линии: там копится очередь. Нажмите на участок, чтобы открыть его паспорт на схеме двойника.',
  },
  {
    target: 'kpi',
    title: 'Ключевые показатели',
    text: 'Значения рассчитаны моделью линии. Под каждым — изменение к среднему за выбранный период, справа — тренд.',
  },
  {
    target: 'issues',
    title: 'Что сделать',
    text: 'Рекомендации посчитаны перерасчётом модели. «Смоделировать» откроет сценарий с уже предложенным изменением — останется нажать «Рассчитать» и сравнить с базой.',
  },
  {
    target: 'tour-nav',
    title: 'Показать в 3D',
    text: 'Тот же участок можно показать в цехе: цвет сигнальных ламп, число станков и метрики в карточках берутся из модели.',
  },
]

function findTarget(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
  return all.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) ?? null
}

const CARD_W = 320
const PAD = 6

/**
 * Подсказки при первом входе руководителя: 4 шага по обзору с подсветкой элементов.
 * Показываются один раз на учётную запись в этом браузере; повтор — «Как пользоваться» в меню.
 */
export function OnboardingTour() {
  const login = useAuthStore((s) => s.user?.login)
  const open = useOnboardingStore((s) => s.open)
  const start = useOnboardingStore((s) => s.start)
  const closeStore = useOnboardingStore((s) => s.close)
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Автозапуск при первом входе.
  useEffect(() => {
    if (!login || wasSeen(login)) return
    const id = window.setTimeout(start, 700)
    return () => window.clearTimeout(id)
  }, [login, start])

  // Шаги без видимой цели (например, меню скрыто на телефоне) пропускаем.
  const steps = open ? STEPS.filter((s) => findTarget(s.target)) : STEPS
  const step = steps[Math.min(index, steps.length - 1)]

  const finish = useCallback(() => {
    if (login) markSeen(login)
    closeStore()
    setIndex(0)
    setRect(null)
  }, [login, closeStore])

  const measure = useCallback(() => {
    if (!step) return
    const el = findTarget(step.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useLayoutEffect(() => {
    if (!open || !step) return
    const el = findTarget(step.target)
    el?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    measure()
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [open, step, measure])

  useEffect(() => {
    if (!open) return
    cardRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, finish, steps.length, index])

  if (!open || !step || !rect) return null

  const last = index >= steps.length - 1
  // Карточка — под элементом, если помещается, иначе над ним; по горизонтали — в пределах экрана.
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardW = Math.min(CARD_W, vw - 24)
  const below = rect.bottom + PAD + 12 + 190 < vh
  const top = below ? rect.bottom + PAD + 12 : Math.max(12, rect.top - PAD - 12 - 190)
  const left = Math.min(Math.max(12, rect.left + (rect.width > cardW ? 0 : rect.width / 2 - cardW / 2)), vw - cardW - 12)

  return (
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        className="pointer-events-none fixed rounded-xl ring-2 ring-accent-bright"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgb(20 23 26 / 0.55)',
        }}
        aria-hidden
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="fixed animate-fade-in rounded-xl border border-line bg-surface p-5 shadow-overlay outline-none"
        style={{ top, left, width: cardW }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="tnum text-13 font-medium text-accent">
              Шаг {index + 1} из {steps.length}
            </p>
            <h2 id="onboarding-title" className="mt-1 text-15 font-semibold text-ink">
              {step.title}
            </h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={finish} aria-label="Закрыть подсказки" className="-mt-1 -mr-1.5">
            <X />
          </Button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.target} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-accent' : 'w-1.5 bg-line-strong'}`} />
            ))}
          </div>
          <div className="flex gap-1.5">
            {index > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => setIndex((i) => i - 1)}>
                Назад
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={finish}>
                Пропустить
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => (last ? finish() : setIndex((i) => i + 1))}>
              {last ? 'Понятно' : 'Далее'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
