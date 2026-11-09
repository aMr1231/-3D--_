<?php

namespace Database\Seeders;

use App\Models\Scenario;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Посев демонстрационных данных: демо-учётки для жюри и предустановленные сценарии.
 * Повторный запуск безопасен (updateOrCreate / firstOrCreate).
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (config('twinline.seed_demo')) {
            // Демо-пароли короче парольной политики — они задаются только здесь и отключаются в эксплуатации.
            User::firstOrCreate(['login' => 'manager'], ['role' => 'manager', 'password' => 'demo']);
            User::firstOrCreate(['login' => 'guest'], ['role' => 'guest', 'password' => 'tour']);
        }

        foreach (self::presets() as $preset) {
            Scenario::firstOrCreate(['id' => $preset['id']], $preset);
        }
    }

    /** Базовые параметры линии — совпадают с BASELINE_PARAMS во фронтенде (src/data/demo/enterprise.ts). */
    public static function baseline(): array
    {
        return [
            'loadPerHour' => 23,
            'hoursPerDay' => 16,
            'stages' => [
                'receiving' => ['resources' => 2, 'opTimeMin' => 4.0, 'speedFactor' => 1, 'costPerHour' => 950],
                'preparation' => ['resources' => 2, 'opTimeMin' => 4.0, 'speedFactor' => 1, 'costPerHour' => 1750],
                'machining' => ['resources' => 4, 'opTimeMin' => 9.0, 'speedFactor' => 1, 'costPerHour' => 4300],
                'inspection' => ['resources' => 2, 'opTimeMin' => 4.5, 'speedFactor' => 1, 'costPerHour' => 2600],
                'packaging' => ['resources' => 2, 'opTimeMin' => 2.5, 'speedFactor' => 1, 'costPerHour' => 880],
                'shipping' => ['resources' => 1, 'opTimeMin' => 1.6, 'speedFactor' => 1, 'costPerHour' => 1500],
            ],
        ];
    }

    /** Демонстрационные сценарии (как PRESET_SCENARIOS во фронтенде). */
    public static function presets(): array
    {
        $base = self::baseline();
        $with = function (array $params, array $patch): array {
            foreach ($patch as $stage => $values) {
                $params['stages'][$stage] = array_merge($params['stages'][$stage], $values);
            }

            return $params;
        };
        $peak = array_merge($base, ['loadPerHour' => 26.5]);

        return [
            [
                'id' => 'preset-cnc5',
                'name' => '+1 обрабатывающий центр',
                'description' => 'Ввод пятого ОЦ на механическом участке при текущей нагрузке.',
                'kind' => 'preset',
                'params' => $with($base, ['machining' => ['resources' => 5]]),
            ],
            [
                'id' => 'preset-peak',
                'name' => 'Пиковая нагрузка +15 %',
                'description' => 'Новый контракт: запуск 26,5 заготовки в час без изменения ресурсов.',
                'kind' => 'preset',
                'params' => $peak,
            ],
            [
                'id' => 'preset-peak-plan',
                'name' => 'Пик: ОЦ-5 и ускорение ОТК',
                'description' => 'Комплекс мер под новый контракт: пятый ОЦ, оптимизированные программы измерений КИМ (+20 %), новое полотно пил (+15 %).',
                'kind' => 'preset',
                'params' => $with($peak, [
                    'machining' => ['resources' => 5],
                    'inspection' => ['speedFactor' => 1.2],
                    'preparation' => ['speedFactor' => 1.15],
                ]),
            ],
        ];
    }
}
