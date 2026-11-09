<?php

namespace Tests\Feature;

use App\Events\AuditRecorded;
use App\Events\ScenariosChanged;
use App\Events\UserChanged;
use App\Live\LineSimulator;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RealtimeTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private User $guest;

    protected function setUp(): void
    {
        parent::setUp();
        $this->manager = User::create(['login' => 'boss', 'role' => 'manager', 'password' => 'secret123']);
        $this->guest = User::create(['login' => 'visitor', 'role' => 'guest', 'password' => 'secret123']);
    }

    /** Включает Reverb с тестовыми ключами; сервер не нужен — подпись подписки считается локально. */
    private function enableReverb(): void
    {
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test',
            'broadcasting.connections.reverb.options.host' => '127.0.0.1',
            'broadcasting.connections.reverb.options.port' => 1,
            'broadcasting.connections.reverb.options.scheme' => 'http',
            'broadcasting.connections.reverb.options.useTLS' => false,
        ]);
        app(BroadcastManager::class)->purge();
        require base_path('routes/channels.php');
    }

    private function authorize(User $user, string $channel)
    {
        return $this->actingAs($user)->postJson('/api/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => $channel]);
    }

    public function test_realtime_config_for_signed_in_users(): void
    {
        $this->getJson('/api/realtime')->assertUnauthorized();
        $this->actingAs($this->guest)->getJson('/api/realtime')->assertOk()->assertJson(['realtime' => null]);

        $this->enableReverb();
        $this->actingAs($this->guest)->getJson('/api/realtime')
            ->assertOk()
            ->assertJson(['realtime' => ['key' => 'test-key', 'host' => '127.0.0.1', 'port' => 1, 'scheme' => 'http']])
            ->assertJsonMissingPath('realtime.secret');
    }

    public function test_presence_channel_only_for_managers(): void
    {
        $this->enableReverb();
        $this->authorize($this->manager, 'presence-twinline.managers')
            ->assertOk()
            ->assertJsonStructure(['auth', 'channel_data']);
        $data = json_decode($this->authorize($this->manager, 'presence-twinline.managers')->json('channel_data'), true);
        $this->assertSame(['id' => $this->manager->id, 'login' => 'boss'], $data['user_info']);

        $this->authorize($this->guest, 'presence-twinline.managers')->assertForbidden();
    }

    public function test_personal_channel_only_for_its_owner(): void
    {
        $this->enableReverb();
        $this->postJson('/api/broadcasting/auth', ['socket_id' => '1.2', 'channel_name' => 'private-twinline.live'])->assertUnauthorized();
        $this->authorize($this->guest, 'private-twinline.user.'.$this->guest->id)->assertOk();
        $this->authorize($this->guest, 'private-twinline.user.'.$this->manager->id)->assertForbidden();
        $this->authorize($this->guest, 'private-twinline.live')->assertOk();
    }

    public function test_changes_are_broadcast(): void
    {
        Event::fake([ScenariosChanged::class, UserChanged::class, AuditRecorded::class]);
        $params = DatabaseSeeder::baseline();

        $this->actingAs($this->manager)
            ->postJson('/api/scenarios', ['id' => 'sc-rt1', 'name' => 'Ночная смена', 'description' => '', 'params' => $params])
            ->assertCreated();
        Event::assertDispatched(ScenariosChanged::class, fn ($e) => $e->kind === 'scenario' && $e->action === 'created' && $e->name === 'Ночная смена' && $e->actor === 'boss');
        Event::assertDispatched(AuditRecorded::class, fn ($e) => $e->entry['action'] === 'scenario_created');

        $this->actingAs($this->manager)->patchJson("/api/users/{$this->guest->id}", ['role' => 'manager'])->assertOk();
        Event::assertDispatched(UserChanged::class, fn ($e) => $e->action === 'role' && $e->userId === $this->guest->id && $e->role === 'manager');

        $event = new UserChanged('role', $this->guest->id, 'visitor', 'manager', 'boss');
        $channels = array_map(fn ($c) => $c->name, $event->broadcastOn());
        $this->assertSame(['presence-twinline.managers', 'private-twinline.user.'.$this->guest->id], $channels);
    }

    public function test_broadcast_failure_does_not_break_requests(): void
    {
        // Reverb «включён», но сервер недоступен (порт 1): запрос всё равно выполняется.
        $this->enableReverb();
        $this->actingAs($this->manager)
            ->postJson('/api/scenarios', ['id' => 'sc-rt2', 'name' => 'Без сервера', 'description' => '', 'params' => DatabaseSeeder::baseline()])
            ->assertCreated();
    }

    public function test_csp_allows_reverb_socket(): void
    {
        $this->enableReverb();
        $csp = $this->get('/login')->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("connect-src 'self' ws://127.0.0.1:1", $csp);
    }

    public function test_live_simulator_produces_consistent_snapshots(): void
    {
        $sim = new LineSimulator(DatabaseSeeder::baseline(), config('twinline.live'), seed: 42);
        $sim->warmUp(60);
        $first = $sim->tick();
        $this->assertSame(1, $first['seq']);
        $this->assertSame('07:02', $first['clock']);
        $this->assertSame([], array_filter($first['events'], fn ($e) => $e['type'] === 'shift'));

        $snapshot = $first;
        for ($i = 0; $i < 200; $i++) {
            $snapshot = $sim->tick();
        }
        $this->assertSame(1, $snapshot['shift']);
        $this->assertGreaterThan(100, $snapshot['produced']);
        $this->assertCount(6, $snapshot['stages']);
        foreach ($snapshot['stages'] as $stage) {
            $this->assertGreaterThanOrEqual(0, $stage['queue']);
            $this->assertGreaterThanOrEqual(0, $stage['utilization']);
            $this->assertLessThanOrEqual(1, $stage['utilization']);
            $this->assertGreaterThanOrEqual(1, $stage['up']);
        }
        // Механообработка — ограничение линии: загружена сильнее упаковки.
        $util = array_column($snapshot['stages'], 'utilization', 'id');
        $this->assertGreaterThan($util['packaging'], $util['machining']);

        // Через 8 ч начинается вторая смена: счётчики обнуляются, в журнале — событие смены.
        for ($i = 0; $i < 40; $i++) {
            $snapshot = $sim->tick();
        }
        $this->assertSame(2, $snapshot['shift']);
        $this->assertLessThan(20, $snapshot['produced']);
        $this->assertContains('shift', array_column($snapshot['events'], 'type'));
    }

    public function test_live_command_stores_snapshot(): void
    {
        config(['twinline.live.tick_seconds' => 0, 'twinline.live.cache_store' => 'array']);
        $this->artisan('twinline:live', ['--ticks' => 2, '--seed' => 1])->assertSuccessful();

        $this->actingAs($this->guest)->getJson('/api/live')
            ->assertOk()
            ->assertJsonPath('live.seq', 2)
            ->assertJsonPath('live.shift', 1)
            ->assertJsonCount(6, 'live.stages');
    }
}
