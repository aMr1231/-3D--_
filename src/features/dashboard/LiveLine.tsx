import clsx from 'clsx'
import { CircleCheck, Radio, RotateCcw, TriangleExclamationPoint, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/Feedback'
import { Panel } from '@/components/ui/Panel'
import { Meter, StageCode, STATUS_TEXT } from '@/components/ui/Status'
import { STAGES } from '@/data/demo/enterprise'
import { formatNumber, formatPercent } from '@/domain/format'
import { classifyUtilization } from '@/domain/status'
import { useRealtimeStore, type LiveEvent, type LiveSnapshot, type RealtimeStatus } from '@/store/realtime'

/** Срез считается устаревшим, если новых шагов нет дольше 10 с (поток остановлен). */
const STALE_MS = 10_000

/**
 * Живая смена: счётчики линии, состояние участков и события оборудования в реальном времени.
 * Поток синтетический (имитатор на сервере), доставка — WebSocket (Laravel Reverb).
 */
export function LiveLine() {
  const status = useRealtimeStore((s) => s.status)
  const live = useRealtimeStore((s) => s.live)
  const stale = useStale(live)

  return (
    <Panel
      title="Линия сейчас"
      subtitle="Живая смена: синтетический поток с сервера, шаг 2 с = 2 мин смены"
      actions={<LiveBadge status={status} stale={stale} live={live} />}
      flush
    >
      {status === 'off' ? (
        <EmptyState
          icon={<WifiOff />}
          title="Реальное время выключено"
          description="На сервере не настроено вещание (BROADCAST_CONNECTION=reverb). Выполните npm run setup."
        />
      ) : !live ? (
        <EmptyState
          icon={<Radio />}
          title={status === 'offline' ? 'Нет связи с сервером реального времени' : 'Ожидание данных смены'}
          description="Поток запускается вместе с сервером командой npm run dev (процессы ws и live)."
        />
      ) : (
        <div className={clsx('grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]', stale && 'opacity-60')}>
          <div className="min-w-0 border-line lg:border-r">
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
    <div className="flex items-center gap-3 text-xs">
      {live && (
        <span className="text-muted tabular-nums">
          Смена {live.shift} · <span className="font-medium text-ink-2">{live.clock}</span>
        </span>
      )}
      <span
        className={clsx(
          'inline-flex h-6 items-center gap-1.5 rounded-[4px] px-2 font-medium',
          onAir ? 'bg-ok-soft text-ok' : 'bg-subtle text-muted',
        )}
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
      value: `${formatNumber(live.produced)} шт`,
      note: (
        <span className={delta >= 0 ? 'text-ok' : 'text-crit'}>
          {delta >= 0 ? '+' : '−'}
          {formatNumber(Math.abs(delta))} к плану {formatNumber(live.plan)}
        </span>
      ),
    },
    { label: 'Темп за час', value: `${formatNumber(live.ratePerHour, 1)} шт/ч`, note: <span className="text-muted">план 22 шт/ч</span> },
    { label: 'Незавершённое производство', value: `${formatNumber(live.wip)} шт`, note: <span className="text-muted">в очередях и в работе</span> },
    { label: 'Брак на ОТК', value: `${formatNumber(live.scrap)} шт`, note: <span className="text-muted">с начала смены</span> },
  ]
  return (
    <div className="border-b border-line">
      <dl className="grid grid-cols-2 md:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.label} className={clsx('px-4 py-3', i > 0 && 'md:border-l md:border-line', i % 2 === 1 && 'border-l border-line md:border-l')}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink tabular-nums">{item.value}</dd>
            <dd className="text-2xs tabular-nums">{item.note}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-2xs whitespace-nowrap text-muted tabular-nums">
          прошло {Math.floor(live.shiftMinute / 60)} ч {live.shiftMinute % 60} мин из 8 ч
        </span>
      </div>
    </div>
  )
}

function StageRows({ live }: { live: LiveSnapshot }) {
  return (
    <ul className="divide-y divide-line">
      {live.stages.map((stage) => {
        const def = STAGES.find((s) => s.id === stage.id)
        if (!def) return null
        const st = classifyUtilization(stage.utilization)
        const down = stage.units - stage.up
        return (
          <li key={stage.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:grid-cols-[180px_minmax(0,1fr)_150px]">
            <div className="flex min-w-0 items-center gap-2">
              <StageCode>{def.code}</StageCode>
              <span className="truncate text-13 font-medium text-ink">{def.shortName}</span>
            </div>
            <div className="order-3 col-span-2 flex items-center gap-3 sm:order-none sm:col-span-1">
              <Units total={stage.units} up={stage.up} inWork={stage.inWork} label={def.resourceKind.many} />
              <span className={clsx('text-xs whitespace-nowrap tabular-nums', stage.queue >= 8 ? 'font-medium text-crit' : 'text-muted')}>
                очередь {formatNumber(stage.queue)}
              </span>
              {down > 0 && (
                <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-crit">
                  <TriangleExclamationPoint className="size-3.5" aria-hidden />
                  {down} в ремонте
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Meter value={stage.utilization} status={st} className="w-20" label={`Загрузка ${def.shortName}: ${formatPercent(stage.utilization)}`} />
              <span className={clsx('w-10 text-right text-xs font-medium tabular-nums', STATUS_TEXT[st])}>{formatPercent(stage.utilization)}</span>
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
            'size-2.5 rounded-[2px] border transition-colors duration-300',
            i >= up ? 'border-crit bg-crit-soft' : i < inWork ? 'border-accent bg-accent' : 'border-line-strong bg-surface',
          )}
        />
      ))}
    </span>
  )
}

function EventFeed({ events }: { events: LiveEvent[] }) {
  return (
    <div className="min-w-0 border-t border-line lg:border-t-0">
      <p className="px-4 pt-3 pb-1.5 text-2xs tracking-[0.06em] text-muted uppercase">События оборудования</p>
      {events.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-muted">Пока без отказов.</p>
      ) : (
        <ol className="max-h-[300px] overflow-y-auto px-2 pb-2" aria-live="polite">
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
    <li className="flex animate-fade-in gap-2.5 rounded-md px-2 py-1.5">
      <span className={clsx('mt-0.5 shrink-0 [&_svg]:size-3.5', tone)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 text-xs leading-snug">
        <span className="text-muted tabular-nums">{event.clock}</span>
        {def && (
          <>
            <span className="text-faint"> · </span>
            <span className="text-ink-2">{def.shortName}</span>
          </>
        )}
        <span className="block text-ink">{text}</span>
      </span>
    </li>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
