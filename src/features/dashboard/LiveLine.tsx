import clsx from 'clsx'
import { CircleCheck, Radio, RotateCcw, TriangleExclamationPoint, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { Meter, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import { classifyUtilization } from '@/domain/status'
import { showInfo } from '@/store/info'
import { useRealtimeStore, type LiveEvent, type LiveSnapshot, type RealtimeStatus } from '@/store/realtime'

/** Срез считается устаревшим, если новых шагов нет дольше 10 с (поток остановлен). */
const STALE_MS = 10_000

/**
 * Живая смена: счётчики линии, состояние участков и события оборудования в реальном времени.
 * Поток синтетический (имитатор на сервере), доставка — WebSocket (Laravel Reverb). Пояснения — в «Справке».
 */
export function LiveLine() {
  const status = useRealtimeStore((s) => s.status)
  const live = useRealtimeStore((s) => s.live)
  const stale = useStale(live)
  const more = (
    <Button variant="secondary" size="sm" onClick={() => showInfo('connection')}>
      Подробнее
    </Button>
  )

  return (
    <Panel title="Линия сейчас" actions={<LiveBadge status={status} stale={stale} live={live} />} flush>
      {status === 'off' ? (
        <EmptyState icon={<WifiOff />} title="Реальное время выключено" action={more} />
      ) : !live ? (
        <EmptyState icon={<Radio />} title={status === 'offline' ? 'Нет связи с сервером реального времени' : 'Ожидание данных смены'} action={more} />
      ) : (
        <div className={clsx('grid gap-6 px-5 pt-2 pb-5 md:px-6 md:pb-6 lg:grid-cols-[minmax(0,1fr)_300px]', stale && 'opacity-60')}>
          <div className="min-w-0 space-y-6">
            <Counters live={live} />
            <StageRows live={live} />
          </div>
          <EventFeed events={live.events} />
        </div>
      )}
    </Panel>
  )
}

function useStale(live: LiveSnapshot | null): boolean {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 2000)
    return () => window.clearInterval(id)
  }, [])
  return !!live && now - Date.parse(live.at) > STALE_MS
}

function LiveBadge({ status, stale, live }: { status: RealtimeStatus; stale: boolean; live: LiveSnapshot | null }) {
  const onAir = status === 'live' && !!live && !stale
  const text = onAir ? 'В эфире' : status === 'connecting' ? 'Подключение…' : status === 'off' ? 'Выключено' : stale ? 'Поток остановлен' : 'Нет связи'
  return (
    <div className="flex items-center gap-3 text-13">
      {live && (
        <span className="text-muted tabular-nums">
          Смена {live.shift} · <span className="font-medium text-ink-2">{live.clock}</span>
        </span>
      )}
      <span
        className={clsx('inline-flex h-7 items-center gap-2 rounded-full px-2.5 font-medium', onAir ? 'bg-ok-soft text-ok' : 'bg-subtle text-muted')}
        role="status"
      >
        <span className="relative flex size-2">
          {onAir && <span className="absolute inline-flex size-full rounded-full bg-ok opacity-60 motion-safe:animate-ping" />}
          <span className={clsx('relative inline-flex size-2 rounded-full', onAir ? 'bg-ok' : 'bg-faint')} />
        </span>
        {text}
      </span>
    </div>
  )
}

function Counters({ live }: { live: LiveSnapshot }) {
  const delta = live.produced - live.plan
  const progress = live.shiftLength > 0 ? live.shiftMinute / live.shiftLength : 0
  const items = [
    {
      label: 'Выпуск за смену',
      value: formatNumber(live.produced),
      unit: 'шт',
      note: (
        <span className={delta >= 0 ? 'text-ok' : 'text-crit'}>
          {delta >= 0 ? '+' : '−'}
          {formatNumber(Math.abs(delta))} к плану
        </span>
      ),
    },
    { label: 'Темп', value: formatNumber(live.ratePerHour, 1), unit: 'шт/ч' },
    { label: 'Незавершённое пр-во', value: formatNumber(live.wip), unit: 'шт' },
    { label: 'Брак на ОТК', value: formatNumber(live.scrap), unit: 'шт' },
  ]
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="truncate text-13 text-muted">{item.label}</dt>
            <dd className="mt-1.5 whitespace-nowrap">
              <span className="text-2xl font-semibold tracking-[-0.02em] text-ink tabular-nums">{item.value}</span>
              <span className="ml-1 text-sm text-muted">{item.unit}</span>
            </dd>
            {item.note && <dd className="mt-1 text-13 tabular-nums">{item.note}</dd>}
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-13 whitespace-nowrap text-muted tabular-nums">
          {Math.floor(live.shiftMinute / 60)} ч {live.shiftMinute % 60} мин из 8 ч
        </span>
      </div>
    </div>
  )
}

