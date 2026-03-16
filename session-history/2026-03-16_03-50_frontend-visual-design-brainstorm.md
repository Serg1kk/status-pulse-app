---
date: 2026-03-16
time: "03:50"
duration_approx: ~1h 30m
participants: user + claude (Designer role)
---

# Brainstorming визуального дизайна для фичи 003-frontend-customization

## Цель сессии
Провести brainstorming-сессию по визуальному дизайну фронтенда StatusPulse: определить направление для каждой страницы, создать мокапы, написать и отревьюить design spec.

## Что сделали

### Блок 1: Аудит текущего фронтенда
- Прочитали все ключевые файлы: login.tsx, index.tsx (public page), dashboard, sidebar, Logo.tsx, AuthLayout.tsx, index.css
- Выявили огромный gap между текущим состоянием и design system:
  - CSS tokens - дефолтный shadcn (teal primary, нет navy hue)
  - Sidebar светлый (не тёмный navy)
  - FastAPI логотипы и branding повсюду
  - Шрифты не подключены (нет Plus Jakarta Sans / JetBrains Mono)
  - Status colors через Tailwind defaults вместо OKLCH
  - Фон чисто белый вместо warm gray

### Блок 2: Visual Companion + Brainstorming
- Запустили visual companion server (superpowers brainstorming skill) для показа мокапов в браузере
- Прошли 5 clarifying questions one-by-one:
  1. Login layout → **Centered card** (не split 2-column)
  2. Public page scope → **Visual redesign** (не просто token swap)
  3. Dashboard scope → **Расширенный** (stat cards + 2 новых блока)
  4. Sidebar scope → **Restyle only** (dark navy, без новых элементов)
  5. 404 + мелочи → **Кастомная 404**, новый favicon, новые titles
- Approach → **Big bang** (всё за один проход)

### Блок 3: Мокапы в браузере
Создали визуальные мокапы для user approval (в `.superpowers/brainstorm/`):
- `login-layout.html` — 3 варианта login page (выбран B: centered card)
- `public-page.html` — redesign public status page с uptime bars, timeline incidents
- `dashboard.html` — dashboard с stat cards (icon pills) + Recent Activity + Services Overview + dark navy sidebar
- `page-404.html` — ghosted 404, search-minus icon, две кнопки

### Блок 4: Design Spec
- Написали полный `visual-design-spec.md` — 7 секций (CSS Foundation, Cleanup, Login, Public Page, Dashboard, Sidebar, 404)
- Запустили spec-document-reviewer subagent — нашёл 10 issues
- Исправили все ключевые issues:
  - 404 path: `__404.tsx` → rewrite существующего `NotFound.tsx`
  - Missing admin pages: добавили "Out of Scope" секцию
  - Recent Activity data source: уточнили — incidents API only
  - `--destructive-foreground` token: добавили
  - Dark mode values: уточнили — обе блоки `:root` и `.dark` целиком
  - Stat card deviation от design system: добавили note

### Блок 5: Реорганизация файлов фичи
- Объединили старые `design.md` + `plan.md` в `readme.md` (вводные данные)
- Удалили `design.md` и `plan.md`

## Ключевые решения
- **Login: centered card** — минимализм, совпадает с design system, не split layout
- **Public page: visual redesign** — uptime bars, timeline incidents, pulsating status banner
- **Dashboard: расширенный** — добавили Recent Activity (incidents feed) и Services Overview (compact list with status pills)
- **Sidebar: restyle only** — dark navy, без новых функциональных элементов
- **404: кастомная** — ghosted number, search icon, Go Home + Status Page buttons
- **Big bang approach** — всё за один проход, не инкрементально
- **Stat cards с icon pills** — расширение design system (deviation отмечен в spec)
- **Recent Activity** — только incidents (API service status change history не существует)

## Созданные / изменённые файлы
- `docs/backlog/active/003-frontend-customization/visual-design-spec.md` — **СОЗДАН** — полный визуальный design spec (7 секций, исправлен после review)
- `docs/backlog/active/003-frontend-customization/readme.md` — **СОЗДАН** — объединённые вводные данные из design.md + plan.md
- `docs/backlog/active/003-frontend-customization/design.md` — **УДАЛЁН** (объединён в readme.md)
- `docs/backlog/active/003-frontend-customization/plan.md` — **УДАЛЁН** (объединён в readme.md)
- `.superpowers/brainstorm/75439-1773622930/` — мокапы (login-layout.html, public-page.html, dashboard.html, page-404.html)

## Незавершённые задачи
- [ ] **Implementation plan** — создать детальный план на основе visual-design-spec.md (пользователь будет делать в отдельной сессии через writing-plans skill)
- [ ] **CORS fix** — prerequisite для деплоя (P0 в readme.md), нужен DevOps agent
- [ ] **Коммит** — изменения не закоммичены (spec + readme + удаление старых файлов)

## Ошибки и workaround'ы
- Spec reviewer нашёл что 404 page path был указан неверно (`__404.tsx` вместо rewrite `NotFound.tsx`) — исправлено. TanStack Router использует `notFoundComponent` в `__root.tsx`, а не file-based 404 route.
- Spec reviewer нашёл что Recent Activity block ссылался на несуществующий API (service status change history) — ограничили scope только incidents.

## Контекст для следующей сессии
**Состояние:** Visual design spec готов и отревьюен. Нужно создать implementation plan (`writing-plans` skill) и затем имплементировать.

**Файлы фичи:**
- `docs/backlog/active/003-frontend-customization/readme.md` — вводные данные
- `docs/backlog/active/003-frontend-customization/visual-design-spec.md` — детальный spec для имплементации

**Design system:** `docs/design-system.md` — OKLCH tokens, все CSS values для copy-paste в index.css (section 13).

**Мокапы:** `.superpowers/brainstorm/75439-1773622930/` — HTML мокапы для визуальной референции.

**Approach:** Big bang — все изменения за один проход. Порядок внутри: CSS tokens → cleanup FastAPI → Logo → Login → Public Page → Dashboard → Sidebar → 404.

**Важно для имплементации:**
- NotFound.tsx (404) — rewrite существующего файла, не создание нового
- Admin pages (services, incidents, settings, admin) — out of scope, inherit tokens only
- Recent Activity — данные из incidents API (sort by updated_at), не service status history
- `--destructive-foreground` — не забыть добавить (shadcn needs it)
- Stat cards с icon pills — это extension design system, обновить design-system.md section 5.2

## Коммиты этой сессии
- _(нет коммитов — изменения не закоммичены)_
