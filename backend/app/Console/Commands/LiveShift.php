<?php

namespace App\Console\Commands;

use App\Events\LiveTick;
use App\Live\LineSimulator;
use App\Support\Realtime;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Поток живой смены: каждые N секунд — шаг имитатора и рассылка среза через Reverb.
 * Последний срез хранится в кеше, чтобы новый клиент сразу получил текущее состояние (GET /api/live).
 */
class LiveShift extends Command
{
    protected $signature = 'twinline:live {--ticks=0 : остановиться после N шагов (0 — бесконечно)} {--seed= : зерно случайных чисел}';

    protected $description = 'Имитация живой смены и рассылка состояния линии в реальном времени';

    public function handle(): int
    {
        $config = config('twinline.live');
        $seed = $this->option('seed');
        $simulator = new LineSimulator(DatabaseSeeder::baseline(), $config, $seed !== null ? (int) $seed : null);
        $simulator->warmUp(60);
        $ticks = (int) $this->option('ticks');
        $interval = (float) $config['tick_seconds'];

        $this->components->info(sprintf(
            'Живая смена: шаг %s с = %d мин смены. Остановить — Ctrl+C.',
            $interval,
            $simulator->minutesPerTick(),
        ));

        for ($n = 1; ; $n++) {
            $snapshot = $simulator->tick();
            Cache::store($config['cache_store'])->put('twinline.live', $snapshot, now()->addSeconds((int) max(10, $interval * 5)));
            Realtime::send(new LiveTick($snapshot), toOthers: false);
            if ($ticks > 0 && $n >= $ticks) {
                break;
            }
            usleep((int) ($interval * 1_000_000));
        }

        return self::SUCCESS;
    }
}
