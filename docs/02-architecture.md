# 2. Архитектура

## 2.1. Обзор

Twinline — одностраничное веб-приложение (SPA) и сервер на Laravel 13. Все расчёты выполняются в браузере детерминированным движком; данные предприятия — синтетические и лежат в одном каталоге, чтобы их можно было заменить реальными.

| Слой | Каталог | Ответственность |
|---|---|---|
| Данные | `src/data/demo` | Предприятие, участки, базовые параметры, история, пресеты сценариев, точки интереса, демо-учётки |
| Домен | `src/domain` | Типы, движок расчёта, метрики и сравнение, статусы, выводы и рекомендации, форматирование |
| Состояние | `src/store` | Zustand: текущий пользователь (из ответа сервера), сценарии и журнал прогонов (localStorage), уведомления |
| Сервер | `backend/` | Laravel 13: регистрация, вход, сессии, роли, пользователи, сценарии и журнал прогонов, журнал действий; SQLite / MySQL / PostgreSQL |
| Интерфейс | `src/components`, `src/features` | Дизайн-система, оболочка, разделы: обзор, двойник, сценарии, аналитика, 3D-тур, вход |

Стек: React 19 + TypeScript, Vite, Laravel 13 (PHP 8.3+), Tailwind CSS 4, React Router 7 (data router), React Flow 12, Recharts 3, Three.js + React Three Fiber + drei, Zustand, lucide-react, Vitest.

## 2.2. Компоненты

```mermaid
flowchart TB
  subgraph UI[Интерфейс]
    Login[LoginPage]
    Shell[AppShell: Sidebar · Topbar · MobileTabBar]
    Dash[Обзор]
    Twin[Цифровой двойник<br/>React Flow]
    Scen[Сценарии]
    Anal[Аналитика<br/>Recharts]
    Tour[3D-тур<br/>React Three Fiber]
  end

  subgraph State[Состояние]
    Auth[(useAuthStore)]
    Store[(useScenarioStore<br/>localStorage)]
    Toast[(useToastStore)]
  end

  subgraph Domain[Домен]
    Engine[simulate · summarize · queueProfile]
    Queue[queueing: G/G/c]
    Sens[resourceSensitivity]
    Metrics[METRICS · compareSummaries]
    Insights[buildInsights · describeChange]
  end

  Data[(data/demo<br/>enterprise · history · scenarios · tour)]
  API[[backend/: Laravel API<br/>users, sessions, scenarios, runs, audit_logs]]

  Login --> Auth
  Auth -->|/api/auth/*| API
  Store -->|/api/scenarios, /api/runs| API
  Shell --> Dash & Twin & Scen & Anal & Tour
  Scen --> Store
  Twin --> Store
  Tour --> Store
  Dash --> Store
  Dash & Twin & Scen & Anal & Tour --> Engine
  Engine --> Queue
  Sens --> Engine
  Insights --> Sens
  Scen --> Metrics & Insights
  Anal --> Sens & Metrics
  Engine --> Data
  Store --> Data
```

## 2.3. Интерфейсы домена

```ts
simulate(model: LineModel, params: ScenarioParams): SimulationResult   // расчёт линии
summarize(result): KpiSummary                                          // сводка для журнала и сравнения
queueProfile(result, stepHours): Array<{ hour; [stageId]: number }>    // очереди в течение суток
resourceSensitivity(model, params): SensitivityRow[]                   // ±1 ресурс по каждому участку
compareSummaries(base, alt, keys): MetricDelta[]                       // дельты с оценкой «лучше/хуже»
buildInsights(model, params, result): StageInsight[]                   // находки и рекомендации
describeChange(model, base, alt): Conclusion[]                         // текстовые выводы сравнения
```

Маршруты (состояние выбора хранится в URL, поэтому любое состояние можно открыть ссылкой):

| Путь | Параметры | Роль |
|---|---|---|
| `/login` | — | все |
| `/` | — | руководитель |
| `/twin` | `stage` — выбранный участок | руководитель |
| `/scenarios` | `id` — сценарий, `focus` — участок, `delta` — предложение ±1 ресурс | руководитель |
| `/analytics` | `scenario`, `stage` — фильтры | руководитель |
| `/tour` | `poi` — точка интереса или id участка | руководитель, гость |

## 2.4. Метод расчёта

Для каждого участка *i* с параметрами: ресурсы *c*, норма времени *t*, скорость *s*, готовность оборудования *A*:

