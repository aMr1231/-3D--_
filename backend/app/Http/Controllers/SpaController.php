<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

/**
 * Отдаёт собранный фронтенд (React SPA) для всех маршрутов, кроме /api.
 * Сборка: `npm run build` в корне проекта кладёт файлы в backend/public/app.
 */
class SpaController extends Controller
{
    public function __invoke(): Response
    {
        $index = public_path('app/index.html');
        if (! is_file($index)) {
            return response(
                'Фронтенд не собран. Выполните «npm run build» в корне проекта или используйте «npm run dev».',
                503,
                ['Content-Type' => 'text/plain; charset=utf-8'],
            );
        }

        // index.html не кешируется: после обновления браузер сразу получит новые хешированные файлы.
        return response(file_get_contents($index), 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'Cache-Control' => 'no-cache',
        ]);
    }
}
