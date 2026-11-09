# 3. Модель данных

Прототип хранит справочные данные в коде (`src/data/demo`), а пользовательские сценарии и журнал прогонов — в `localStorage`. Ниже — целевая модель БД, на которую ложатся текущие TypeScript-типы (`src/domain/types.ts`). Названия таблиц и полей совпадают с именами в коде.

## 3.1. Сущности и атрибуты

**ENTERPRISE — предприятие**

| Поле | Тип | Описание |
|---|---|---|
| id | string, PK | Идентификатор |
| name, short_name | string | Название |
| site | string | Цех / линия |
| product_name, product_unit | string | Изделие и единица учёта |
| material_cost_per_unit | decimal | Стоимость заготовки, ₽ |
| shifts_per_day, hours_per_shift | int | Режим работы |

**STAGE — участок (этап процесса)**

| Поле | Тип | Описание |
|---|---|---|
| id | string, PK | `receiving`, `preparation`, `machining`… |
| enterprise_id | FK → ENTERPRISE | |
| seq | int | Порядок в маршруте изделия |
| code | string | Код на мнемосхеме (У-01…) |
| name, short_name, description, area | string | Паспорт участка |
| availability | decimal 0..1 | Готовность оборудования |
| yield_rate | decimal 0..1 | Доля годных на выходе |
| variable_cost_per_unit | decimal | Переменные затраты, ₽/шт |
| transport_min_to_next | decimal | Транспорт до следующего участка, мин |
| service_cv2 | decimal | Квадрат коэффициента вариации обработки |

**RESOURCE — единица оборудования / персонала**

| Поле | Тип | Описание |
|---|---|---|
| id | string, PK | |
| stage_id | FK → STAGE | |
| name | string | «ОЦ-3», «КИМ» |
| kind | string | Тип ресурса |

**PROCESS_EDGE — связь этапов**

| Поле | Тип | Описание |
|---|---|---|
| from_stage_id, to_stage_id | FK → STAGE | Направление потока |
| kind | enum | `flow` / `scrap` |

**SCENARIO — сценарий**

| Поле | Тип | Описание |
|---|---|---|
| id | string, PK | |
| name, description | string | |
| kind | enum | `baseline` / `preset` / `user` |
| load_per_hour | decimal | Производственная нагрузка, шт/ч |
| hours_per_day | int | Рабочих часов в сутки |
| created_at, updated_at | timestamp | |

**SCENARIO_STAGE_PARAM — параметры участка в сценарии**

| Поле | Тип | Описание |
|---|---|---|
| scenario_id | FK → SCENARIO, PK | |
| stage_id | FK → STAGE, PK | |
| resources | int | Количество ресурсов |
| op_time_min | decimal | Норма времени операции |
| speed_factor | decimal | Скорость относительно нормы |
| cost_per_hour | decimal | Стоимость часа ресурса |

**SIMULATION_RUN — прогон сценария**

| Поле | Тип | Описание |
|---|---|---|
| id | string, PK | |
| scenario_id | FK → SCENARIO | |
| ran_at | timestamp | |
| duration_ms | decimal | Время расчёта |

**RUN_METRIC — значение метрики прогона**

| Поле | Тип | Описание |
|---|---|---|
| run_id | FK → SIMULATION_RUN | |
| stage_id | FK → STAGE, null | null — показатель линии |
| metric_key | string | `cycleTimeMin`, `outputPerDay`, `utilization`… |
| value | decimal | |

**HISTORY_DAY — входные данные истории**: дата, нагрузка, готовность оборудования по участкам, событие. Показатели истории рассчитываются движком.

**TOUR_ROUTE / TOUR_STOP / POI / PRACTICE_CASE / MEDIA** — объекты 3D-тура: маршрут, порядок остановок, точка интереса (якорь, ракурс камеры, связанный участок, список метрик), кейс лучшей практики (метрика «до/после»), медиа (изображения/видео, необязательно).

**USERS** (реализовано, миграции `backend/database/migrations`): `id`, `login` (уникальный), `role` (`manager` / `guest`), `password` (bcrypt), `created_at`.

**SESSIONS** (реализовано, стандартная таблица Laravel): `id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`.

**SCENARIOS**, **SCENARIO_RUNS**, **AUDIT_LOGS** (реализовано): сценарии с параметрами в JSON, прогоны со сводками, журнал действий безопасности.

ФИО, e-mail и телефоны не хранятся.

## 3.2. ER-диаграмма

