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
];
