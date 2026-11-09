<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Заголовки безопасности для страницы приложения и API.
 * CSP разрешает только собственные скрипты; inline-стили нужны React и графикам (style-атрибуты).
 */
class SecurityHeaders
{
    private const CSP = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ];

    /** connect-src дополняется адресом WebSocket-сервера Reverb, если вещание включено. */
    private function policy(): array
    {
        $options = config('broadcasting.connections.reverb.options', []);
        if (config('broadcasting.default') !== 'reverb' || empty($options['host'])) {
            return self::CSP;
        }
        $scheme = ($options['scheme'] ?? 'http') === 'https' ? 'wss' : 'ws';
        $socket = sprintf('%s://%s:%d', $scheme, $options['host'], $options['port'] ?? 8080);

        return array_map(fn ($rule) => $rule === "connect-src 'self'" ? "connect-src 'self' $socket" : $rule, self::CSP);
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $headers = $response->headers;

        $headers->set('Content-Security-Policy', implode('; ', $this->policy()));
        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('X-Frame-Options', 'DENY');
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        if ($request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        if ($request->is('api/*')) {
            // Ответы API с данными пользователей не кешируются.
            $headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
