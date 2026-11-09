<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_пароль_хранится_только_в_виде_хеша(): void
    {
        $user = User::where('login', 'manager')->first();
        $this->assertNotSame('demo', $user->getRawOriginal('password'));
        $this->assertTrue(Hash::check('demo', $user->password));
    }

    public function test_без_входа_me_отвечает_401(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401)->assertJson(['message' => 'Требуется вход в систему.']);
    }

    public function test_вход_демо_руководителя_и_me(): void
    {
        $this->postJson('/api/auth/login', ['login' => 'Manager', 'password' => 'demo'])
            ->assertOk()
            ->assertJsonPath('user.login', 'manager')
            ->assertJsonPath('user.role', 'manager');
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.role', 'manager');
        $this->assertDatabaseHas('audit_logs', ['action' => 'login', 'login' => 'manager']);
    }

    public function test_неверный_пароль_401_и_блокировка_после_5_попыток(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['login' => 'guest', 'password' => 'wrong'])->assertStatus(401);
        }
        $this->postJson('/api/auth/login', ['login' => 'guest', 'password' => 'tour'])
            ->assertStatus(429)
            ->assertHeader('Retry-After');
        $this->assertSame(5, AuditLog::where('action', 'login_failed')->count());
    }

    public function test_регистрация_даёт_роль_гостя_и_сразу_входит(): void
    {
        $this->postJson('/api/auth/register', ['login' => 'student01', 'password' => 'Factory2026'])
            ->assertCreated()
            ->assertJsonPath('user.role', 'guest');
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.login', 'student01');
        $this->assertDatabaseHas('audit_logs', ['action' => 'register', 'login' => 'student01']);
    }

    public function test_повторный_логин_занят(): void
    {
        $this->postJson('/api/auth/register', ['login' => 'manager', 'password' => 'Factory2026'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['login' => 'Этот логин уже занят.']);
    }

    public function test_политика_паролей(): void
    {
        $cases = [
            ['я', 'Factory2026', 'login'],
            ['student02', 'short1', 'password'],
            ['student02', 'onlyletters', 'password'],
            ['student02', '1234567890', 'password'],
            ['student02', 'student02pass', 'password'],
        ];
        foreach ($cases as [$login, $password, $field]) {
            $this->postJson('/api/auth/register', compact('login', 'password'))
                ->assertStatus(422)
                ->assertJsonValidationErrors([$field]);
        }
    }

    public function test_выход_завершает_сессию(): void
    {
        $this->postJson('/api/auth/login', ['login' => 'manager', 'password' => 'demo'])->assertOk();
        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_смена_пароля(): void
    {
        $this->postJson('/api/auth/register', ['login' => 'pwd01', 'password' => 'Initial123'])->assertCreated();
        $this->postJson('/api/auth/password', ['currentPassword' => 'wrong', 'newPassword' => 'Changed456'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['currentPassword']);
        $this->postJson('/api/auth/password', ['currentPassword' => 'Initial123', 'newPassword' => 'Changed456'])
            ->assertNoContent();
        $this->postJson('/api/auth/logout');
        $this->postJson('/api/auth/login', ['login' => 'pwd01', 'password' => 'Initial123'])->assertStatus(401);
        $this->postJson('/api/auth/login', ['login' => 'pwd01', 'password' => 'Changed456'])->assertOk();
    }
}
