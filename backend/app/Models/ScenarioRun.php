<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Прогон сценария: сводка показателей, рассчитанная моделью линии на клиенте.
 *
 * @property string $id
 */
#[Fillable(['id', 'scenario_id', 'scenario_name', 'ran_at', 'duration_ms', 'summary', 'baseline_summary', 'user_id'])]
class ScenarioRun extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'ran_at' => 'datetime',
            'duration_ms' => 'float',
            'summary' => 'array',
            'baseline_summary' => 'array',
        ];
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'scenarioId' => $this->scenario_id,
            'scenarioName' => $this->scenario_name,
            'ranAt' => $this->ran_at->toISOString(),
            'durationMs' => $this->duration_ms,
            'summary' => $this->summary,
            'baselineSummary' => $this->baseline_summary,
        ];
    }
}
