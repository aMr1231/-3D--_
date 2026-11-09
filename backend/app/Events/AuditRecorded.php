<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/** Новая запись журнала действий — появляется на странице «Пользователи» без обновления. */
class AuditRecorded implements ShouldBroadcastNow
{
    public function __construct(public array $entry) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('twinline.managers')];
    }

    public function broadcastAs(): string
    {
        return 'audit.recorded';
    }
}