- эффективное время операции `tₑ = t / (s · A)`;
- мощность `μ = c · 60 / tₑ` (шт/ч);
- поток идёт по маршруту: участок обрабатывает `min(λᵢ, μᵢ)`, на выход передаётся `обработано · выход годных`;
- загрузка `ρ = обработано / μ`, доля простоя `1 − ρ`;
- ожидание — аппроксимация Кингмана–Сакасегавы для G/G/c:
  `Wq = (ca² + cs²)/2 · ρ^(√(2(c+1)) − 1) / (c(1 − ρ)) · tₑ`,
  вариация выходящего потока передаётся следующему участку: `cd² = 1 + (1 − ρ²)(ca² − 1) + ρ²(cs² − 1)/√c`;
- при перегрузке (`λ > μ`) задел растёт со скоростью `λ − μ`, средняя дополнительная очередь за сутки `(λ − μ) · H / 2`;
- время цикла `CT = Σ(Wq + tₑ + транспорт)`; НЗП по закону Литтла `L = λ · W`;
- затраты: ресурсы `c · ставка` оплачиваются всё рабочее время, переменные — за обработанные изделия, материал — за запущенные; себестоимость = (операционные + материал) / выпуск годных.

Статусы участка: ρ ≥ 95 % или перегрузка — узкое место; 85–95 % — высокая загрузка (риск); < 50 % — недогрузка (простой); иначе норма. Пороги — в `src/config/app.ts`.

## 2.5. Последовательность: расчёт и сравнение сценария

```mermaid
sequenceDiagram
  actor U as Руководитель
  participant W as ScenarioWorkbench
  participant E as Движок (simulate)
  participant S as useScenarioStore
  participant R as ResultsPanel

  U->>W: Изменяет параметры (ресурсы, скорость, нагрузка…)
  W-->>R: Результат помечается «устарел»
  U->>W: Нажимает «Рассчитать»
  W->>E: simulate(model, draft)
  E-->>W: SimulationResult (≈0,1 мс)
  W->>S: recordRun(run) — журнал прогонов
  W->>R: Показать сравнение с базой
  R->>R: compareSummaries + describeChange
  U->>W: «Сохранить как новый»
  W->>S: createScenario(name, params)
  S-->>S: persist → localStorage
```

## 2.6. Последовательность: тур → процесс → метрика

```mermaid
sequenceDiagram
  actor U as Пользователь
  participant T as TourPage (3D)
  participant P as PoiPanel
  participant D as TwinPage
  participant A as AnalyticsPage

  U->>T: Клик по зоне или метке «У-03»
  T->>T: Камера облетает к ракурсу точки
  T->>P: Открыть точку интереса (?poi=machining)
  P->>P: Метрики участка из simulate(активный сценарий)
  U->>P: «Процесс»
  P->>D: /twin?stage=machining — паспорт участка на мнемосхеме
  U->>D: «Метрики»
  D->>A: /analytics?stage=machining — участок выделен на всех графиках
  U->>D: «В 3D»
  D->>T: /tour?poi=machining
```

## 2.7. Состояния

Жизненный цикл сценария в редакторе:

```mermaid
stateDiagram-v2
  state "Сохранён" as Saved
  state "Черновик" as Draft
  state "Рассчитан" as Calculated
  state "Удалён" as Deleted
  [*] --> Saved: открыть сценарий
  Saved --> Draft: изменить параметр
  Draft --> Saved: сбросить изменения
  Draft --> Calculated: рассчитать
  Calculated --> Draft: изменить параметр, результат устарел
  Calculated --> Saved: сохранить / сохранить как новый
  Saved --> Deleted: удалить и подтвердить
  Deleted --> [*]
  note right of Draft
    Уход со страницы или смена сценария
    требуют подтверждения
  end note
```

Статус участка (вычисляется после каждого расчёта):

```mermaid
stateDiagram-v2
  direction LR
  state "Недогрузка, ρ < 50 %" as Idle
  state "Норма, 50–85 %" as Normal
  state "Высокая загрузка, 85–95 %" as High
  state "Узкое место, ≥ 95 % или λ > μ" as Bottleneck
  Idle --> Normal: нагрузка ↑ или ресурсы ↓
  Normal --> High: нагрузка ↑ или ресурсы ↓
  High --> Bottleneck: нагрузка ↑ или готовность ↓
  Bottleneck --> High: +ресурс или скорость ↑
  High --> Normal: +ресурс или скорость ↑
  Normal --> Idle: нагрузка ↓ или +ресурс
```

## 2.8. Архитектура 3D-сцены

