<?php

namespace App\Http\Controllers;

use App\Events\UserChanged;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\Realtime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Управление пользователями (только руководитель). Роль читается из базы на каждом запросе,
 * поэтому смена роли и удаление действуют сразу.
 */
class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()->orderBy('created_at')->orderBy('id')->get()
            ->map(fn (User $u) => [...$u->toPublic(), 'createdAt' => $u->created_at?->toISOString()]);

        return response()->json(['users' => $users]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(
            ['role' => ['required', Rule::in(User::ROLES)]],
            ['role.*' => 'Неизвестная роль.'],
        );
        if ($user->is($request->user())) {
            return response()->json(['message' => 'Нельзя изменить собственную роль.'], 400);
        }
        if ($user->isManager() && $data['role'] !== 'manager' && $this->managers() <= 1) {
            return response()->json(['message' => 'В системе должен остаться хотя бы один руководитель.'], 400);
        }
        $previous = $user->role;
        $user->update(['role' => $data['role']]);
        AuditLog::record($request, 'role_changed', "{$user->login}: {$previous} → {$data['role']}");
        Realtime::send(new UserChanged('role', $user->id, $user->login, $user->role, $request->user()->login));

        return response()->json(['user' => $user->toPublic()]);
    }

    public function destroy(Request $request, User $user): Response|JsonResponse
    {
        if ($user->is($request->user())) {
            return response()->json(['message' => 'Нельзя удалить собственную учётную запись.'], 400);
        }
        if ($user->isManager() && $this->managers() <= 1) {
            return response()->json(['message' => 'В системе должен остаться хотя бы один руководитель.'], 400);
        }
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $login = $user->login;
        $id = $user->id;
        $user->delete();
        AuditLog::record($request, 'user_deleted', $login);
        Realtime::send(new UserChanged('deleted', $id, $login, null, $request->user()->login));

        return response()->noContent();
    }

    private function managers(): int
    {
        return User::query()->where('role', 'manager')->count();
    }
}
