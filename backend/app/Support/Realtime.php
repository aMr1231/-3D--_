<?php

namespace App\Support;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Отправка событий в реальном времени (Laravel Reverb).
 * Сбой WebSocket-сервера не должен ломать основной запрос: событие теряется, запрос выполняется,
 * клиенты получат актуальные данные при следующей загрузке.
 */
class Realtime
{
    private static int $lastWarning = 0;

    public static function send(ShouldBroadcast $event, bool $toOthers = true): void
    {
        try {
            if ($toOthers && method_exists($event, 'dontBroadcastToCurrentUser')) {
                $event->dontBroadcastToCurrentUser();
            }
            event($event);
        } catch (Throwable $e) {
            // Не засоряем журнал, если сервер Reverb не запущен: одно предупреждение в минуту.
            if (time() - self::$lastWarning >= 60) {
                self::$lastWarning = time();
                Log::warning('Realtime: событие не отправлено — '.$e->getMessage());
            }
        }
    }
}
