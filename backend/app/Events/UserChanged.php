<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * Изменилась учётная запись: регистрация, смена роли, удаление, смена пароля.
 * Руководители обновляют список пользователей; сам пользователь сразу получает новые права
 * (или выход из системы, если учётная запись удалена).
 */
class UserChanged implements ShouldBroadcastNow
{
    use InteractsWithSockets;

    public function __construct(
        public string $action,
        public int $userId,
        public string $login,
        public ?string $role,
        public ?string $actor,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('twinline.managers'),
            new PrivateChannel('twinline.user.'.$this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.changed';
    }
}
