<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Доступ только для указанной роли: Route::middleware('role:manager'). */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if ($request->user()?->role !== $role) {
            return response()->json(['message' => 'Недостаточно прав.'], 403);
        }

        return $next($request);
    }
}
