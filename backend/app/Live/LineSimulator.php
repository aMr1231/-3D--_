<?php

namespace App\Live;

/**
 * Имитатор живой смены (синтетические данные — ERP/MES не подключаются).
 * Дискретный шаг по времени смены: случайные поступления заготовок, обработка на участках
 * с учётом исправных единиц оборудования, отказы и ремонты (по коэффициенту готовности), брак на ОТК.
 * Параметры линии — базовый сценарий; загрузка считается по доступному оборудованию за последний час.
 */
class LineSimulator
{
    private const SHIFT_MINUTES = 480;

    private const WINDOW_MINUTES = 60;

    private const MEAN_REPAIR_MINUTES = 12;

    /** @var array<string, array<string, mixed>> */
    private array $stages = [];

    private int $minute = 0;

    private int $produced = 0;

    private int $scrap = 0;

    private int $seq = 0;

    private int $eventSeq = 0;

    /** @var array<int, array<string, mixed>> */
    private array $events = [];

    /** @var array<int, array{0: int, 1: int}> выпуск по шагам: [минута, штук] */
    private array $outputLog = [];

    /**
     * @param  array  $params  параметры сценария (loadPerHour, hoursPerDay, stages)
     * @param  array  $config  config('twinline.live')
     */
    public function __construct(private array $params, private array $config, ?int $seed = null)
    {
        if ($seed !== null) {
            mt_srand($seed);
        }
        foreach ($config['stages'] as $id => $stage) {
            $p = $params['stages'][$id];
            $this->stages[$id] = [
                'units' => (int) $p['resources'],
                'opTime' => (float) $p['opTimeMin'],
                'speed' => (float) $p['speedFactor'],
                'availability' => (float) $stage['availability'],
                'yield' => (float) $stage['yield'],
                'queue' => (int) $stage['initial_queue'],   // ожидают обработки
                // Единицы оборудования: остаток работы над текущей деталью и минута окончания ремонта.
                'pool' => array_fill(0, (int) $p['resources'], ['remaining' => 0.0, 'downUntil' => null]),
                'log' => [],       // [минута, минуты работы, минуты доступности]
            ];
        }
    }

    /**
     * Прогрев: линия «уже работала» предыдущий час, поэтому загрузка и очереди с первого среза
     * установившиеся, а не нулевые. Счётчики смены и журнал событий после прогрева обнуляются.
     */
    public function warmUp(int $minutes): void
    {
        while ($this->minute < $minutes) {
            $this->tick();
        }
        $offset = $this->minute;
        foreach ($this->stages as &$s) {
            $s['log'] = array_map(fn ($e) => [$e[0] - $offset, $e[1], $e[2]], $s['log']);
            foreach ($s['pool'] as &$unit) {
                if ($unit['downUntil'] !== null) {
                    $unit['downUntil'] -= $offset;
                }
            }
            unset($unit);
        }
        unset($s);
        $this->outputLog = [];
        $this->minute = 0;
        $this->produced = 0;
        $this->scrap = 0;
        $this->events = [];
        $this->seq = 0;
    }

    public function minutesPerTick(): int
    {
        return (int) $this->config['minutes_per_tick'];
    }

    /** Один шаг: продвигает время смены и возвращает срез для клиентов. */
    public function tick(): array
    {
        $dt = $this->minutesPerTick();
        $dayMinutes = (int) $this->params['hoursPerDay'] * 60;
        $before = $this->minute;
        $this->minute += $dt;
        if ($this->minute >= $dayMinutes) {
            $this->minute -= $dayMinutes;
            foreach ($this->stages as &$s) {
                $s['log'] = [];
            }
            unset($s);
        }
        if (intdiv($before, self::SHIFT_MINUTES) !== intdiv($this->minute, self::SHIFT_MINUTES)) {
            $this->produced = 0;
            $this->scrap = 0;
            $this->outputLog = [];
            $this->event(['type' => 'shift', 'shift' => $this->shift()]);
        }

        $this->repairsAndFailures($dt);

        $inflow = $this->poisson((float) $this->params['loadPerHour'] / 60 * $dt);
        $ids = array_keys($this->stages);
        foreach ($ids as $i => $id) {
            $s = &$this->stages[$id];
            $s['queue'] += $inflow;
            $done = 0;
            $busy = 0.0;
            $available = 0.0;
            // Каждая исправная единица работает свои $dt минут: берёт деталь из очереди и обрабатывает её.
            foreach ($s['pool'] as &$unit) {
                if ($unit['downUntil'] !== null) {
                    continue;
                }
                $available += $dt;
                $budget = (float) $dt;
                while ($budget > 1e-9) {
                    if ($unit['remaining'] <= 0) {
                        if ($s['queue'] <= 0) {
                            break;
                        }
                        $s['queue']--;
                        $unit['remaining'] = $s['opTime'] / $s['speed'] * (0.85 + 0.3 * $this->random());
                    }
                    $use = min($budget, $unit['remaining']);
                    $unit['remaining'] -= $use;
                    $budget -= $use;
                    $busy += $use;
                    if ($unit['remaining'] <= 1e-9) {
                        $unit['remaining'] = 0.0;
                        $done++;
                    }
                }
            }
            unset($unit);
            $s['log'][] = [$this->minute, $busy, $available];

            $good = $s['yield'] < 1 ? $this->binomial($done, $s['yield']) : $done;
            $this->scrap += $done - $good;
            $inflow = $good;
            if ($i === count($ids) - 1) {
                $this->produced += $done;
                $this->outputLog[] = [$this->minute, $done];
            }
            unset($s);
        }

        return $this->snapshot();
    }

