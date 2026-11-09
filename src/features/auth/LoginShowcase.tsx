import { Fragment } from 'react'
import { LineDiagram } from '@/components/LineDiagram'
import { formatDuration, formatNumber, formatPercent, formatRub } from '@/domain/format'
import { BASELINE_RESULT } from '@/hooks/useSimulation'

const STEPS = ['Процесс', 'Сценарий', 'Метрики', '3D-тур']

/**
 * Правая панель экрана входа: заголовок, живая мнемосхема и показатели базового режима.
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
    <div className="relative hidden overflow-hidden bg-graphite text-graphite-ink lg:flex lg:flex-col lg:justify-center lg:p-12 xl:p-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, black 35%, transparent 85%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[640px] space-y-12">
        <header>
          <h2 className="max-w-[540px] text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-white xl:text-[32px]">
            Модель процесса, сценарии изменений и виртуальная экскурсия — в одной системе
          </h2>
          <p className="mt-4 max-w-[520px] text-15 leading-relaxed text-graphite-muted">
            Найдите перегруженный участок, проверьте решение на модели и покажите результат в 3D-туре — на одних и тех же данных.
          </p>
        </header>

        <figure className="overflow-hidden rounded-2xl border border-white/[0.08] bg-graphite-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]">
          <div className="px-6 pt-7 pb-6">
            <LineDiagram result={r} theme="dark" className="w-full overflow-visible" />
          </div>
          <dl className="grid grid-cols-4 gap-4 px-6 pb-6">
            {kpis.map((k) => (
              <div key={k.label} className="min-w-0">
                <dt className="truncate text-13 text-graphite-muted">{k.label}</dt>
                <dd className="mt-1 truncate text-15 font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {k.value}
                </dd>
              </div>
            ))}
          </dl>
        </figure>

        <ol className="flex items-center gap-3 text-sm font-medium text-white" aria-label="Как это работает">
          {STEPS.map((title, i) => (
            <Fragment key={title}>
              <li>{title}</li>
              {i < STEPS.length - 1 && <li className="h-px flex-1 bg-gradient-to-r from-white/25 to-white/5" aria-hidden />}
            </Fragment>
          ))}
        </ol>
      </div>
    </div>
  )
}