function StageRows({ live }: { live: LiveSnapshot }) {
  return (
    <ul className="space-y-1">
      {live.stages.map((stage) => {
        const def = STAGES.find((s) => s.id === stage.id)
        if (!def) return null
        const st = classifyUtilization(stage.utilization)
        const down = stage.units - stage.up
        return (
          <li key={stage.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-2 sm:grid-cols-[150px_minmax(0,1fr)_140px]">
            <span className="truncate text-sm font-medium text-ink">{def.shortName}</span>
            <div className="order-3 col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 sm:order-none sm:col-span-1">
              <Units total={stage.units} up={stage.up} inWork={stage.inWork} label={def.resourceKind.many} />
              <span className={clsx('text-13 whitespace-nowrap tabular-nums', stage.queue >= 8 ? 'font-medium text-crit' : 'text-muted')}>
                очередь {formatNumber(stage.queue)}
              </span>
              {down > 0 && (
                <span className="inline-flex items-center gap-1 text-13 whitespace-nowrap text-crit">
                  <TriangleExclamationPoint className="size-4" aria-hidden />
                  {down} в ремонте
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Meter value={stage.utilization} status={st} className="w-20" label={`Загрузка ${def.shortName}: ${formatPercent(stage.utilization)}`} />
              <span className={clsx('w-11 text-right text-13 font-medium tabular-nums', STATUS_TEXT[st])}>{formatPercent(stage.utilization)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Единицы оборудования: заполненная — в работе, контур — свободна, красная — в ремонте. */
function Units({ total, up, inWork, label }: { total: number; up: number; inWork: number; label: string }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${label}: ${up} из ${total} исправны, в работе ${inWork}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={clsx(
            'size-2.5 rounded-sm border transition-colors duration-300',
            i >= up ? 'border-crit bg-crit-soft' : i < inWork ? 'border-accent bg-accent' : 'border-line-strong bg-surface',
          )}
        />
      ))}
    </span>
  )
}

function EventFeed({ events }: { events: LiveEvent[] }) {
  return (
    <div className="min-w-0 rounded-lg bg-subtle p-4">
      <h3 className="text-13 font-semibold text-ink-2">События</h3>
      {events.length === 0 ? (
        <p className="mt-2 text-13 text-muted">Пока без отказов.</p>
      ) : (
        <ol className="scrollbar-thin mt-2 max-h-[300px] space-y-1 overflow-y-auto" aria-live="polite">
          {events.slice(0, 10).map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ol>
      )}
    </div>
  )
}

function EventRow({ event }: { event: LiveEvent }) {
  const def = event.stageId ? STAGES.find((s) => s.id === event.stageId) : undefined
  const unit = def && event.unit ? `${capitalize(def.resourceKind.one)} №${event.unit}` : ''
  const { icon, tone, text } =
    event.type === 'down'
      ? { icon: <TriangleExclamationPoint />, tone: 'text-crit', text: `${unit} остановлен, ремонт ≈ ${event.minutes} мин` }
      : event.type === 'up'
        ? { icon: <CircleCheck />, tone: 'text-ok', text: `${unit} снова в работе` }
        : { icon: <RotateCcw />, tone: 'text-accent', text: `Началась смена ${event.shift}` }
  return (
    <li className="flex animate-fade-in gap-2.5 py-1.5">
      <span className={clsx('mt-0.5 shrink-0 [&_svg]:size-4', tone)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 text-13 leading-snug">
        <span className="text-muted tabular-nums">{event.clock}</span>
        {def && <span className="text-muted"> · {def.shortName}</span>}
        <span className="mt-0.5 block text-ink">{text}</span>
      </span>
    </li>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
