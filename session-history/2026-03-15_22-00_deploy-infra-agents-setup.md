---
date: 2026-03-15
time: "22:00"
duration_approx: ~3h
participants: user + claude
---

# Деплой на Vercel+Railway, MCP серверы, DevOps агент, инфраструктура проекта

## Цель сессии
Развернуть StatusPulse на Vercel (frontend) и Railway (backend + PostgreSQL), настроить MCP серверы, внедрить DevOps агента, создать инфраструктуру docs и инструментарий для дальнейшей разработки.

## Что сделали

### 1. MCP серверы
- Подключили **Vercel MCP** (HTTP, OAuth) и **Railway MCP** (npx, CLI-обёртка) локально в `.mcp.json`
- Проверили авторизацию обоих: Vercel — 9 проектов, Railway — Sergey's Projects
- Создали и удалили тестовый проект на Railway для проверки
- Задокументировали ограничения MCP vs CLI в `docs/help/mcp-vs-cli/`

### 2. Деплой на Railway (Backend)
- Создали проект `statuspulse` на Railway
- Добавили PostgreSQL сервис
- Настроили 13 env vars с reference variables (`${{Postgres.PGHOST}}` и т.д.)
- **Проблема 1:** Railpack (авто-детектор) вместо Dockerfile → создали `railway.toml`
- **Проблема 2:** BuildKit cache mounts не поддерживаются → создали `backend/Dockerfile.railway`
- Сгенерировали домен: `https://backend-production-276a.up.railway.app`
- Health check проходит: `true`

### 3. Деплой на Vercel (Frontend)
- Vercel MCP `deploy_to_vercel` не деплоит (информационный tool)
- Vercel CLI требует интерактивный login → пользователь залогинился через Dashboard
- Подключил GitHub repo через Vercel Dashboard (root: `frontend/`, build: `bun run build`)
- **Проблема 3:** TS ошибки при билде: route tree устаревший (items → services/incidents)
- **Проблема 4:** `z.coerce.number()` несовместим с RHF v5 + Zod v4 → заменили на `z.number()`
- Фронтенд работает: `https://status-pulse-app-frontend.vercel.app`

### 4. DevOps агент (из X0 Framework)
- Скачали промпт и манифесты из `github.com/Serg1kk/X0-Framework`
- Создали `.claude/agents/devops.md` с правильным Claude Code frontmatter
- Скопировали манифесты в `docs/manifests/agents/devops.{md,yaml}`
- Исследовали формат субагентов через claude-code-guide (все поля frontmatter)
- Создали справочник `docs/help/subagent-frontmatter-reference.md`

### 5. Инфраструктура docs
- Реструктурировали `docs/`: roadmap, backlog/, help/, manifests/, agent-learnings/
- Перенесли design.md и plan.md в `docs/backlog/001-status-pulse-base/`
- Создали `docs/help/agent-manifests.md` (inline vs отдельные манифесты)
- Создали `docs/agent-learnings/` с 6 записями из текущей сессии
- Создали `docs/backlog/002-testing-setup/design.md` — план адаптации тестов

### 6. Команды и инструменты
- Создали `/save-session` команду (`.claude/commands/save-session.md`)
- Создали `session-history/` папку
- Обновили `status-process.md` — полная история проекта, URLs, стек

### 7. CLAUDE.md — полная конфигурация
- Custom Commands (`/save-session`)
- Session History
- Testing (правило test-before-deploy)
- Docs Structure (backlog, help, manifests, agent-learnings)
- Subagents (DevOps + инструкция добавления из X0 Framework)
- Agent Learnings (автоматическое логирование ошибок)
- Deployment (Vercel + Railway)
- Tracking Changes (авто-обновление status-process.md)

## Ключевые решения
- **Railway PostgreSQL** вместо Supabase — одна платформа с бэкендом, проще настройка
- **Автодомены** вместо кастомных — быстрее для демки
- **Отдельный Dockerfile.railway** — Railway не поддерживает BuildKit
- **Отдельные манифесты** агентов (не inline) — совместимость с X0 Framework, масштабируемость
- **MCP для чтения, CLI для записи** — паттерн работы с Railway MCP

