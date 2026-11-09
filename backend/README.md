# Twinline — сервер (Laravel 13)

API авторизации, ролей, пользователей, сценариев и журнала действий для фронтенда Twinline (React, корень репозитория).

Запуск — из корня проекта:

```bash
npm run setup   # composer install, .env, ключ, база с демо-данными
npm run dev     # Laravel на :8000, Reverb на :8080, живая смена, Vite на :5173
npm run test:api
```

Основное:

- маршруты — `routes/web.php` (группа `api`, сессия + CSRF);
- контроллеры — `app/Http/Controllers`, проверка данных — `app/Http/Requests`;
- middleware — `EnsureRole` (`role:manager`), `SecurityHeaders` (CSP и другие заголовки);
- настройки модели линии и ограничений — `config/twinline.php`;
- демо-данные — `database/seeders/DatabaseSeeder.php` (отключение: `TWINLINE_SEED_DEMO=false`);
- реальное время — события `app/Events`, каналы `routes/channels.php`, отправка `app/Support/Realtime.php`, живая смена — `app/Live/LineSimulator.php` и команда `php artisan twinline:live`.

Подробности — `../docs/02-architecture.md` (раздел 2.9) и `../docs/08-deployment.md`.