```mermaid
erDiagram
  ENTERPRISE ||--o{ STAGE : "состоит из"
  STAGE ||--o{ RESOURCE : "использует"
  STAGE ||--o{ PROCESS_EDGE : "из"
  STAGE ||--o{ PROCESS_EDGE : "в"
  ENTERPRISE ||--o{ SCENARIO : "моделируется"
  SCENARIO ||--|{ SCENARIO_STAGE_PARAM : "задаёт"
  STAGE ||--o{ SCENARIO_STAGE_PARAM : "параметризуется"
  SCENARIO ||--o{ SIMULATION_RUN : "прогоняется"
  SIMULATION_RUN ||--|{ RUN_METRIC : "даёт"
  STAGE ||--o{ RUN_METRIC : "относится"
  ENTERPRISE ||--o{ HISTORY_DAY : "история"
  TOUR_ROUTE ||--|{ TOUR_STOP : "включает"
  POI ||--o{ TOUR_STOP : "посещается"
  STAGE |o--o{ POI : "показывается"
  POI ||--o| PRACTICE_CASE : "иллюстрирует"
  POI ||--o{ MEDIA : "содержит"
  ROLE ||--o{ USER : "назначена"
  USER ||--o{ SESSION : "входит"
  USER ||--o{ SCENARIO : "автор"

  ENTERPRISE {
    string id PK
    string name
    decimal material_cost_per_unit
    int shifts_per_day
    int hours_per_shift
  }
  STAGE {
    string id PK
    string enterprise_id FK
    int seq
    string code
    decimal availability
    decimal yield_rate
    decimal variable_cost_per_unit
    decimal transport_min_to_next
  }
  RESOURCE {
    string id PK
    string stage_id FK
    string name
  }
  PROCESS_EDGE {
    string from_stage_id FK
    string to_stage_id FK
    string kind
  }
  SCENARIO {
    string id PK
    string name
    string kind
    decimal load_per_hour
    int hours_per_day
  }
  SCENARIO_STAGE_PARAM {
    string scenario_id FK
    string stage_id FK
    int resources
    decimal op_time_min
    decimal speed_factor
    decimal cost_per_hour
  }
  SIMULATION_RUN {
    string id PK
    string scenario_id FK
    datetime ran_at
    decimal duration_ms
  }
  RUN_METRIC {
    string run_id FK
    string stage_id FK
    string metric_key
    decimal value
  }
  HISTORY_DAY {
    date day PK
    decimal load_per_hour
    decimal machining_availability
    string event
  }
  POI {
    string id PK
    string stage_id FK
    string title
    string anchor_xyz
    string camera_view
  }
  PRACTICE_CASE {
    string id PK
    string poi_id FK
    string metric_label
    decimal before_value
    decimal after_value
  }
  TOUR_ROUTE {
    string id PK
    string name
  }
  TOUR_STOP {
    string route_id FK
    string poi_id FK
    int seq
  }
  MEDIA {
    string id PK
    string poi_id FK
    string src
    string alt
  }
  USER {
    int id PK
    string login
    string role_id FK
    string password_hash
    datetime created_at
  }
  SESSION {
    string token_hash PK
    int user_id FK
    datetime expires_at
  }
  ROLE {
    string id PK
    string label
  }
```

## 3.3. UML-диаграмма классов (домен)

```mermaid
classDiagram
  class StageDefinition {
    +id: string
    +code: string
    +name: string
    +availability: number
    +yieldRate: number
    +variableCostPerUnit: number
    +transportMinToNext: number
  }
  class StageParams {
    +resources: number
    +opTimeMin: number
    +speedFactor: number
    +costPerHour: number
  }
  class ScenarioParams {
    +loadPerHour: number
    +hoursPerDay: number
    +stages: StageParams[]
  }
  class Scenario {
    +id: string
    +name: string
    +kind: ScenarioKind
    +params: ScenarioParams
  }
  class SimulationResult {
    +outputPerDay: number
    +cycleTimeMin: number
    +avgUtilization: number
    +costPerUnit: number
    +constraintStageId: string
    +stages: StageResult[]
  }
  class StageResult {
    +capacityPerHour: number
    +utilization: number
    +waitMin: number
    +queueLength: number
    +status: StageStatus
    +costPerUnit: number
  }
  class PointOfInterest {
    +id: string
    +stageId: string
    +view: CameraView
    +metrics: PoiMetricKey[]
  }
  class PracticeCase {
    +title: string
    +metric: MetricChange
  }
  Scenario *-- ScenarioParams
  ScenarioParams *-- StageParams
  SimulationResult *-- StageResult
  StageResult ..> StageDefinition : stageId
  PointOfInterest ..> StageDefinition : stageId
  PointOfInterest o-- PracticeCase
  Scenario ..> SimulationResult : simulate()
```

## 3.4. Наборы данных для обмена

Сценарий (формат API `/api/scenarios`, хранение — таблица `scenarios`):

```json
{
  "id": "sc-4f1a2b3c",
  "name": "Сценарий 1",
  "description": "Пятый ОЦ и ускорение КИМ",
  "kind": "user",
  "params": {
    "loadPerHour": 26.5,
    "hoursPerDay": 16,
    "stages": {
      "machining": { "resources": 5, "opTimeMin": 9, "speedFactor": 1, "costPerHour": 4300 },
      "inspection": { "resources": 2, "opTimeMin": 4.5, "speedFactor": 1.2, "costPerHour": 2600 }
    }
  },
  "createdAt": "2026-11-08T10:00:00.000Z",
  "updatedAt": "2026-11-08T10:05:00.000Z"
}
```

Сервер проверяет параметры по диапазонам (`backend/config/twinline.php`), клиент дополнительно проверяет ответ сервера; базовый сценарий всегда берётся из кода.

## 3.5. Как заменить демо-данные реальными

1. `src/data/demo/enterprise.ts` — предприятие, участки (`STAGES`) и текущие параметры (`BASELINE_PARAMS`).
2. `src/data/demo/history.ts` — фактические ряды нагрузки и готовности оборудования (показатели посчитает движок) или готовые фактические метрики.
3. `src/data/demo/tour.ts` — планировка зон, точки интереса, ракурсы, кейсы, медиа.
4. Типы в `src/domain/types.ts` — контракт; компоненты интерфейса правок не требуют.
