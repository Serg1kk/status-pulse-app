---
date: 2026-03-17
time: "10:30"
duration_approx: ~20m
participants: user + claude
---

# Fix Admin API Calls — диагностика и 401 interceptor

## Цель сессии
Починить пустые данные на admin-страницах (Dashboard, Services, Incidents) на localhost. На продакшене и в incognito всё работает, в обычном браузере - пусто.

## Что сделали

### Диагностика проблемы
- Прочитали readme фичи `docs/backlog/active/007-fix-admin-api-calls/`
- Изучили код: `frontend/src/lib/api.ts`, все admin-роуты (dashboard, services, incidents), `useAuth`, `main.tsx`, backend routes
- Проверили CORS — preflight OPTIONS возвращает корректные заголовки
- Проверили backend endpoints через curl — `/api/v1/services/` и `/api/v1/incidents/` с auth токеном возвращают данные (5 сервисов, 3 инцидента)
- Запустили Playwright-тест: свежий логин + dashboard — всё работает, данные приходят, ошибок нет

### Нашли root cause
- В `main.tsx` есть `handleApiError` который ловит 401/403 только для `ApiError` (OpenAPI generated client)
- Admin страницы используют raw `axios` через `api` instance — его ошибки не перехватывались
- Если в localStorage был stale/невалидный токен, `isLoggedIn()` возвращал `true`, пользователь попадал на dashboard, API возвращал 401/403, но редиректа на login не происходило — пользователь видел пустые данные

### Добавили response interceptor
- Добавили в `frontend/src/lib/api.ts` response interceptor: при 401/403 удаляет токен из localStorage и редиректит на `/login`
- Проверили через Playwright с невалидным токеном — редирект на login работает корректно

### Результат
- Пользователь обновил браузер, перелогинился — данные появились
- Проблема была в stale токене в localStorage обычного браузера

## Ключевые решения
- Добавили response interceptor в axios instance (belt-and-suspenders с существующим handleApiError в main.tsx) — теперь оба пути (OpenAPI client и raw axios) обрабатывают 401/403

## Созданные / изменённые файлы
- `frontend/src/lib/api.ts` — добавлен response interceptor для 401/403 (удаление токена + редирект)

## Незавершённые задачи
- [ ] Коммит и пуш всех локальных изменений в GitHub
- [ ] Перемещение 007-fix-admin-api-calls в archived

## Ошибки и workaround'ы
- Stale токен в localStorage → auth guard `isLoggedIn()` проверяет только наличие токена, не валидность. Защита полностью на стороне API response codes + interceptors.
- Backend возвращает 403 (не 401) для невалидного токена — оба кода обрабатываются

## Контекст для следующей сессии
- Frontend dev server: `http://localhost:5173`, Backend: `http://localhost:8000`
- `VITE_API_URL=http://localhost:8000` в `frontend/.env` — запросы идут напрямую на бэкенд (cross-origin), Vite proxy настроен но не используется
- Production: frontend на Vercel, backend на Railway
- Credentials в `.env`: `FIRST_SUPERUSER=admin@statuspulse.dev`
- Есть незакоммиченные изменения: api.ts interceptor, formatting login.tsx, test fixes, удаление 002-testing-setup docs
- Фичу 007 нужно переместить в `docs/backlog/archived/`

## Коммиты этой сессии
- Пока нет — коммит запланирован как следующий шаг
