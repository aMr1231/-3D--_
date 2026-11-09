<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
 * Каналы реального времени. Авторизация — по серверной сессии (POST /api/broadcasting/auth).
 */

// Присутствие руководителей: кто сейчас в системе; изменения сценариев, пользователей, журнала.
Broadcast::channel('twinline.managers', function (User $user) {
    return $user->isManager() ? ['id' => $user->id, 'login' => $user->login] : false;
});

// Личный канал: смена роли или удаление учётной записи применяются сразу.
Broadcast::channel('twinline.user.{id}', function (User $user, int $id) {
    return $user->id === $id;
});

// Живая смена — всем вошедшим пользователям.
Broadcast::channel('twinline.live', function (User $user) {
    return true;
});
