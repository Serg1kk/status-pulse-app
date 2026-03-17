# 003 — Frontend Customization: Status Pulse Branding

Исходные вводные данные по фиче. Детальный визуальный дизайн - в `visual-design-spec.md`.

---

## Проблема

Фронтенд сейчас - дефолтный FastAPI Full-Stack Template. Signup, recover-password, лишние страницы, generic UI. Нужно адаптировать под Status Pulse - минимальный, целевой интерфейс.

## Что нужно сделать

### 1. Убрать лишние auth-страницы

Удалить полностью:
- `/signup` - роут + компонент
- `/recover-password` - роут + компонент
- `/reset-password` - роут + компонент
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

**Критично** - без этого прод не работает:
- Railway env: `FRONTEND_HOST` → `https://status-pulse-app-frontend.vercel.app`
- Проверить `BACKEND_CORS_ORIGINS` на Railway
- Это prerequisite для всего остального

## Текущая структура роутинга

```
Public (no auth):
  /                    - Status page (сервисы + инциденты)
  /login               - Логин
  /signup              - УДАЛИТЬ
  /recover-password    - УДАЛИТЬ
  /reset-password      - УДАЛИТЬ

Protected (auth required):
  /_layout/            - Admin dashboard
  /_layout/services    - Управление сервисами
  /_layout/incidents   - Управление инцидентами
  /_layout/admin       - Управление юзерами (superuser)
  /_layout/settings    - Настройки профиля
```

## Deployment URLs

- Frontend: `https://status-pulse-app-frontend.vercel.app`
- Backend API: `https://backend-production-276a.up.railway.app`
- Swagger: `https://backend-production-276a.up.railway.app/docs`

## Решённые вопросы

- [x] ~~Оставляем ли recover-password / reset-password?~~ - **Убираем**
- [x] ~~Визуал: цвета, лого Status Pulse?~~ - **Решено в visual-design-spec.md**
- [x] ~~Нужна ли кастомная 404 страница?~~ - **Да, делаем**

## Зависимости

- **001-status-pulse-base** - должна быть готова (done)
- **CORS fix** - prerequisite, без него фронт не работает на проде

## Изначальный план (черновик)

Ниже - черновой план, который был составлен до brainstorming сессии. Актуальный implementation plan будет создан отдельно на основе `visual-design-spec.md`.

### Prerequisites
- [ ] **P0: Fix CORS on Railway** - update `FRONTEND_HOST` env var to Vercel URL (DevOps agent)

### Phase 1: Cleanup
- Удалить signup, recover-password, reset-password роуты
- Удалить signUpMutation из useAuth.ts
- Убрать ссылки из login.tsx

### Phase 2: Login Page
- Status Pulse branding
- Чистый минимальный дизайн

### Phase 3: Public Status Page
- Header, footer, визуал

### Phase 4: Admin Panel
- Sidebar, dashboard

### Phase 5: Verify on Production
- Build, deploy, проверка

### Файлы для изменения

```
frontend/src/routes/signup.tsx              - УДАЛИТЬ
frontend/src/routes/recover-password.tsx    - УДАЛИТЬ
frontend/src/routes/reset-password.tsx      - УДАЛИТЬ
frontend/src/routes/login.tsx               - Убрать ссылки signup/forgot, добавить branding
frontend/src/routes/index.tsx               - Адаптировать публичную страницу
frontend/src/routes/_layout.tsx             - Branding в layout
frontend/src/routes/_layout/index.tsx       - Dashboard адаптация
frontend/src/hooks/useAuth.ts              - Убрать signUpMutation
frontend/src/components/Sidebar/AppSidebar.tsx - Sidebar branding
frontend/src/routeTree.gen.ts              - Auto-regenerated
```
