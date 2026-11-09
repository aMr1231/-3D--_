<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Сценарий: название, описание и параметры линии. Каждый параметр проверяется по диапазону
 * из config/twinline.php, лишние участки и поля отбрасываются.
 */
class ScenarioRequest extends FormRequest
{
    public function rules(): array
    {
        $r = config('twinline.ranges');
        $creating = $this->isMethod('post');
        $rules = [
            'id' => [$creating ? 'required' : 'prohibited', 'string', 'regex:/^[a-z0-9][a-z0-9-]{2,39}$/', 'unique:scenarios,id'],
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:240'],
            'params' => ['required', 'array'],
            'params.loadPerHour' => ['required', 'numeric', "between:{$r['loadPerHour'][0]},{$r['loadPerHour'][1]}"],
            'params.hoursPerDay' => ['required', 'integer', "between:{$r['hoursPerDay'][0]},{$r['hoursPerDay'][1]}"],
            'params.stages' => ['required', 'array'],
        ];
        foreach (config('twinline.stages') as $stage) {
            $p = "params.stages.$stage";
            $rules[$p] = ['required', 'array'];
            $rules["$p.resources"] = ['required', 'integer', "between:{$r['resources'][0]},{$r['resources'][1]}"];
            $rules["$p.opTimeMin"] = ['required', 'numeric', "between:{$r['opTimeMin'][0]},{$r['opTimeMin'][1]}"];
            $rules["$p.speedFactor"] = ['required', 'numeric', "between:{$r['speedFactor'][0]},{$r['speedFactor'][1]}"];
            $rules["$p.costPerHour"] = ['required', 'numeric', "between:{$r['costPerHour'][0]},{$r['costPerHour'][1]}"];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'id.regex' => 'Некорректный идентификатор сценария.',
            'id.unique' => 'Сценарий с таким идентификатором уже существует.',
            'name.required' => 'Укажите название сценария.',
            'name.max' => 'Название — не более 80 символов.',
            'description.max' => 'Описание — не более 240 символов.',
            'params.*' => 'Некорректные параметры сценария.',
            'params.*.*' => 'Параметр вне допустимого диапазона.',
            'params.*.*.*' => 'Параметр участка вне допустимого диапазона.',
            'params.*.*.*.*' => 'Параметр участка вне допустимого диапазона.',
        ];
    }

    /** Только проверенные поля, приведённые к числам (лишнее отбрасывается). */
    public function cleanParams(): array
    {
        $p = $this->validated('params');
        $stages = [];
        foreach (config('twinline.stages') as $stage) {
            $s = $p['stages'][$stage];
            $stages[$stage] = [
                'resources' => (int) $s['resources'],
                'opTimeMin' => (float) $s['opTimeMin'],
                'speedFactor' => (float) $s['speedFactor'],
                'costPerHour' => (float) $s['costPerHour'],
            ];
        }

        return ['loadPerHour' => (float) $p['loadPerHour'], 'hoursPerDay' => (int) $p['hoursPerDay'], 'stages' => $stages];
    }
}
