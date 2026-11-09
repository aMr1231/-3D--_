<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

/** Журнал действий безопасности (только руководитель): последние 100 записей. */
class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $entries = AuditLog::query()->orderByDesc('created_at')->orderByDesc('id')->limit(100)->get()->map->toApi();

        return response()->json(['entries' => $entries]);
    }
}
