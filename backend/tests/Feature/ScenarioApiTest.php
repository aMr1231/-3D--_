<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScenarioApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->actingAs(User::where('login', 'manager')->first());
    }

    private function payload(array $override = []): array
    {
        return array_replace_recursive([
            'id' => 'sc-test0001',
            'name' => 'Сценарий 1',
            'description' => 'Проверка',
            'params' => DatabaseSeeder::baseline(),
        ], $override);
    }

    private function summary(): array
    {
        return [
            'outputPerHour' => 22.31, 'outputPerDay' => 357, 'cycleTimeMin' => 135.7, 'avgUtilization' => 0.818,
            'constraintStageId' => 'machining', 'constraintUtilization' => 0.98, 'costPerUnit' => 5556,
            'operatingCostPerDay' => 805546, 'wip' => 51.9, 'shortfallPerDay' => 0, 'bottleneckCount' => 1,
        ];
    }

    public function test_список_содержит_демо_сценарии(): void
    {
        $this->getJson('/api/scenarios')->assertOk()->assertJsonCount(3, 'scenarios')->assertJsonPath('scenarios.0.kind', 'preset');
    }

    public function test_создание_изменение_удаление(): void
    {
        $this->postJson('/api/scenarios', $this->payload())->assertCreated()->assertJsonPath('scenario.kind', 'user');
        $this->putJson('/api/scenarios/sc-test0001', ['name' => 'Новое имя', 'description' => '', 'params' => DatabaseSeeder::baseline()])
            ->assertOk()->assertJsonPath('scenario.name', 'Новое имя');
        $this->deleteJson('/api/scenarios/sc-test0001')->assertNoContent();
        $this->assertDatabaseMissing('scenarios', ['id' => 'sc-test0001']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'scenario_deleted', 'subject' => 'Новое имя']);
    }

    public function test_параметры_проверяются_по_диапазонам(): void
    {
        $bad = [
            ['params' => ['loadPerHour' => -5]],
            ['params' => ['hoursPerDay' => 30]],
            ['params' => ['stages' => ['machining' => ['resources' => 0]]]],
            ['params' => ['stages' => ['inspection' => ['speedFactor' => 'быстро']]]],
            ['id' => '../etc/passwd'],
        ];
        foreach ($bad as $i => $override) {
            $this->postJson('/api/scenarios', $this->payload($override + ['id' => "sc-bad{$i}aaa"]))->assertStatus(422);
        }
        $missing = $this->payload();
        unset($missing['params']['stages']['shipping']);
        $this->postJson('/api/scenarios', $missing)->assertStatus(422);
    }

    public function test_лишние_поля_отбрасываются(): void
    {
        $payload = $this->payload();
        $payload['params']['stages']['machining']['injected'] = '<script>';
        $payload['params']['extra'] = 1;
        $this->postJson('/api/scenarios', $payload)->assertCreated();
        $params = $this->getJson('/api/scenarios')->json('scenarios.3.params');
        $this->assertArrayNotHasKey('extra', $params);
        $this->assertArrayNotHasKey('injected', $params['stages']['machining']);
    }

    public function test_журнал_прогонов(): void
    {
        $run = [
            'id' => 'run-test0001', 'scenarioId' => 'preset-cnc5', 'scenarioName' => '+1 ОЦ',
            'ranAt' => now()->toISOString(), 'durationMs' => 0.2,
            'summary' => $this->summary(), 'baselineSummary' => $this->summary(),
        ];
        $this->postJson('/api/runs', $run)->assertCreated();
        $this->getJson('/api/scenarios')->assertJsonCount(1, 'runs')->assertJsonPath('runs.0.scenarioId', 'preset-cnc5');
        $this->postJson('/api/runs', array_replace_recursive($run, ['id' => 'run-bad00001', 'summary' => ['outputPerDay' => 'много']]))->assertStatus(422);
    }

    public function test_сброс_демо_данных(): void
    {
        $this->postJson('/api/scenarios', $this->payload())->assertCreated();
        $this->postJson('/api/scenarios/reset')->assertOk()->assertJsonCount(3, 'scenarios');
    }

    public function test_гость_не_имеет_доступа_к_сценариям(): void
    {
        $this->actingAs(User::where('login', 'guest')->first())->getJson('/api/scenarios')->assertStatus(403);
    }
}
