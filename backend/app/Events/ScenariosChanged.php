<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * Изменились сценарии или журнал прогонов. Другие руководители перечитывают данные с сервера.
 * $kind: scenario | runs; $action: created | updated | deleted | reset | recorded | cleared.
 */
class ScenariosChanged implements ShouldBroadcastNow
{
    use InteractsWithSockets;

    public function __construct(
        public string $kind,
        public string $action,
        public ?string $name,
        public ?string $actor,
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('twinline.managers')];
    }

    public function broadcastAs(): string
    {
        return 'scenarios.changed';
    }
}
