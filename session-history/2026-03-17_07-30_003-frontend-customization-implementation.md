---
date: 2026-03-17
time: "07:30"
duration_approx: ~2h 40m
participants: user + claude
---

# 003 Frontend Customization — Implementation & Deploy

## Цель сессии
Реализовать plan.md фичи 003-frontend-customization — заменить FastAPI template branding на StatusPulse design system по всему фронтенду, задеплоить на production.

## Что сделали

### Реализация плана (8 фаз, 18 задач)
- Использовали superpowers:subagent-driven-development — frontend-developer субагенты по фазам
- **Phase 1:** CSS токены (indigo primary, warm gray bg, dark navy sidebar), шрифты Plus Jakarta Sans + JetBrains Mono, favicon
- **Phase 2:** Удалены signup/recover-password/reset-password роуты, FastAPI SVG ассеты, signUpMutation
- **Phase 3:** Переписаны Logo (текстовый `◆ StatusPulse`), AuthLayout (centered card), NotFound (404 page)
- **Phase 4:** Login page — брендинг, theme toggle, ссылка "Back to Status Page"
- **Phase 5:** Public status page — pulsating dot, timeline incidents, footer
- **Phase 6:** Dashboard — stat cards с icon pills, Recent Activity, Services Overview
- **Phase 7:** Sidebar — убраны hardcoded цвета, добавлена ссылка "Status Page"
- **Phase 8:** Animations sweep, hardcoded color cleanup, design-system.md обновлён

### Фикс конфликта роутов
- `routes/index.tsx` и `routes/_layout/index.tsx` обе на `/` — конфликт TanStack Router
- Решение: dashboard перенесён на `/dashboard` (rename `_layout/index.tsx` → `_layout/dashboard.tsx`)
- Обновлены все ссылки: sidebar, login redirect, useAuth

### Настройка локального окружения
- Установлен bun (`npm install -g bun`), frontend deps
- Установлен PostgreSQL 16 (`brew install postgresql@16`)
- Создана локальная БД, merge migration heads, запуск prestart (seed data)
- Backend: `fastapi dev` на :8000, Frontend: `bun run dev` на :5173

### Deploy на production
- Исправлен `Dockerfile.railway` — добавлен `prestart.sh` перед `fastapi run` (миграции не запускались)
- Обновлены Railway env vars: `FRONTEND_HOST` и `BACKEND_CORS_ORIGINS` → `https://status-pulse-app-frontend.vercel.app`
- Railway trial expired → пользователь обновил план → повторный деплой
- Миграции прошли на Railway, seed data создан

### Deployment documentation
- DevOps субагент создал `docs/conventions/deployment.md` — полный гайд по local + production setup

### Фикс API вызовов (незавершён)
- Проблема: публичная страница использовала относительные URL → шли на Vite вместо бэкенда
- Добавлен Vite proxy `/api` → `localhost:8000`
- Создан `frontend/src/lib/api.ts` — shared axios instance с baseURL + auth interceptor
- Все 9 файлов переведены на `api` вместо raw `axios`
- **Публичная страница заработала**, но **админка всё ещё пуста** — баг не решён

### Backlog features
- Созданы 004 (Incident Descriptions), 005 (Service Status History), 006 (Notification System)
- Создан 007 (Fix Admin API Calls) — текущий баг

## Ключевые решения
- Dashboard перенесён на `/dashboard` — публичная страница на `/` без auth
- Vite proxy для dev + VITE_API_URL для production — единый подход
- Shared axios instance (`lib/api.ts`) вместо raw axios — централизованный auth
- PostgreSQL 16 локально через brew (не Docker) — по запросу пользователя
- Все code changes только через субагентов (feedback от пользователя)

