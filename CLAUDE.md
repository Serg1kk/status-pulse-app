# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack web app based on the FastAPI template. Python/FastAPI backend + React/TypeScript frontend. Monorepo managed with Bun (frontend) and uv (backend).

## Commands

### Full Stack (Docker)

```bash
docker compose watch              # Start all services with hot reload
docker compose up -d --wait       # Start stack (detached)
docker compose stop frontend      # Stop one service to run locally instead
docker compose down -v            # Stop and remove volumes
```

### Frontend

```bash
bun run dev                       # Vite dev server at http://localhost:5173
bun run build                     # TypeScript check + Vite production build
bun run lint                      # Biome linter
bun run generate-client           # Regenerate OpenAPI client from backend schema
bunx playwright test              # Run E2E tests
bunx playwright test --ui         # Playwright UI mode
bunx playwright test tests/foo.spec.ts  # Run single test file
```

### Backend

```bash
cd backend
uv sync                           # Install Python dependencies
fastapi dev app/main.py           # Dev server at http://localhost:8000
pytest                            # Run all tests
pytest tests/api/routes/test_items.py  # Run single test file
pytest -x                         # Stop on first failure
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head              # Apply migrations
```

### Pre-commit Hooks (prek)

```bash
cd backend && uv run prek install -f   # Install hooks
uv run prek run --all-files            # Run manually on all files
```

Linters: ruff (Python), biome (frontend). Both run via prek on commit.

## Architecture

### Frontend (`frontend/`)

- **React 19** + TypeScript + **Vite 7**
- **TanStack Router** - file-based routing in `src/routes/`. Route tree auto-generated in `routeTree.gen.ts`
- **TanStack Query** - data fetching/caching. Query keys: `["currentUser"]`, `["users"]`, `["items"]`
- **shadcn/ui** + Radix UI + **Tailwind CSS 4** - component library in `src/components/ui/`
- **Auto-generated API client** (`src/client/`) - generated from backend OpenAPI schema via `@hey-api/openapi-ts` with Axios. Regenerate with `bun run generate-client`
- Path alias: `@` maps to `src/`

**Key patterns:**
- `src/routes/_layout.tsx` - protected layout requiring auth, renders sidebar
- `src/hooks/useAuth.ts` - auth management (login/signup/logout), JWT stored in localStorage
- `src/components/Common/ActionsMenu.tsx` - reusable actions pattern across Admin/Items
- Forms use React Hook Form + Zod validation

### Backend (`backend/`)

- **FastAPI** with **SQLModel** ORM (SQLAlchemy + Pydantic)
- **PostgreSQL** database, **Alembic** migrations in `app/alembic/`
- API routes at `app/api/routes/` (login, users, items, utils, private)
- Dependencies/DI in `app/api/deps.py` (`SessionDep`, `CurrentUser`)
- Config via Pydantic Settings in `app/core/config.py`
- JWT auth in `app/core/security.py`

**API base path:** `/api/v1`

### Infrastructure

- **Docker Compose**: `compose.yml` (prod) + `compose.override.yml` (dev overrides with volume mounts)
- **Traefik** reverse proxy - subdomain routing in production (`api.domain`, `dashboard.domain`)
- Services run on same ports locally whether Docker or native: backend `:8000`, frontend `:5173`
- **Mailcatcher** at `:1080` for dev email testing

## Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Adminer (DB) | http://localhost:8080 |
| Traefik | http://localhost:8090 |
| Mailcatcher | http://localhost:1080 |

## Environment

Root `.env` holds shared config (domain, secrets, DB passwords). Frontend `.env` has `VITE_API_URL`. Backend reads config through Pydantic Settings. Critical values to change before deploy: `SECRET_KEY`, `FIRST_SUPERUSER_PASSWORD`, `POSTGRES_PASSWORD`.

## Docs Structure