## Созданные / изменённые файлы
- `CLAUDE.md` — полностью переработан (subagents, testing, agent-learnings, session history)
- `.mcp.json` — Vercel + Railway MCP серверы
- `.claude/agents/devops.md` — DevOps субагент
- `.claude/commands/save-session.md` — команда сохранения сессии
- `backend/Dockerfile.railway` — Railway-совместимый Dockerfile
- `railway.toml` — конфиг Railway (dockerfilePath, healthcheck)
- `status-process.md` — полная история проекта с URLs
- `docs/roadmap.md` — roadmap (Stage 1 done, Stage 2 planned)
- `docs/backlog/001-status-pulse-base/` — перенесены design.md + plan.md
- `docs/backlog/002-testing-setup/design.md` — план адаптации тестов
- `docs/help/mcp-vs-cli/railway-mcp-vs-cli.md` — MCP vs CLI анализ
- `docs/help/subagent-frontmatter-reference.md` — справочник субагентов
- `docs/help/agent-manifests.md` — inline vs отдельные манифесты
- `docs/manifests/agents/devops.{md,yaml}` — манифесты DevOps из X0
- `docs/agent-learnings/README.md` — система логирования ошибок
- `docs/agent-learnings/devops/` — 6 записей из сессии
- `frontend/src/routeTree.gen.ts` — перегенерирован (items → services/incidents)
- `frontend/src/components/Services/AddService.tsx` — fix z.coerce → z.number
- `frontend/src/components/Services/EditService.tsx` — fix z.coerce → z.number
- `frontend/src/components/Incidents/AddIncident.tsx` — fix .default() на enum

## Незавершённые задачи
- [ ] **002-testing-setup** — адаптация тестов (backend pytest + Playwright E2E) + CI/CD
- [ ] Отключить или починить фейлящие GitHub Actions workflows
- [ ] Обновить промпт DevOps агента рекомендациями из agent-learnings (6 записей → incorporated)
- [ ] Настроить auto-deploy Railway при push (сейчас ручной через MCP/CLI)
- [ ] Обновить CORS/FRONTEND_HOST на Railway с правильным Vercel URL

## Ошибки и workaround'ы
- Railway Railpack вместо Dockerfile → `railway.toml` с `dockerfilePath`
- Railway BuildKit cache mounts → отдельный `Dockerfile.railway` без `--mount`
- Railway MCP: массивы/числа не передаются → CLI fallback
- Railway MCP: нет delete → CLI `railway delete`
- Vercel MCP deploy не деплоит → CLI или Dashboard
- Vercel CLI login интерактивный → пользователь логинится вручную
- TanStack Router route tree устаревший → ручная перегенерация
- Zod v4 `z.coerce.number()` + RHF v5 → `z.number()` + `Number(e.target.value)`

## Контекст для следующей сессии
**Деплой работает:** Frontend на Vercel (`https://status-pulse-app-frontend.vercel.app`), Backend на Railway (`https://backend-production-276a.up.railway.app`). Health check проходит. PostgreSQL на Railway с reference variables.

**Следующий приоритет:** фича 002-testing-setup. План в `docs/backlog/002-testing-setup/design.md`. Нужно: удалить test_items, создать test_services/test_incidents/test_public, адаптировать Playwright items.spec → services.spec, починить GitHub Actions.

**GitHub Actions фейлят** при каждом push (4 workflows от шаблона). Нужно либо починить, либо отключить.

**Railway деплой ручной** — через `mcp__railway__deploy` или `railway deploy` CLI. Для auto-deploy нужно привязать GitHub repo в Railway Dashboard.

**Credentials:** admin@statuspulse.app / в env var `FIRST_SUPERUSER_PASSWORD` на Railway. SECRET_KEY сгенерирован.

## Коммиты этой сессии
- `feb549c` — feat: add deployment infra, DevOps agent, docs restructure
- `fa3fcf1` — fix: add railway.toml to use Dockerfile instead of Railpack
- `387081c` — fix: add Railway-compatible Dockerfile without BuildKit cache mounts
- `aac47cc` — fix: fix TypeScript build errors for Vercel deployment
- `b62aa08` — fix: replace z.coerce.number() with z.number() for RHF v5 + Zod v4
- `d728534` — docs: full project history in status-process.md, testing instructions
- `2c0eeed` — docs: add 002-testing-setup to backlog
