<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/** Настройки подключения к WebSocket-серверу и последний срез живой смены. */
class RealtimeController extends Controller
{
    public function config(): JsonResponse
    {
        $reverb = config('broadcasting.connections.reverb');
        $enabled = config('broadcasting.default') === 'reverb' && filled($reverb['key'] ?? null);

        return response()->json(['realtime' => $enabled ? [
            'key' => $reverb['key'],
            'host' => $reverb['options']['host'] ?? '127.0.0.1',
            'port' => (int) ($reverb['options']['port'] ?? 8080),
            'scheme' => $reverb['options']['scheme'] ?? 'http',
        ] : null]);
    }

    public function live(): JsonResponse
    {
        return response()->json(['live' => Cache::store(config('twinline.live.cache_store'))->get('twinline.live')]);
    }
}