```mermaid
flowchart TB
  Canvas[Canvas · DPR 1–1,75 · тени только на ПК] --> Env[Освещение: hemisphere + directional · туман]
  Canvas --> Hall[Hall: пол, разметка, стены с воротами, колонны, транспортная полоса]
  Canvas --> Zones[Zones: 6 зон участков — кликабельные группы]
  Zones --> Z1[Приёмка: стеллажи, паллеты, погрузчик]
  Zones --> Z2[Подготовка: ленточные пилы, консольный стеллаж]
  Zones --> Z3[Механообработка: 4–8 ОЦ по сценарию, сигнальные колонны]
  Zones --> Z4[ОТК: стеклянная комната, КИМ]
  Zones --> Z5[Упаковка: рольганг, столы, обмотчик]
  Zones --> Z6[Отгрузка: паллеты, погрузчик, грузовик]
  Canvas --> Flow[FlowItems: instanced mesh, 18 изделий; скорость ∝ выпуску]
  Canvas --> Spots[Hotspots: HTML-кнопки точек интереса]
  Canvas --> Rig[CameraRig: CameraControls, облёт к ракурсу точки]
  Canvas --> Perf[PerformanceMonitor: снижение DPR]
```

Связь со сценарием: число обрабатывающих центров берётся из параметров активного сценария, цвет сигнальных колонн — из статуса участка, скорость потока изделий — из выпуска. Без WebGL тур переключается на 2D-план цеха с теми же точками интереса.

## 2.9. Авторизация и персональные данные

Сервер — Laravel 13 (`backend/`). Маршруты API находятся в группе `web`: серверная сессия и защита от CSRF работают стандартными средствами Laravel.

| Аспект | Решение |
|---|---|
| Регистрация | Открытая: логин (3–32 символа `a-z 0-9 . _ -`) и пароль (≥ 8 символов, буквы и цифры, без логина). Новый пользователь — «Гость экскурсии» |
| Роли | `manager` — все разделы и управление; `guest` — только 3D-тур. Middleware `role:manager`, роль читается из базы на каждом запросе |
| Пароли | bcrypt (`BCRYPT_ROUNDS=12`) |
| Сессия | Таблица `sessions`, зашифрованная httpOnly-cookie `twinline_session`, `SameSite=Lax`, `Secure` при `SESSION_SECURE_COOKIE=true`, 12 ч; новый идентификатор при входе |
| CSRF | Cookie `XSRF-TOKEN` → заголовок `X-XSRF-TOKEN` (клиент `src/lib/api.ts`) |
| Перебор | 5 неудачных попыток на «IP + логин» → 15 мин блокировки; регистрация ≤ 10/ч с IP; Timebox выравнивает время ответа |
| Входные данные | FormRequest: `RegisterRequest`, `PasswordChangeRequest`, `ScenarioRequest`, `RunRequest`; диапазоны — `config/twinline.php` |
| Заголовки | Глобальный middleware `SecurityHeaders`: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS по HTTPS, `no-store` для API |
| Журнал действий | Таблица `audit_logs`: входы и неудачные попытки, регистрации, роли, пароли, удаления, сброс данных |
| Защита от блокировки | Нельзя изменить свою роль, удалить себя и последнего руководителя |

API:

| Метод | Путь | Доступ | Назначение |
|---|---|---|---|
| POST | `/api/auth/register` | все | Регистрация и вход |
| POST | `/api/auth/login` | все | Вход |
| POST | `/api/auth/logout` | все | Выход |
| GET | `/api/auth/me` | вошедшие | Текущий пользователь |
| POST | `/api/auth/password` | вошедшие | Смена пароля |
| GET / PATCH / DELETE | `/api/users`, `/api/users/{id}` | руководитель | Пользователи и роли |
| GET / POST | `/api/scenarios` | руководитель | Сценарии и последние прогоны |
| PUT / DELETE | `/api/scenarios/{id}` | руководитель | Изменение и удаление сценария |
| POST | `/api/scenarios/reset` | руководитель | Сброс демо-сценариев |
| POST / DELETE | `/api/runs` | руководитель | Запись прогона, очистка журнала |
| GET | `/api/audit-log` | руководитель | Журнал действий |

**Расчёт** выполняется на клиенте (`src/domain/simulation`), сервер проверяет и хранит параметры сценариев и сводки прогонов. Интерфейс применяет изменения сразу, запрос уходит в фоне; при отказе сервера изменение откатывается с уведомлением.

**152-ФЗ.** Хранятся только логин, хеш пароля, роль и дата регистрации; в сессиях и журнале — IP-адрес (для безопасности). Для эксплуатации: HTTPS, размещение сервера в РФ, политика обработки данных, отключение демо-учёток (`TWINLINE_SEED_DEMO=false`).

## 2.10. Развёртывание

Разработка: `npm run dev` — Laravel (порт 8000) и Vite (порт 5173, проксирует `/api`). Эксплуатация: `npm run build` кладёт фронтенд в `backend/public/app`, Laravel отдаёт API и `index.html`, статику — nginx. Подробно — [`08-deployment.md`](08-deployment.md).
