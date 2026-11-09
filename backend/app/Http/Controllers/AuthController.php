<?php

namespace App\Http\Controllers;

use App\Events\UserChanged;
use App\Http\Requests\PasswordChangeRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\Realtime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Timebox;

/**
 * Вход, регистрация, выход и смена пароля. Сессия — серверная (таблица sessions),
 * в браузере только зашифрованная httpOnly-cookie.
 */
class AuthController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toPublic()]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $limits = config('twinline.limits');
        $key = 'register|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, $limits['register_attempts'])) {
            return $this->tooMany(RateLimiter::availableIn($key), 'Слишком много регистраций');
        }
        RateLimiter::hit($key, $limits['register_decay_seconds']);

        $user = User::create([
            'login' => $request->validated('login'),
            'role' => 'guest',
            'password' => $request->validated('password'),
        ]);
        Auth::login($user);
        $request->session()->regenerate();
        AuditLog::record($request, 'register', $user->login, $user);
        Realtime::send(new UserChanged('registered', $user->id, $user->login, $user->role, null));

        return response()->json(['user' => $user->toPublic()], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $login = mb_strtolower(trim((string) $request->input('login')));
        $password = (string) $request->input('password');
        if ($login === '' || $password === '') {
            return response()->json(['message' => 'Введите логин и пароль.'], 422);
        }

        $limits = config('twinline.limits');
        $key = 'login|'.$request->ip().'|'.$login;
        if (RateLimiter::tooManyAttempts($key, $limits['login_attempts'])) {
            return $this->tooMany(RateLimiter::availableIn($key), 'Слишком много неудачных попыток');
        }

        // Одинаковое время ответа для существующих и несуществующих логинов (защита от перебора логинов).
        $ok = (new Timebox)->call(function (Timebox $timebox) use ($login, $password) {
            $ok = Auth::attempt(['login' => $login, 'password' => $password]);
            if ($ok) {
                $timebox->returnEarly();
            }

            return $ok;
        }, 350_000);

        if (! $ok) {
            RateLimiter::hit($key, $limits['login_decay_seconds']);
            AuditLog::record($request, 'login_failed', null, null, $login);

            return response()->json(['message' => 'Неверный логин или пароль.'], 401);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        AuditLog::record($request, 'login');

        return response()->json(['user' => $request->user()->toPublic()]);
    }

    public function logout(Request $request): Response
    {
        if ($request->user()) {
            AuditLog::record($request, 'logout');
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function password(PasswordChangeRequest $request): Response
    {
        $user = $request->user();
        $user->forceFill(['password' => $request->validated('newPassword')])->save();
        // Остальные сессии пользователя завершаются, текущая продолжает работать.
        DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId())
            ->delete();
        $request->session()->regenerate();
        AuditLog::record($request, 'password_changed');
        // Другие вкладки и устройства этого пользователя сразу узнают, что их сессии завершены.
        Realtime::send(new UserChanged('password', $user->id, $user->login, $user->role, $user->login));

        return response()->noContent();
    }

    private function tooMany(int $seconds, string $what): JsonResponse
    {
        $minutes = max(1, (int) ceil($seconds / 60));

        return response()->json(['message' => "$what. Повторите через $minutes мин."], 429)
            ->header('Retry-After', (string) $seconds);
    }
}
