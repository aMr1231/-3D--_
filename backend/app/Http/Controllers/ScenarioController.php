<?php

namespace App\Http\Controllers;

use App\Events\ScenariosChanged;
use App\Http\Requests\RunRequest;
use App\Http\Requests\ScenarioRequest;
use App\Models\AuditLog;
use App\Models\Scenario;
use App\Models\ScenarioRun;
use App\Support\Realtime;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * Сценарии и журнал прогонов — общее рабочее пространство руководителей.
 * Расчёт модели выполняется на клиенте; сервер проверяет и хранит параметры и сводки.
 */
class ScenarioController extends Controller
{
    public function index(): JsonResponse
    {
        $scenarios = Scenario::query()->orderBy('created_at')->orderBy('id')->get()->map->toApi();
        $runs = ScenarioRun::query()->orderByDesc('ran_at')->limit(30)->get()->map->toApi();

        return response()->json(['scenarios' => $scenarios, 'runs' => $runs]);
    }

    public function store(ScenarioRequest $request): JsonResponse
    {
        if (Scenario::query()->count() >= config('twinline.limits.max_scenarios')) {
            return response()->json(['message' => 'Достигнуто максимальное число сценариев.'], 422);
        }
        $scenario = Scenario::create([
            'id' => $request->validated('id'),
            'name' => $request->validated('name'),
            'description' => (string) $request->validated('description'),
            'kind' => 'user',
            'params' => $request->cleanParams(),
            'created_by' => $request->user()->id,
        ]);
        AuditLog::record($request, 'scenario_created', $scenario->name);
        $this->notify($request, 'scenario', 'created', $scenario->name);

        return response()->json(['scenario' => $scenario->toApi()], 201);
    }

    public function update(ScenarioRequest $request, Scenario $scenario): JsonResponse
    {
        $scenario->update([
            'name' => $request->validated('name'),
            'description' => (string) $request->validated('description'),
            'params' => $request->cleanParams(),
        ]);
        $this->notify($request, 'scenario', 'updated', $scenario->name);

        return response()->json(['scenario' => $scenario->toApi()]);
    }

    public function destroy(Request $request, Scenario $scenario): Response
    {
        $name = $scenario->name;
        $scenario->delete();
        AuditLog::record($request, 'scenario_deleted', $name);
        $this->notify($request, 'scenario', 'deleted', $name);

        return response()->noContent();
    }

    /** Сброс демо-данных: удаляются все сценарии и прогоны, демонстрационные сценарии создаются заново. */
    public function reset(Request $request): JsonResponse
    {
        DB::transaction(function () {
            ScenarioRun::query()->delete();
            Scenario::query()->delete();
            foreach (DatabaseSeeder::presets() as $preset) {
                Scenario::create($preset);
            }
        });
        AuditLog::record($request, 'scenarios_reset');
        $this->notify($request, 'scenario', 'reset');

        return $this->index();
    }

    public function storeRun(RunRequest $request): JsonResponse
    {
        $run = ScenarioRun::create([
            'id' => $request->validated('id'),
            'scenario_id' => $request->validated('scenarioId'),
            'scenario_name' => $request->validated('scenarioName'),
            'ran_at' => now(),
            'duration_ms' => (float) $request->validated('durationMs'),
            'summary' => $request->cleanSummary('summary'),
            'baseline_summary' => $request->cleanSummary('baselineSummary'),
            'user_id' => $request->user()->id,
        ]);

        // Журнал ограничен: старые прогоны удаляются.
        $max = config('twinline.limits.max_runs');
        $stale = ScenarioRun::query()->orderByDesc('ran_at')->skip($max)->limit(1000000)->pluck('id');
        if ($stale->isNotEmpty()) {
            ScenarioRun::query()->whereIn('id', $stale)->delete();
        }

        $this->notify($request, 'runs', 'recorded', $run->scenario_name);

        return response()->json(['run' => $run->toApi()], 201);
    }

    public function clearRuns(Request $request): Response
    {
        ScenarioRun::query()->delete();
        AuditLog::record($request, 'runs_cleared');
        $this->notify($request, 'runs', 'cleared');

        return response()->noContent();
    }

    /** Другим руководителям — сигнал перечитать сценарии (себе не отправляется: X-Socket-ID). */
    private function notify(Request $request, string $kind, string $action, ?string $name = null): void
    {
        Realtime::send(new ScenariosChanged($kind, $action, $name, $request->user()?->login));
    }
}
