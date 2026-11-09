<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function manager(): User
    {
        return User::where('login', 'manager')->first();
    }

    public function test_гость_не_видит_пользователей(): void
    {
        $guest = User::where('login', 'guest')->first();
        $this->actingAs($guest)->getJson('/api/users')->assertStatus(403);
    }

    public function test_список_без_паролей_и_смена_роли_действует_сразу(): void
    {
        $tech = User::factory()->create(['login' => 'tech01']);
        $response = $this->actingAs($this->manager())->getJson('/api/users')->assertOk();
        $this->assertStringNotContainsString('password', $response->getContent());

        $this->patchJson("/api/users/{$tech->id}", ['role' => 'manager'])->assertOk()->assertJsonPath('user.role', 'manager');
        $this->assertSame('manager', $tech->fresh()->role);
        $this->actingAs($tech->fresh())->getJson('/api/users')->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'role_changed']);
    }

    public function test_неизвестная_роль_отклоняется(): void
    {
        $tech = User::factory()->create();
        $this->actingAs($this->manager())->patchJson("/api/users/{$tech->id}", ['role' => 'admin'])->assertStatus(422);
    }

    public function test_нельзя_менять_свою_роль_и_удалять_себя(): void
    {
        $me = $this->manager();
        $this->actingAs($me)->patchJson("/api/users/{$me->id}", ['role' => 'guest'])->assertStatus(400);
        $this->actingAs($me)->deleteJson("/api/users/{$me->id}")->assertStatus(400);
    }

    public function test_нельзя_удалить_последнего_руководителя(): void
    {
        $second = User::factory()->manager()->create();
        $this->actingAs($second)->deleteJson("/api/users/{$this->manager()->id}")->assertNoContent();
        // Остался один руководитель — понизить его нельзя (другой руководитель уже удалён).
        $guest = User::where('login', 'guest')->first();
        $guest->update(['role' => 'manager']);
        $this->actingAs($guest)->patchJson("/api/users/{$second->id}", ['role' => 'guest'])->assertOk();
        $this->actingAs($guest)->patchJson("/api/users/{$guest->id}", ['role' => 'guest'])->assertStatus(400);
    }

    public function test_удаление_пользователя_и_журнал(): void
    {
        $victim = User::factory()->create(['login' => 'temp01']);
        $this->actingAs($this->manager())->deleteJson("/api/users/{$victim->id}")->assertNoContent();
        $this->assertDatabaseMissing('users', ['login' => 'temp01']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user_deleted', 'subject' => 'temp01']);
        $this->getJson('/api/audit-log')->assertOk()->assertJsonPath('entries.0.action', 'user_deleted');
    }
}
