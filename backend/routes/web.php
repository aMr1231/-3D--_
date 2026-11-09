<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RealtimeController;
use App\Http\Controllers\ScenarioController;
use App\Http\Controllers\SpaController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
 * API для одностраничного фронтенда. Маршруты в группе web: серверная сессия в зашифрованной
 * httpOnly-cookie и защита от CSRF (заголовок X-XSRF-TOKEN из cookie XSRF-TOKEN).
 */
Route::prefix('api')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::middleware('auth')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/password', [AuthController::class, 'password']);

        // Реальное время: настройки подключения к Reverb, текущий срез смены, авторизация каналов.
        Route::get('realtime', [RealtimeController::class, 'config']);
        Route::get('live', [RealtimeController::class, 'live']);
    });
    Broadcast::routes(['middleware' => ['auth']]);

    Route::middleware(['auth', 'role:manager'])->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        Route::get('scenarios', [ScenarioController::class, 'index']);
        Route::post('scenarios', [ScenarioController::class, 'store']);
        Route::post('scenarios/reset', [ScenarioController::class, 'reset']);
        Route::put('scenarios/{scenario}', [ScenarioController::class, 'update']);
        Route::delete('scenarios/{scenario}', [ScenarioController::class, 'destroy']);
        Route::post('runs', [ScenarioController::class, 'storeRun']);
        Route::delete('runs', [ScenarioController::class, 'clearRuns']);

        Route::get('audit-log', [AuditLogController::class, 'index']);
    });

    Route::any('{any}', fn () => response()->json(['message' => 'Метод API не найден.'], 404))->where('any', '.*');
});

// Все остальные адреса — одностраничное приложение (маршрутизация на клиенте).
Route::fallback(SpaController::class);