    public function snapshot(): array
    {
        $shiftMinute = $this->minute % self::SHIFT_MINUTES;
        $since = $this->minute - self::WINDOW_MINUTES;
        $this->outputLog = array_values(array_filter($this->outputLog, fn ($e) => $e[0] > $since));
        $window = min(self::WINDOW_MINUTES, max($this->minutesPerTick(), $shiftMinute));
        $recent = array_sum(array_column($this->outputLog, 1));

        $stages = [];
        foreach ($this->stages as $id => &$s) {
            $s['log'] = array_values(array_filter($s['log'], fn ($e) => $e[0] > $since));
            $available = array_sum(array_column($s['log'], 2));
            $inWork = count(array_filter($s['pool'], fn ($u) => $u['remaining'] > 0));
            $stages[] = [
                'id' => $id,
                'queue' => $s['queue'],
                'inWork' => $inWork,
                'units' => $s['units'],
                'up' => count(array_filter($s['pool'], fn ($u) => $u['downUntil'] === null)),
                'utilization' => $available > 0 ? round(array_sum(array_column($s['log'], 1)) / $available, 3) : 0,
            ];
        }
        unset($s);

        return [
            'seq' => ++$this->seq,
            'at' => now()->toISOString(),
            'clock' => $this->clock(),
            'shift' => $this->shift(),
            'shiftMinute' => $shiftMinute,
            'shiftLength' => self::SHIFT_MINUTES,
            'minutesPerTick' => $this->minutesPerTick(),
            'produced' => $this->produced,
            'plan' => (int) round($this->config['plan_per_hour'] * $shiftMinute / 60),
            'scrap' => $this->scrap,
            'ratePerHour' => $window > 0 ? round($recent * 60 / $window, 1) : 0,
            'wip' => array_sum(array_column($stages, 'queue')) + array_sum(array_column($stages, 'inWork')),
            'stages' => $stages,
            'events' => array_slice($this->events, 0, 12),
        ];
    }

    private function shift(): int
    {
        return intdiv($this->minute, self::SHIFT_MINUTES) + 1;
    }

    private function clock(): string
    {
        $clock = (int) $this->config['day_start_minute'] + $this->minute;

        return sprintf('%02d:%02d', intdiv($clock, 60) % 24, $clock % 60);
    }

    private function repairsAndFailures(int $dt): void
    {
        foreach ($this->stages as $id => &$s) {
            foreach ($s['pool'] as $n => &$unit) {
                if ($unit['downUntil'] !== null && $unit['downUntil'] <= $this->minute) {
                    $unit['downUntil'] = null;
                    $this->event(['type' => 'up', 'stageId' => $id, 'unit' => $n + 1]);
                }
            }
            unset($unit);
            if ($s['availability'] >= 0.999) {
                continue;
            }
            // Готовность A = MTBF / (MTBF + MTTR) → средняя наработка на отказ при среднем ремонте 12 мин.
            $mtbf = $s['availability'] / (1 - $s['availability']) * self::MEAN_REPAIR_MINUTES;
            foreach ($s['pool'] as $n => &$unit) {
                $up = count(array_filter($s['pool'], fn ($u) => $u['downUntil'] === null));
                // Последняя исправная единица не отказывает, чтобы участок не вставал целиком.
                if ($unit['downUntil'] !== null || $up <= 1) {
                    continue;
                }
                if ($this->random() < $dt / $mtbf) {
                    $repair = 6 + (int) round($this->random() * 2 * (self::MEAN_REPAIR_MINUTES - 6));
                    $unit['downUntil'] = $this->minute + $repair;
                    $this->event(['type' => 'down', 'stageId' => $id, 'unit' => $n + 1, 'minutes' => $repair]);
                }
            }
            unset($unit);
        }
        unset($s);
    }

    private function event(array $data): void
    {
        array_unshift($this->events, ['id' => ++$this->eventSeq, 'clock' => $this->clock()] + $data);
        $this->events = array_slice($this->events, 0, 30);
    }

    private function random(): float
    {
        return mt_rand() / mt_getrandmax();
    }

    private function poisson(float $lambda): int
    {
        $limit = exp(-$lambda);
        $k = 0;
        $p = 1.0;
        do {
            $k++;
            $p *= $this->random();
        } while ($p > $limit);

        return $k - 1;
    }

    private function binomial(int $n, float $p): int
    {
        $k = 0;
        for ($i = 0; $i < $n; $i++) {
            if ($this->random() < $p) {
                $k++;
            }
        }

        return $k;
    }
}
