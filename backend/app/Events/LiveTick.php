<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/** Срез живой смены: счётчики линии, очереди и загрузка участков, последние события. */
class LiveTick implements ShouldBroadcastNow
{
    public function __construct(public array $snapshot) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('twinline.live')];
    }

    public function broadcastAs(): string
    {
        return 'live.tick';
    }

    public function broadcastWith(): array
    {
        return $this->snapshot;
    }
}
