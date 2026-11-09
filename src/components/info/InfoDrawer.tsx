import clsx from 'clsx'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { APP, STATUS_THRESHOLDS } from '@/config/app'
import { ENTERPRISE, STAGES } from '@/data/demo/enterprise'
import { formatPercent } from '@/domain/format'
import { STATUS_META } from '@/domain/status'
import { ROLE_ACCESS, ROLE_LABEL } from '@/domain/types'
import { useAuthStore } from '@/store/auth'
import { useInfoStore } from '@/store/info'
import { useRealtimeStore } from '@/store/realtime'
import { REALTIME_STATUS_TEXT } from '../layout/OnlineIndicator'
import { Button } from '../ui/Button'
import { STATUS_ICON, STATUS_TEXT } from '../ui/Status'
import { InfoFacts, InfoList, InfoSection } from './PageInfo'

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/**
 * Панель «Справка»: справа поверх содержимого (на телефоне — нижний лист), немодальная.
 * Порядок: данные → контекст текущего раздела (портал из страницы) → общие обозначения и сведения.
 * Клавиша I — открыть/закрыть, Esc — закрыть; фокус возвращается туда, откуда панель открыли.
 */
export function InfoDrawer() {
  const open = useInfoStore((s) => s.open)
  const section = useInfoStore((s) => s.section)
  const hide = useInfoStore((s) => s.hide)
  const setSlot = useInfoStore((s) => s.setSlot)
  const panelRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return
      const state = useInfoStore.getState()
      if (e.key === 'Escape' && state.open) {
        // Справка лежит поверх панелей деталей — Esc сначала закрывает её.
        e.stopPropagation()
        state.hide()
        return
      }
      if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !isEditable(e.target)) {
        e.preventDefault()
        state.toggle()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => {
    if (open) {
      if (!panelRef.current?.contains(document.activeElement)) returnFocus.current = document.activeElement as HTMLElement | null
      const id = requestAnimationFrame(() => {
        const target = section ? document.getElementById(`info-${section}`) : null
        if (target) target.scrollIntoView({ block: 'start' })
        else scrollRef.current?.scrollTo({ top: 0 })
        panelRef.current?.focus({ preventScroll: true })
      })
      return () => cancelAnimationFrame(id)
    }
    const active = document.activeElement
    if (returnFocus.current && (active === document.body || panelRef.current?.contains(active))) returnFocus.current.focus()
    returnFocus.current = null
  }, [open, section])

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={hide} aria-hidden />}
      <aside
        id="info-drawer"
        ref={panelRef}
        tabIndex={-1}
        aria-label="Справка"
        inert={!open}
        className={clsx(
          'fixed z-40 flex flex-col bg-surface outline-none transition-[transform,opacity,visibility] duration-200 ease-out',
          'inset-x-0 bottom-[calc(var(--tabbar-h,0px)+env(safe-area-inset-bottom))] max-h-[82dvh] rounded-t-2xl border-t border-line shadow-overlay',
          'md:inset-x-auto md:top-[68px] md:right-3 md:bottom-3 md:max-h-none md:w-[400px] md:rounded-xl md:border',
          open ? 'visible translate-y-0 opacity-100 md:translate-x-0' : 'invisible translate-y-6 opacity-0 md:translate-x-6 md:translate-y-0',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-6 pt-5 pb-2">
          <h2 className="text-15 font-semibold text-ink">Справка</h2>
          <Button variant="ghost" size="icon-sm" onClick={hide} aria-label="Закрыть справку" className="-mr-2">
            <X />
          </Button>
        </header>
        <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 space-y-8 overflow-y-auto px-6 pt-2 pb-8">
          <DataSection />
          <div ref={setSlot} className="empty:hidden" />
          <LegendSection />
          <StagesSection />
          <ConnectionSection />
          <AboutSection />
          <p className="text-13 text-faint">
            Клавиша <kbd className="rounded-md border border-line px-1.5 py-0.5 font-sans text-xs text-muted">I</kbd> открывает и
            закрывает справку.
          </p>
        </div>
      </aside>
    </>
  )
}

