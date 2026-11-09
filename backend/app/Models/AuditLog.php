<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Журнал действий, важных для безопасности: входы, регистрации, смена ролей и паролей, удаления.
 */
#[Fillable(['user_id', 'login', 'action', 'subject', 'ip', 'created_at'])]
class AuditLog extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public static function record(Request $request, string $action, ?string $subject = null, ?User $actor = null, ?string $login = null): void
    {
        $actor ??= $request->user();
        static::create([
            'user_id' => $actor?->id,
            'login' => $actor?->login ?? $login,
            'action' => $action,
            'subject' => $subject !== null ? mb_substr($subject, 0, 120) : null,
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'login' => $this->login,
            'action' => $this->action,
            'subject' => $this->subject,
            'ip' => $this->ip,
            'at' => $this->created_at->toISOString(),
        ];
    }
}
