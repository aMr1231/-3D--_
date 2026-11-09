# Twinline — сервер (Laravel 13)

API авторизации, ролей, пользователей, сценариев и журнала действий для фронтенда Twinline (React, корень репозитория).

Запуск — из корня проекта:

```bash
npm run setup   # composer install, .env, ключ, база с демо-данными
npm run dev     # Laravel на :8000 + Vite на :5173
npm run test:api
```

Основное:

- маршруты — `routes/web.php` (группа `api`, сессия + CSRF);
- контроллеры — `app/Http/Controllers`, проверка данных — `app/Http/Requests`;
- middleware — `EnsureRole` (`role:manager`), `SecurityHeaders` (CSP и другие заголовки);
- настройки модели линии и ограничений — `config/twinline.php`;
- демо-данные — `database/seeders/DatabaseSeeder.php` (отключение: `TWINLINE_SEED_DEMO=false`).

Подробности — `../docs/02-architecture.md` (раздел 2.9) и `../docs/08-deployment.md`.
