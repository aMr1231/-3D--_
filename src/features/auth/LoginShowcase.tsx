import { LineDiagram } from '@/components/LineDiagram'
import { ENTERPRISE } from '@/data/demo/enterprise'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { BASELINE_RESULT } from '@/hooks/useSimulation'

const STEPS: [string, string, string][] = [
  ['01', 'Процесс', 'этапы, ресурсы, параметры'],
  ['02', 'Сценарий', 'нагрузка и изменения'],
  ['03', 'Метрики', 'время, выпуск, загрузка, стоимость'],
  ['04', '3D-тур', 'участки и точки интереса'],
]

/**
 * Правая панель экрана входа: «окно» системы с живой мнемосхемой и показателями базового режима.
 * Все значения берутся из расчёта модели — без нарисованных вручную цифр.
 */
export function LoginShowcase() {
  const r = BASELINE_RESULT

  const kpis = [
    { label: 'Выпуск', value: `${formatNumber(r.outputPerDay, 0)} шт/сут` },
    { label: 'Время цикла', value: formatDuration(r.cycleTimeMin) },
    { label: 'Загрузка', value: formatPercent(r.avgUtilization, 1) },
    { label: 'Себестоимость', value: formatRub(r.costPerUnit) },
  ]

  return (
    <div className="relative hidden overflow-hidden bg-graphite text-graphite-ink lg:flex lg:flex-col lg:justify-center lg:p-10 xl:p-14">
      {/* Техническая сетка, растворяющаяся к краям */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.07) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 35%, transparent 85%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[660px] space-y-10">
        <header>
          <p className="text-2xs tracking-[0.1em] text-accent-bright uppercase">Цифровой двойник · 3D-тур</p>
          <h2 className="mt-3 max-w-[540px] text-[26px] leading-[1.2] font-semibold tracking-[-0.015em] text-white xl:text-[28px]">
            Модель процесса, сценарии изменений и виртуальная экскурсия — в одной системе
          </h2>
          <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-graphite-muted">
            Найдите перегруженный участок, проверьте решение на модели и покажите результат в 3D-туре — на одних и тех же данных.
          </p>
        </header>

        {/* «Окно» системы */}
        <figure className="overflow-hidden rounded-xl border border-white/[0.08] bg-graphite-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
            <span className="flex min-w-0 items-center gap-2 text-xs text-white">
              <span className="size-1.5 shrink-0 rounded-full bg-[#3fb06f]" aria-hidden />
              <span className="truncate">{ENTERPRISE.site}</span>
            </span>
            <span className="shrink-0 font-mono text-2xs text-graphite-muted">модель · базовый режим</span>
          </div>

          <div className="px-5 pt-6 pb-5">
            <LineDiagram result={r} theme="dark" className="w-full overflow-visible" />
          </div>

          <dl className="grid grid-cols-4 divide-x divide-white/[0.06] border-t border-white/[0.06]">
            {kpis.map((k) => (
              <div key={k.label} className="min-w-0 px-4 py-3.5 xl:px-5">
                <dt className="truncate text-2xs text-graphite-muted">{k.label}</dt>
                <dd className="mt-1 truncate text-[15px] font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {k.value}
                </dd>
              </div>
            ))}
          </dl>
        </figure>

        {/* Как это работает: связанный маршрут из четырёх шагов */}
        <ol className="grid grid-cols-4 gap-x-4">
          {STEPS.map(([n, title, desc], i) => (
            <li key={n} className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/15 font-mono text-[10px] text-white">
                  {n}
                </span>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-gradient-to-r from-white/20 to-white/5" aria-hidden />}
              </div>
              <p className="mt-2.5 text-13 font-medium text-white">{title}</p>
              <p className="mt-0.5 text-xs leading-snug text-graphite-muted">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
