# Status Process

Статус проекта StatusPulse: история, инфраструктура, деплой, инструментарий.

---

## Project URLs

| Сервис | URL | Платформа |
|--------|-----|-----------|
| **Frontend** | https://status-pulse-app-frontend.vercel.app | Vercel |
| **Backend API** | https://backend-production-276a.up.railway.app | Railway |
| **Swagger UI** | https://backend-production-276a.up.railway.app/docs | Railway |
| **Health Check** | https://backend-production-276a.up.railway.app/api/v1/utils/health-check/ | Railway |
| **GitHub Repo** | https://github.com/Serg1kk/status-pulse-app | GitHub |
| **Railway Dashboard** | https://railway.com/project/a536eb07-6dd6-43d0-a8e7-c4b74727523c | Railway |

---

## Project History (для демки)

### Происхождение
- **Базовый шаблон:** [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template) от Tiangolo (автора FastAPI)
- **Что это:** production-ready full-stack шаблон: FastAPI + React + PostgreSQL + Docker + Traefik + CI/CD
- **Что мы с ним сделали:** клонировали и переделали в StatusPulse — сервис мониторинга статуса сервисов

### Что доработали из шаблона
1. **Заменили Item модель** → Service + HealthCheck + Incident (status page)
2. **Публичная страница статуса** — без авторизации, auto-refresh каждые 30 сек
3. **Админ-панель** — управление сервисами и инцидентами (CRUD)
4. **Background health checker** — async задача в FastAPI lifespan, пингует сервисы каждые 60 сек
5. **Auto-incidents** — автоматическое создание/закрытие инцидентов при падении/восстановлении

### Инфраструктура и инструментарий (обвязка Claude Code)
1. **MCP серверы** — Vercel + Railway (локально в `.mcp.json`)
2. **Субагент DevOps** — `.claude/agents/devops.md` (первый агент из X0 Framework)
3. **Манифесты агентов** — `docs/manifests/agents/` (из X0 Framework)
4. **Agent Learnings** — `docs/agent-learnings/` (самоулучшение промптов через логирование ошибок)
5. **Session History** — `session-history/` + команда `/save-session`
6. **Docs структура:**
   - `docs/roadmap.md` — roadmap проекта
   - `docs/conventions/` — конвенции по доменам (git, testing, devops)
   - `docs/ADR/` — Architecture Decision Records (4 записи)
   - `docs/backlog/active/` — текущие фичи (002-testing, 003-frontend)
   - `docs/backlog/archived/` — завершённые фичи (001-base)
   - `docs/help/` — справочники (subagent frontmatter, MCP vs CLI, agent manifests, adaptation guide)
   - `docs/agent-learnings/` — лог ошибок агентов
   - `docs/manifests/` — манифесты агентов (адаптированные под проект)

### Деплой
- **Frontend** → Vercel (static Vite build, GitHub integration, auto-deploy on push)
- **Backend** → Railway (Dockerfile.railway, ручной deploy через MCP/CLI)
- **PostgreSQL** → Railway (managed, reference variables)
- **Разделение:** git push триггерит Vercel автоматически, Railway — вручную

### Стек технологий
- **Backend:** FastAPI + SQLModel + PostgreSQL + Alembic + uv
- **Frontend:** React 19 + TypeScript + Vite 7 + TanStack Router/Query + shadcn/ui + Tailwind 4
- **Тесты:** pytest (backend) + Playwright (E2E) — от оригинального шаблона, нужна адаптация
- **CI/CD:** GitHub Actions (workflows от шаблона, нужна адаптация)

---

## MCP Servers

### Vercel MCP
- **Статус:** подключен, авторизован
- **Endpoint:** `https://mcp.vercel.com` (remote, OAuth)
- **Возможности:** docs search, list projects/deployments, build logs
- **Ограничение:** `deploy_to_vercel` tool не деплоит (информационный)

### Railway MCP
- **Статус:** подключен, авторизован
- **Package:** `@railway/mcp-server` (npx, обёртка над CLI)
- **Возможности:** create/list projects/services, deploy, set vars, get logs
- **Ограничения:** нет delete/restart, проблемы с типизацией массивов/чисел
- **Паттерн:** MCP для чтения → CLI для записи

---

## Agents

| Агент | Файл | Источник |
|-------|------|----------|
| DevOps | `.claude/agents/devops.md` | X0 Framework (адаптирован) |
| Designer | `.claude/agents/designer.md` | X0 Framework (core + specialized/design merged, адаптирован) |
| Implementation Plan Architect | `.claude/agents/implementation-plan-architect.md` | X0 Framework (адаптирован), режим РОЛИ |
| Implementation Plan Reviewer | `.claude/agents/implementation-plan-reviewer.md` | X0 Framework (адаптирован), субагент |