## Созданные / изменённые файлы
- `frontend/src/index.css` — CSS токены StatusPulse + animations
- `frontend/index.html` — title, fonts, favicon
- `frontend/public/favicon.svg` — indigo diamond (NEW)
- `frontend/src/components/Common/Logo.tsx` — text-based `◆ StatusPulse`
- `frontend/src/components/Common/AuthLayout.tsx` — centered card
- `frontend/src/components/Common/NotFound.tsx` — 404 page
- `frontend/src/routes/login.tsx` — restyled
- `frontend/src/routes/index.tsx` — public status page redesign
- `frontend/src/routes/_layout/dashboard.tsx` — NEW (renamed from index.tsx)
- `frontend/src/components/StatusPage/*` — restyled
- `frontend/src/components/Sidebar/AppSidebar.tsx` — Status Page link, /dashboard path
- `frontend/src/hooks/useAuth.ts` — removed signUpMutation, redirect to /dashboard
- `frontend/src/lib/api.ts` — shared axios with auth (NEW)
- `frontend/vite.config.ts` — added proxy
- `backend/Dockerfile.railway` — added prestart.sh to CMD
- `backend/app/alembic/versions/bed9ca68309f_merge_migration_heads.py` — merge migration
- `docs/conventions/deployment.md` — deployment guide (NEW)
- `docs/design-system.md` — section 5.2 updated (icon pills)
- `docs/backlog/active/004-007/` — new features
- Deleted: 3 route files, 4 FastAPI SVGs

## Незавершённые задачи
- [ ] **007-fix-admin-api-calls** — Dashboard/Services/Incidents показывают пустые данные. API возвращает данные с auth token (проверено curl), но фронтенд не отображает. Нужно дебажить в DevTools Network tab
- [ ] Закоммитить и запушить текущие unstaged изменения (api.ts, vite proxy, все axios→api замены)
- [ ] Проверить что production (Vercel) тоже работает после пуша
- [ ] `.env` на Railway: email `admin@statuspulse.app` — пользователь подтвердил что логин работает

## Ошибки и workaround'ы
- **`admin@statuspulse.local` не проходит email validation** → заменён на `.dev` (локально) и `.app` (Railway)
- **Alembic multiple heads** → `alembic merge heads` создал merge migration
- **Railway trial expired** → пользователь обновил план, повторный deploy через MCP
- **Railway redeploy from env change использует cached image** → `mcp__railway__deploy` для полного ребилда
- **`prestart.sh` не запускался на Railway** → добавлен в CMD Dockerfile.railway
- **Relative axios URLs** → Vite proxy + shared api instance
- **zsh: `?` в URL** → нужны кавычки вокруг URL с query params

## Контекст для следующей сессии

**Главный баг:** Админка (Dashboard, Services, Incidents) показывает пустые данные. Публичная страница работает. API возвращает данные с auth token (проверено curl). Создан `frontend/src/lib/api.ts` с auth interceptor, все файлы переведены на него. Нужно дебажить через browser DevTools → Network tab — проверить какие запросы уходят, есть ли Authorization header, какой ответ.

**Незакоммиченные изменения (unstaged):** `frontend/src/lib/api.ts` (NEW), `frontend/vite.config.ts` (proxy), 9 файлов с `axios` → `api` заменами, `docs/backlog/active/007-fix-admin-api-calls/readme.md`. Также staged (от параллельной 002-testing): тесты в `backend/tests/`, `frontend/tests/`.

**Серверы локально:** Backend `fastapi dev` на :8000, Frontend `bun run dev` на :5173. PostgreSQL 16 через `brew services`. Login: `admin@statuspulse.dev` / `statuspulse123`.

**Production:** Frontend: https://status-pulse-app-frontend.vercel.app, Backend: https://backend-production-276a.up.railway.app. Login: `admin@statuspulse.app` / пароль в Railway env var `FIRST_SUPERUSER_PASSWORD`.

**VITE_API_URL:** На Vercel установлен `https://backend-production-276a.up.railway.app`. Локально в `frontend/.env` = `http://localhost:8000`.

## Коммиты этой сессии
- `770e629` — feat(frontend): replace FastAPI branding with StatusPulse design system
- `fa88064` — fix(backend): run prestart.sh before FastAPI in Railway Dockerfile
- `8c2b1ed` — docs: archive 003-frontend-customization feature as completed
- `5f4a427` — docs(backlog): add features 004, 005, 006 to active backlog
