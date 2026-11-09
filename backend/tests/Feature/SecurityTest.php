<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_заголовки_безопасности(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->assertStringContainsString("frame-ancestors 'none'", $response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString("script-src 'self'", $response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_hsts_только_по_https(): void
    {
        $this->getJson('/api/auth/me')->assertHeaderMissing('Strict-Transport-Security');
        $this->getJson('https://localhost/api/auth/me')->assertHeader('Strict-Transport-Security');
    }

    public function test_неизвестный_метод_api(): void
    {
        $this->getJson('/api/nope')->assertStatus(404)->assertJson(['message' => 'Метод API не найден.']);
    }

    public function test_csrf_защита_включена(): void
    {
        // В тестах Laravel отключает проверку CSRF; включаем её явно.
        $this->withMiddleware()->app->instance('env', 'production');
        $this->postJson('/api/auth/login', ['login' => 'manager', 'password' => 'demo'])->assertStatus(419);
    }
}
