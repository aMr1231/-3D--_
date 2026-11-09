<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Прогон сценария: сводка показателей. Принимаются только известные числовые поля.
 */
class RunRequest extends FormRequest
{
    /** Поля сводки KpiSummary (src/domain/types.ts). */
    public const NUMERIC = [
        'outputPerHour', 'outputPerDay', 'cycleTimeMin', 'avgUtilization', 'constraintUtilization',
        'costPerUnit', 'operatingCostPerDay', 'wip', 'shortfallPerDay', 'bottleneckCount',
    ];

    public function rules(): array
    {
        $rules = [
            'id' => ['required', 'string', 'regex:/^[a-z0-9][a-z0-9-]{2,39}$/', 'unique:scenario_runs,id'],
            'scenarioId' => ['required', 'string', 'max:40'],
            'scenarioName' => ['required', 'string', 'max:100'],
            'ranAt' => ['required', 'date'],
            'durationMs' => ['required', 'numeric', 'between:0,60000'],
            'summary.constraintStageId' => ['required', 'string', 'in:'.implode(',', config('twinline.stages'))],
            'baselineSummary.constraintStageId' => ['required', 'string', 'in:'.implode(',', config('twinline.stages'))],
        ];
        foreach (['summary', 'baselineSummary'] as $group) {
            $rules[$group] = ['required', 'array'];
            foreach (self::NUMERIC as $field) {
                $rules["$group.$field"] = ['required', 'numeric', 'between:-1000000000,1000000000'];
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return ['*' => 'Некорректные данные прогона.'];
    }

    public function cleanSummary(string $group): array
    {
        $s = $this->validated($group);
        $out = ['constraintStageId' => $s['constraintStageId']];
        foreach (self::NUMERIC as $field) {
            $out[$field] = (float) $s[$field];
        }

        return $out;
    }
}
