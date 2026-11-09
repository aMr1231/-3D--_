<?php

/*
 * Настройки Twinline.
 * Участки и диапазоны параметров используются для серверной проверки сценариев:
 * клиенту нельзя доверять, даже если интерфейс ограничивает значения.
 */

return [

    // Создавать демо-учётки manager/demo и guest/tour при посеве базы (отключить в эксплуатации: TWINLINE_SEED_DEMO=false).
    'seed_demo' => env('TWINLINE_SEED_DEMO', true),

    // Идентификаторы участков линии (должны совпадать с src/data/demo/enterprise.ts).
    'stages' => ['receiving', 'preparation', 'machining', 'inspection', 'packaging', 'shipping'],

    // Допустимые диапазоны параметров сценария.
    'ranges' => [
        'loadPerHour' => [1, 100],
        'hoursPerDay' => [1, 24],
        'resources' => [1, 20],
        'opTimeMin' => [0.1, 120],
        'speedFactor' => [0.1, 3],
        'costPerHour' => [0, 100000],
    ],

    // Ограничения на попытки.
    'limits' => [
        'login_attempts' => 5,          // неудачных попыток на пару «IP + логин»
        'login_decay_seconds' => 900,   // блокировка 15 минут
        'register_attempts' => 10,      // регистраций с одного IP
        'register_decay_seconds' => 3600,
        'max_scenarios' => 200,
        'max_runs' => 500,
    ],

    // Живая смена (php artisan twinline:live): синтетический поток данных о работе линии.
    'live' => [
        'tick_seconds' => (float) env('TWINLINE_LIVE_TICK_SECONDS', 2),
        'minutes_per_tick' => 2,        // ускорение: 2 мин смены за шаг
        'day_start_minute' => 7 * 60,   // начало первой смены — 07:00
        'plan_per_hour' => 22,          // план выпуска, шт/ч
        'cache_store' => 'file',        // последний срез для новых клиентов (не база: пишется каждые 2 с)
        // Коэффициент готовности и выход годных — как в модели линии (src/data/demo/enterprise.ts).
        'stages' => [
            'receiving' => ['availability' => 0.95, 'yield' => 1, 'initial_queue' => 2],
            'preparation' => ['availability' => 0.92, 'yield' => 1, 'initial_queue' => 2],
            'machining' => ['availability' => 0.88, 'yield' => 1, 'initial_queue' => 6],
            'inspection' => ['availability' => 0.94, 'yield' => 0.97, 'initial_queue' => 2],
            'packaging' => ['availability' => 0.96, 'yield' => 1, 'initial_queue' => 1],
            'shipping' => ['availability' => 0.95, 'yield' => 1, 'initial_queue' => 0],
        ],
    ],
];
