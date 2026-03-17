# 003 — Frontend Customization: Technical Design

**Date:** 2026-03-16
**Author:** Implementation Plan Architect
**Status:** Approved
**Visual Spec:** `visual-design-spec.md` (approved, by Designer agent)

---

## Scope & Goal

Полный визуальный overhaul фронтенда: заменить FastAPI template branding на StatusPulse, применить дизайн-систему (`docs/design-system.md`), удалить лишние auth-страницы, добавить новые блоки на dashboard, создать кастомную 404 страницу.

**Подход:** Big bang — все изменения в один проход. Визуальный спек: `visual-design-spec.md`.

## Technical Approach

**Чисто фронтенд-фича.** Backend не затрагивается — все API endpoints уже существуют. Новые блоки на dashboard (Recent Activity, Services Overview) используют существующие endpoints:
- `GET /api/v1/incidents/` — для Recent Activity (сортировка по `updated_at`, первые 5)
- `GET /api/v1/services/` — для Services Overview (уже используется в stat cards)

**Порядок реализации критичен:**
1. CSS Foundation (токены) — первой, потому что всё остальное от неё зависит
2. Cleanup (удаление файлов) — вторым, чтобы не тратить время на стилизацию удаляемых страниц
3. Компоненты (Logo, AuthLayout, NotFound) — базовые блоки для страниц
4. Страницы (Login, Public Status, Dashboard, Sidebar) — используют обновлённые компоненты
5. Polish (favicon, title, fonts, animations) — финальные штрихи

## Key Decisions

| Решение | Выбор | Почему |
|---------|-------|--------|
| Backend changes | Нет | Все API уже есть |
| CSS approach | Замена токенов в index.css | shadcn/ui подхватит автоматически |
| Logo | Текстовый `◆ StatusPulse` | Нет кастомного SVG, design-system prescribed |
| Recent Activity data | Incidents API | Service status history API не существует |
| Hardcoded colors | Заменить на semantic tokens | `text-green-600` → design system equivalents |
| Stat card trend indicator | Опустить | API не даёт historical comparison data |
| Design system update | Обновить section 5.2 | Добавить icon pill pattern для stat cards |

## Dependencies

- **001-status-pulse-base** — done
- **CORS** — проверено на Railway: `FRONTEND_HOST=https://statuspulse.vercel.app`, настроен
- **002-testing-setup** — обновлён readme с учётом удаляемых страниц

## Risks

| Риск | Митигация |
|------|-----------|
| Сломать существующие shadcn/ui компоненты при смене токенов | `bun run build` после CSS changes, визуальная проверка |
| TanStack Router route tree после удаления роутов | Авто-генерация `routeTree.gen.ts` при `bun run dev` |
| Missing `--destructive-foreground` token | Добавить в CSS Foundation |

## Out of Scope

- Backend изменения
- Admin pages (services, incidents, settings, admin) — наследуют токены автоматически
- Новые API endpoints
- Responsive/mobile специфичные адаптации (кроме grid breakpoints из спека)

---

## File Map

### Удалить (3 роута + 4 SVG)
- `frontend/src/routes/signup.tsx`
- `frontend/src/routes/recover-password.tsx`
- `frontend/src/routes/reset-password.tsx`
- `frontend/public/assets/images/fastapi-icon.svg`
- `frontend/public/assets/images/fastapi-icon-light.svg`
- `frontend/public/assets/images/fastapi-logo.svg`
- `frontend/public/assets/images/fastapi-logo-light.svg`

### Создать (1)
- `frontend/public/favicon.svg` — indigo diamond

### Major Rewrite (8)
- `frontend/src/index.css` — все CSS токены (`:root` + `.dark`)
- `frontend/src/components/Common/Logo.tsx` — текстовый `◆ StatusPulse`
- `frontend/src/components/Common/AuthLayout.tsx` — centered card layout
- `frontend/src/components/Common/NotFound.tsx` — кастомная 404 page
- `frontend/src/routes/login.tsx` — убрать ссылки, добавить branding
- `frontend/src/routes/index.tsx` — публичная страница redesign
- `frontend/src/routes/_layout/index.tsx` — dashboard с новыми блоками
- `frontend/src/components/StatusPage/OverallStatus.tsx` — pulsating banner

### Modify (5)
- `frontend/index.html` — title, fonts, favicon
- `frontend/src/hooks/useAuth.ts` — убрать signUpMutation
- `frontend/src/components/Sidebar/AppSidebar.tsx` — sidebar styling
- `frontend/src/components/StatusPage/ServiceList.tsx` — row styling
- `frontend/src/components/StatusPage/IncidentList.tsx` — timeline style

### Auto-generated (не трогаем руками)
- `frontend/src/routeTree.gen.ts` — regenerated при dev server

### Не трогаем (наследуют токены автоматически)
- `_layout/services.tsx`, `_layout/incidents.tsx`, `_layout/settings.tsx`, `_layout/admin.tsx`
- `ActionsMenu.tsx`

---

## Phases

| Phase | Что | Зависимости | Тип |
|-------|-----|-------------|-----|
| 1 | CSS Foundation + fonts + favicon | — | Frontend |
| 2 | Cleanup: удалить роуты + signUpMutation + FastAPI SVGs | — | Frontend |
| 3 | Components: Logo, AuthLayout, NotFound | Phase 1 (токены) | Frontend |
| 4 | Login page | Phase 2 + 3 | Frontend |
| 5 | Public Status Page + OverallStatus + ServiceList + IncidentList | Phase 1 + 3 | Frontend |
| 6 | Dashboard: stat cards + Recent Activity + Services Overview | Phase 1 + 3 | Frontend |
| 7 | Sidebar restyle | Phase 1 + 3 | Frontend |
| 8 | Polish: animations, hardcoded colors cleanup, design-system.md update | All above | Frontend |

Все фазы — **Frontend only**. Backend не затрагивается.

---

## Acceptance Criteria

### Functional
- [ ] Нет упоминаний FastAPI нигде в UI (текст, SVG, title, favicon)
- [ ] Login работает: email + password, без ссылок на signup/forgot
- [ ] Публичная страница показывает сервисы и инциденты с новым стилем
- [ ] Dashboard показывает 4 stat cards + Recent Activity + Services Overview
- [ ] 404 страница кастомная в стиле StatusPulse
- [ ] Sidebar: тёмный navy в обоих темах (light + dark)
- [ ] Theme toggle работает (light/dark/system)

### Visual
- [ ] Шрифты: Plus Jakarta Sans (UI) + JetBrains Mono (числа, timestamps)
- [ ] Цвета: indigo primary, warm gray background, dark navy sidebar
- [ ] Favicon: indigo diamond SVG
- [ ] Анимации: fadeIn на карточках, pulsating dot на статусе

### Technical
- [ ] `bun run build` проходит без ошибок
- [ ] `bun run lint` проходит
- [ ] Нет hardcoded Tailwind colors (`text-green-600` и т.д.) — только semantic tokens
- [ ] `routeTree.gen.ts` не содержит удалённых роутов
- [ ] `docs/design-system.md` section 5.2 обновлена (icon pill pattern)

### Verification
- [ ] Визуальная проверка всех страниц в браузере (light + dark mode)
- [ ] Login → Dashboard flow работает
- [ ] Public status page доступна без авторизации