function DataSection() {
  return (
    <InfoSection id="data" title="Данные">
      <p>Предприятие, процессы и показатели — демонстрационные.</p>
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
          Подробнее
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3">
          <InfoList
            items={[
              'Предприятие, процессы и показатели — синтетические, внутренне согласованные данные.',
              'Метрики двойника и сценариев вычисляет модель линии в браузере, случайных значений нет.',
              '«Линия сейчас» — синтетический поток с сервера: случайные поступления, отказы и ремонты.',
              'Интеграции с ERP, MES и 1С не используются.',
              'Сценарии и журнал расчётов хранятся на сервере (Laravel) и общие для руководителей.',
            ]}
          />
        </div>
      </details>
    </InfoSection>
  )
}

function LegendSection() {
  return (
    <InfoSection id="legend" title="Обозначения">
      <ul className="space-y-3">
        {(['bottleneck', 'high', 'normal', 'idle'] as const).map((st) => {
          const Icon = STATUS_ICON[st]
          return (
            <li key={st} className="flex gap-2.5">
              <Icon className={clsx('mt-0.5 size-4 shrink-0', STATUS_TEXT[st])} aria-hidden />
              <span>
                <span className="font-medium text-ink-2">{STATUS_META[st].label}.</span> {STATUS_META[st].description}
              </span>
            </li>
          )
        })}
      </ul>
      <p>
        Риски на шкале загрузки — пороги {formatPercent(STATUS_THRESHOLDS.high)} и {formatPercent(STATUS_THRESHOLDS.bottleneck)}.
        Ограничение линии — самый загруженный участок: он задаёт выпуск всей линии.
      </p>
    </InfoSection>
  )
}

function StagesSection() {
  return (
    <InfoSection id="stages" title="Участки линии">
      <ol className="space-y-2.5">
        {STAGES.map((s) => (
          <li key={s.id} className="flex gap-3">
            <span className="code-tag w-10 shrink-0 pt-px text-faint">{s.code}</span>
            <span>
              <span className="block font-medium text-ink-2">{s.name}</span>
              <span className="block">{s.area}</span>
            </span>
          </li>
        ))}
      </ol>
    </InfoSection>
  )
}

function ConnectionSection() {
  const me = useAuthStore((s) => s.user)
  const status = useRealtimeStore((s) => s.status)
  const members = useRealtimeStore((s) => s.members)
  const manager = me?.role === 'manager'
  return (
    <InfoSection id="connection" title="Подключение">
      <p className="flex items-center gap-2 font-medium text-ink-2">
        <span className={clsx('size-2 rounded-full', status === 'live' ? 'bg-ok' : status === 'connecting' ? 'bg-warn-mark' : 'bg-faint')} aria-hidden />
        {REALTIME_STATUS_TEXT[status]}
      </p>
      <p>Изменения сценариев, прав и журнала приходят без обновления страницы; линия обновляется каждые 2 с.</p>
      {status === 'off' && <p>На сервере не настроено вещание (BROADCAST_CONNECTION=reverb). Выполните npm run setup.</p>}
      {(status === 'offline' || status === 'connecting') && <p>Поток запускается вместе с сервером командой npm run dev (процессы ws и live).</p>}
      {manager && status === 'live' && members.length > 0 && (
        <div>
          <p className="font-medium text-ink-2">Руководители в сети</p>
          <ul className="mt-2 space-y-1.5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-ink">
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                <span className="font-mono">{m.login}</span>
                {m.id === me?.id && <span className="text-faint">— вы</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </InfoSection>
  )
}

function AboutSection() {
  const me = useAuthStore((s) => s.user)
  return (
    <InfoSection id="about" title="О системе">
      <InfoFacts
        items={[
          { label: 'Продукт', value: `${APP.name} — ${APP.tagline.toLowerCase()}` },
          { label: 'Версия', value: APP.version },
          { label: 'Предприятие', value: ENTERPRISE.name },
          { label: 'Площадка', value: ENTERPRISE.site },
          { label: 'Изделие', value: ENTERPRISE.product.name },
          { label: 'Режим работы', value: `${ENTERPRISE.shiftsPerDay} смены по ${ENTERPRISE.hoursPerShift} ч` },
          ...(me ? [{ label: 'Ваша роль', value: `${ROLE_LABEL[me.role]} · ${ROLE_ACCESS[me.role].toLowerCase()}` }] : []),
        ]}
      />
    </InfoSection>
  )
}