---

## Commands

| Команда | Файл | Назначение |
|---------|------|-----------|
| `/save-session` | `.claude/commands/save-session.md` | Выжимка текущей сессии |

---

## Changelog

| Дата | Действие | Описание |
|------|----------|----------|
| 2026-03-15 | Project created | Клон FastAPI template, доработка в StatusPulse (Service/HealthCheck/Incident) |
| 2026-03-16 | MCP added | Vercel MCP + Railway MCP (локально в `.mcp.json`) |
| 2026-03-16 | Agent added | DevOps субагент из X0 Framework |
| 2026-03-16 | Docs restructure | roadmap, backlog, help, manifests, agent-learnings |
| 2026-03-16 | Deploy: Railway | Backend + PostgreSQL на Railway (Dockerfile.railway) |
| 2026-03-16 | Deploy: Vercel | Frontend на Vercel (GitHub integration) |
| 2026-03-16 | Command added | `/save-session` — сохранение истории сессии |
| 2026-03-16 | CLAUDE.md | Полная конфигурация: subagents, agent-learnings, session history, docs structure |
| 2026-03-16 | Fix: TS build | Route tree (items→services), Zod v4 + RHF v5 типы |
| 2026-03-16 | Fix: Dockerfile | Railway-совместимый Dockerfile без BuildKit cache mounts |
| 2026-03-16 | Agent adapted | DevOps манифесты адаптированы под проект (убран GitHub MCP, npm→bun/uv, добавлены Railway/Vercel specifics) |
| 2026-03-16 | Docs added | `docs/help/agent-manifest-adaptation-guide.md` — гайд по адаптации манифестов |
| 2026-03-16 | CLAUDE.md | Добавлено правило обязательной адаптации агентов при добавлении |
| 2026-03-16 | Backlog | 003-frontend-customization — адаптация UI под Status Pulse |
| 2026-03-16 | Docs created | `docs/conventions/` — конвенции по доменам (git, testing, devops) |
| 2026-03-16 | Docs created | `docs/ADR/` — 4 ADR (deploy split, Dockerfile, MCP+CLI, no-signup) |
| 2026-03-16 | CLAUDE.md | Секция Conventions & ADR, логика работы агентов с conventions/ADR |
| 2026-03-16 | Agent updated | DevOps промпт + манифест обновлены: ссылки на conventions/ADR |
| 2026-03-16 | Git cleanup | git push origin master; удалены все remote ветки кроме master (13 веток: dependabot/* + feature ветки) |
| 2026-03-16 | Backlog restructure | Разделение на `active/` и `archived/`; 001-base → archived, 002/003 → active; логика workflow в CLAUDE.md |
| 2026-03-16 | CLAUDE.md | Секция "Git-операции — ТОЛЬКО через DevOps": абсолютный запрет git-мутаций из основного контекста, делегирование DevOps-субагенту |
| 2026-03-16 | Docs added | `docs/help/skill-creator-vs-writing-skills.md` — справочник по различиям skill-creator и writing-skills |
| 2026-03-16 | Design system | `docs/design-system.md` — дизайн-бук проекта (Dreams Timer ref, OKLCH, Plus Jakarta Sans, dark sidebar) |
| 2026-03-16 | Agent added | Designer субагент из X0 Framework (core + specialized/design merged, адаптирован). Использует `document-skills:frontend-design` skill |
| 2026-03-16 | Git commit | feat(infra): Designer agent + design system (6971594) — Designer agent, design-system.md, manifests, research references, CLAUDE.md update |
| 2026-03-16 | Agent added | Implementation Plan Architect из X0 Framework (адаптирован). Режим РОЛИ — brainstorming + writing-plans skills. Промпт + манифесты |
| 2026-03-16 | Agent added | Implementation Plan Reviewer из X0 Framework (адаптирован). Субагент через Agent tool. Quality gate для планов. Промпт + манифесты |
| 2026-03-16 | CLAUDE.md | Обновлена секция Subagents: architect (роль) + reviewer (субагент), правила вызова, docs structure |
| 2026-03-16 | Git commit | feat(infra): add Implementation Plan Architect + Reviewer agents — агенты из X0 Framework, манифесты, CLAUDE.md update |
| 2026-03-16 | Git commit | docs(backlog): restructure 003-frontend-customization + session history (e23b4b3) — readme.md + visual-design-spec.md вместо design.md + plan.md, session history с исправленным timestamp |
