# 003 — Frontend Customization: Status Pulse Branding

## Проблема

Фронтенд сейчас — дефолтный FastAPI Full-Stack Template. Signup, recover-password, лишние страницы, generic UI. Нужно адаптировать под Status Pulse — минимальный, целевой интерфейс.

## Решения

### 1. Убрать лишние auth-страницы

Удалить полностью:
- `/signup` — роут + компонент
- `/recover-password` — роут + компонент
- `/reset-password` — роут + компонент
- Все ссылки на эти страницы из login и других мест
- `signUpMutation` из `useAuth.ts`

Юзеров создаём вручную: через API (`/docs`), MCP, или админку (`/_layout/admin`).

### 2. Упростить Login

- Оставить только email + password форму
- Убрать все ссылки (signup, forgot password)
- Добавить Status Pulse branding (лого, название)

### 3. Адаптировать публичную страницу `/`

Страница уже существует и показывает статус сервисов. Нужно:
- Убрать FastAPI template стилистику
- Добавить Status Pulse branding (header с названием проекта)
- Ссылку на admin login (маленькая, в footer)
- Сделать визуально приятной для гостей

### 4. Адаптировать Admin Panel (`/_layout/*`)

- Sidebar: убрать/переименовать FastAPI template элементы
- Dashboard: адаптировать под Status Pulse метрики
- Branding в sidebar header

### 5. Починить CORS для Production

**Критично** — без этого прод не работает:
- Railway env: `FRONTEND_HOST` → `https://status-pulse-app-frontend.vercel.app`
- Проверить `BACKEND_CORS_ORIGINS` на Railway
- Это prerequisite для всего остального

## Текущая структура роутинга

```
Public (no auth):
  /                    — Status page (сервисы + инциденты)
  /login               — Логин
  /signup              — УДАЛИТЬ
  /recover-password    — УДАЛИТЬ
  /reset-password      — УДАЛИТЬ

Protected (auth required):
  /_layout/            — Admin dashboard
  /_layout/services    — Управление сервисами
  /_layout/incidents   — Управление инцидентами
  /_layout/admin       — Управление юзерами (superuser)
  /_layout/settings    — Настройки профиля
```

## Deployment URLs

- Frontend: `https://status-pulse-app-frontend.vercel.app`
- Backend API: `https://backend-production-276a.up.railway.app`
- Swagger: `https://backend-production-276a.up.railway.app/docs`

## Открытые вопросы

- [x] ~~Оставляем ли recover-password / reset-password?~~ — **Убираем**
- [ ] Визуал: цвета, лого Status Pulse?
- [ ] Нужна ли кастомная 404 страница?

## Зависимости

- **001-status-pulse-base** — должна быть готова (✅)
- **CORS fix** — prerequisite, без него фронт не работает на проде