```
docs/
├── roadmap.md                        ← Общий roadmap проекта (stages, приоритеты)
├── backlog/                          ← Фичи проекта (каждая в своей папке)
│   ├── 001-status-pulse-base/        ← Фича 1: базовый MVP
│   │   ├── design.md                 ← Архитектура и дизайн-решения
│   │   └── plan.md                   ← Пошаговый план имплементации
│   ├── 002-next-feature/             ← Фича 2: ...
│   │   ├── design.md
│   │   └── plan.md
│   └── ...
├── help/                             ← Справочная документация
│   ├── subagent-frontmatter-reference.md  ← Формат субагентов Claude Code
│   └── mcp-vs-cli/                   ← MCP vs CLI исследования
│       └── railway-mcp-vs-cli.md
└── manifests/                        ← Манифесты агентов (из X0 Framework)
    └── agents/
        ├── devops.md                 ← Детальный воркфлоу DevOps
        └── devops.yaml              ← Метаданные DevOps
```

**ПРАВИЛО для superpowers skills (brainstorming, writing-plans и т.д.):**
- Дизайны и планы создавать **внутри фичи** в `docs/backlog/NNN-feature-name/`
- Нумерация фичей: `001`, `002`, `003` и т.д.
- Каждая фича содержит: `design.md` (brainstorming → дизайн) + `plan.md` (writing-plans → план)
- **НЕ** создавать файлы напрямую в `docs/` или `docs/plans/`
- Roadmap (`docs/roadmap.md`) ссылается на фичи в backlog

## Subagents (`.claude/agents/`)

Субагенты — специализированные AI-агенты для конкретных задач. Файлы `.md` с YAML frontmatter.

### Активные субагенты

| Агент | Файл | Когда вызывать |
|-------|------|----------------|
| **devops** | `.claude/agents/devops.md` | Деплой, инфраструктура, CI/CD, Railway, Vercel |

### Правило вызова

**ВСЕГДА вызывай субагента** через Agent tool когда задача попадает в его зону ответственности:
- Деплой на Vercel/Railway → `devops`
- Настройка переменных окружения → `devops`
- CI/CD, GitHub Actions → `devops`
- Мониторинг, домены → `devops`

### Добавление нового агента из X0 Framework

Источник: `https://github.com/Serg1kk/X0-Framework`

```bash
# Шаг 1: Скопировать промпт агента (адаптировать под проект!)
# X0: .x0/agents/prompts/core/<agent>.md → Проект: .claude/agents/<agent>.md
# ВАЖНО: добавить правильный frontmatter (name, description, model, tools)

# Шаг 2: Скопировать манифесты
# X0: .x0/agents/manifests/core/<agent>.md  → Проект: docs/manifests/agents/<agent>.md
# X0: .x0/agents/manifests/core/<agent>.yaml → Проект: docs/manifests/agents/<agent>.yaml

# Шаг 3: Обновить таблицу субагентов в этом CLAUDE.md
# Шаг 4: Записать в status-process.md
```

Доступные агенты в X0 Framework (core): `developer`, `devops`, `qa-engineer`, `researcher`, `technical-architect`, `implementation-plan-architect`, `implementation-plan-reviewer`, `feature-documentation-writer`

Справочник по frontmatter субагентов: `docs/help/subagent-frontmatter-reference.md`

## Deployment

- **Frontend** → Vercel (static Vite build, CDN)
- **Backend** → Railway (FastAPI + PostgreSQL, persistent processes)
- **MCP серверы:** Vercel MCP + Railway MCP подключены локально (см. `.mcp.json`)

## Tracking Changes (status-process.md)

**ОБЯЗАТЕЛЬНО:** Все инфраструктурные изменения трекать в `status-process.md` (корень проекта):

- Настройка и изменения деплоя (Vercel, Railway)
- Добавление/удаление/настройка MCP серверов
- Создание/изменение скиллов (`.claude/skills/`)
- Добавление/изменение команд (`.claude/commands/`)
- Добавление/удаление агентов
- Изменения в CI/CD, Docker, инфраструктуре

Формат записи: `[YYYY-MM-DD] action — description`
