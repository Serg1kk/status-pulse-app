# 003 — Frontend Customization: Implementation Plan

## Prerequisites

- [ ] **P0: Fix CORS on Railway** — update `FRONTEND_HOST` env var to Vercel URL (DevOps agent)

## Phase 1: Cleanup — убрать лишнее

- [ ] **1.1** Удалить `/signup` роут (`frontend/src/routes/signup.tsx`)
- [ ] **1.2** Удалить `/recover-password` роут (`frontend/src/routes/recover-password.tsx`)
- [ ] **1.3** Удалить `/reset-password` роут (`frontend/src/routes/reset-password.tsx`)
- [ ] **1.4** Удалить `signUpMutation` из `useAuth.ts`
- [ ] **1.5** Убрать ссылки "Sign up", "Forgot password" из `login.tsx`
- [ ] **1.6** Перегенерировать route tree (автоматически при dev/build)

## Phase 2: Login Page — адаптация

- [ ] **2.1** Добавить Status Pulse branding на login (название, описание)
- [ ] **2.2** Убрать упоминания FastAPI template
- [ ] **2.3** Минимальный, чистый дизайн

## Phase 3: Public Status Page `/` — адаптация

- [ ] **3.1** Header с названием "Status Pulse" + описание
- [ ] **3.2** Убрать FastAPI template стилистику
- [ ] **3.3** Footer с ссылкой на admin login
- [ ] **3.4** Адаптировать визуал (цвета, spacing)

## Phase 4: Admin Panel — адаптация

- [ ] **4.1** Sidebar header: Status Pulse branding вместо generic
- [ ] **4.2** Dashboard page: проверить что метрики актуальны
- [ ] **4.3** Общий визуальный polish

## Phase 5: Verify on Production

- [ ] **5.1** Build locally (`bun run build`) — проверить нет TS ошибок
- [ ] **5.2** Push → auto-deploy на Vercel
- [ ] **5.3** Проверить публичную страницу без авторизации
- [ ] **5.4** Проверить логин → dashboard
- [ ] **5.5** Проверить что signup, recover-password, reset-password URLs возвращают 404

## Файлы для изменения

```
frontend/src/routes/signup.tsx              — УДАЛИТЬ
frontend/src/routes/recover-password.tsx    — УДАЛИТЬ
frontend/src/routes/reset-password.tsx      — УДАЛИТЬ
frontend/src/routes/login.tsx               — Убрать ссылки signup/forgot, добавить branding
frontend/src/routes/index.tsx               — Адаптировать публичную страницу
frontend/src/routes/_layout.tsx             — Branding в layout
frontend/src/routes/_layout/index.tsx       — Dashboard адаптация
frontend/src/hooks/useAuth.ts               — Убрать signUpMutation
frontend/src/components/Sidebar/AppSidebar.tsx — Sidebar branding
frontend/src/routeTree.gen.ts               — Auto-regenerated
```
