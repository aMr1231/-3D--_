<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Пользователь Twinline. Роли: manager — полный доступ, guest — только 3D-тур.
 *
 * @property int $id
 * @property string $login
 * @property string $role
 */
#[Fillable(['login', 'role', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    public const ROLES = ['manager', 'guest'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    /** Публичное представление без служебных полей. */
    public function toPublic(): array
    {
        return ['id' => $this->id, 'login' => $this->login, 'role' => $this->role];
    }
}
