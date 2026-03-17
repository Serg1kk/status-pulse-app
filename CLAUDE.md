# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack web app based on the FastAPI template. Python/FastAPI backend + React/TypeScript frontend. Monorepo managed with Bun (frontend) and uv (backend).

## Custom Commands

### `/work-on-feature` — Полный цикл работы над фичей
Запускает пайплайн от brainstorm до деплоя: дизайн → план → ревью → реализация (BE+FE параллельно) → QA → деплой → архивация.

```
/work-on-feature docs/backlog/active/NNN-feature-name/
```

Фича должна содержать как минимум `readme.md`. Скилл читает все файлы в папке для контекста.
Полная логика: `.claude/commands/work-on-feature.md`

### `/save-session` — Сохранить историю сессии
Создаёт детальную выжимку текущего чата в `session-history/YYYY-MM-DD_HH-MM_slug.md`.
Вызывай в конце сессии перед переходом в новый чат.

## Session History (`session-history/`)

Папка с выжимками прошлых сессий. **При старте новой сессии** — если пользователь просит "прочитай последний session history", прочитай последний файл из этой папки для контекста.

## Дата и время

**Часовой пояс пользователя:** UTC+3 (Europe/Moscow)

**ПРАВИЛО:** Перед созданием или обновлением файлов, где требуется указание даты/времени (session history, changelog, frontmatter, commit messages), **ВСЕГДА проверяй текущее время** командой `date "+%Y-%m-%d %H:%M %Z"`. НЕ угадывай время — Claude не знает текущее время без проверки. Это касается:
- `session-history/YYYY-MM-DD_HH-MM_slug.md` (имя файла + frontmatter)
- `status-process.md` (даты в changelog)
- Любых frontmatter с полями `date`, `time`, `created_at`, `updated_at`

---

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

### Testing

Быстрый справочник команд. Полные конвенции: `docs/conventions/testing.md`

```bash
cd backend && pytest                          # Backend: все тесты
cd backend && pytest -x                       # Backend: стоп на первом фейле
cd frontend && bunx playwright test           # Frontend: все E2E
cd frontend && bunx playwright test --ui      # Frontend: UI режим
```

**ПРАВИЛО:** тесты ВСЕГДА перед деплоем → `docs/conventions/testing.md`

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
├── conventions/                      ← Конвенции проекта (по доменам)
│   ├── README.md                     ← Индекс с тегами агентов
│   ├── git.md                        ← Git: коммиты, ветки, PR
│   ├── testing.md                    ← Тесты: workflow, pytest, Playwright
│   └── devops.md                     ← DevOps: деплой, env vars, Docker, CORS
├── ADR/                              ← Architecture Decision Records
│   ├── README.md                     ← Индекс с тегами агентов
│   ├── ADR-001-deploy-split-vercel-railway.md
│   ├── ADR-002-railway-dockerfile-no-buildkit.md
│   ├── ADR-003-mcp-read-cli-write.md
│   └── ADR-004-no-signup-login-only.md
├── backlog/                          ← Фичи проекта
│   ├── active/                       ← Текущие фичи в работе
│   │   ├── 002-testing-setup/
│   │   └── 003-frontend-customization/
│   └── archived/                     ← Завершённые фичи
│       └── 001-status-pulse-base/
│           ├── design.md
│           └── plan.md
├── help/                             ← Справочная документация
│   ├── subagent-frontmatter-reference.md  ← Формат субагентов Claude Code
│   ├── agent-manifest-adaptation-guide.md ← Гайд по адаптации манифестов
│   └── mcp-vs-cli/                   ← MCP vs CLI исследования
│       └── railway-mcp-vs-cli.md
├── design-system.md                  ← Дизайн-бук (цвета, типографика, компоненты)
├── manifests/                        ← Манифесты агентов (адаптированные)
│   └── agents/
│       ├── frontend-developer.md     ← Воркфлоу Frontend Developer
│       ├── frontend-developer.yaml  ← Метаданные Frontend Developer
│       ├── backend-developer.md     ← Воркфлоу Backend Developer
│       ├── backend-developer.yaml   ← Метаданные Backend Developer
│       ├── devops.md                 ← Детальный воркфлоу DevOps
│       ├── devops.yaml              ← Метаданные DevOps
│       ├── designer.md              ← Детальный воркфлоу Designer
│       ├── designer.yaml            ← Метаданные Designer
│       ├── qa-engineer.md                    ← Воркфлоу QA Engineer
│       ├── qa-engineer.yaml                  ← Метаданные QA Engineer
│       ├── implementation-plan-architect.md  ← Воркфлоу архитектора планов
│       ├── implementation-plan-architect.yaml
│       ├── implementation-plan-reviewer.md   ← Воркфлоу ревьюера планов
│       └── implementation-plan-reviewer.yaml
└── agent-learnings/                  ← Лог ошибок и workaround-ов агентов
    └── README.md
```

## Conventions & ADR

### Conventions (`docs/conventions/`)

Конвенции проекта разбиты по доменам. Каждый файл помечен тегами — какие агенты его читают.

| Файл | Домен | Агенты |
|------|-------|--------|
| `conventions/git.md` | Git коммиты, ветки, PR | все |
| `conventions/testing.md` | Тесты, linters, workflow | developer, qa-engineer, devops |
| `conventions/devops.md` | Деплой, env vars, Docker, CORS | devops |

**ПРАВИЛО при вызове субагентов:** передавай в промпт ссылки на релевантные конвенции:
> Перед работой прочитай конвенции: `docs/conventions/git.md`, `docs/conventions/<domain>.md`

### ADR (`docs/ADR/`)

Architecture Decision Records — записи о принятых архитектурных решениях. Каждый ADR помечен тегами.

**Как агенты работают с ADR:**
- Перед инфра-задачей DevOps читает ADR с тегами `devops`, `infra`, `docker`
- Перед фронтенд-задачей developer читает ADR с тегами `frontend`, `architecture`
- ADR README содержит таблицу тегов → агентов

**ПРАВИЛО при вызове субагентов:** передавай в промпт:
> Проверь релевантные ADR в `docs/ADR/README.md` (читай только со своими тегами)

**Когда создавать новый ADR:**
- Выбор технологии/платформы
- Архитектурное решение которое сложно откатить
- Решение от которого зависят другие части системы
- НЕ создавать для мелочей (стиль кода, naming)

---

**ПРАВИЛО для superpowers skills (brainstorming, writing-plans и т.д.):**
- Дизайны и планы создавать **внутри фичи** в `docs/backlog/active/NNN-feature-name/`
- Нумерация фичей: `001`, `002`, `003` и т.д.
- Каждая фича содержит: `readme.md` (описание фичи) + `design.md` (brainstorming → дизайн) + `plan.md` (writing-plans → план)
- **НЕ** создавать файлы напрямую в `docs/` или `docs/plans/`
- Roadmap (`docs/roadmap.md`) ссылается на фичи в backlog

**ПРАВИЛО создания фичи в backlog:**
- При создании новой фичи (из roadmap или с нуля) — создаётся ТОЛЬКО `readme.md` с контекстом фичи (цель, scope, зависимости, что есть сейчас)
- **НЕ создавать** `design.md` и `plan.md` при создании фичи — они создаются ТОЛЬКО в процессе работы:
  - `design.md` — результат brainstorming skill (интерактивная проработка с пользователем)
  - `plan.md` — результат writing-plans skill (декомпозиция на задачи)
- `readme.md` — обёртка/контекст, заполняется заранее. `design.md` и `plan.md` — артефакты процесса разработки.

### Backlog Workflow (`docs/backlog/`)

Бэклог разделён на две папки:

```
docs/backlog/
├── active/       ← Фичи в работе (текущие и запланированные)
└── archived/     ← Завершённые фичи (для истории)
```

**Жизненный цикл фичи:**
1. Создание: `docs/backlog/active/NNN-feature-name/` с `readme.md` (контекст фичи)
2. Проработка: brainstorming → `design.md`, writing-plans → `plan.md`
3. Работа: агенты (architect, developer, qa, devops) работают по плану
4. Завершение: после деплоя и подтверждения — перемещаем в `archived/`

**Когда перемещать в archived:**
- Все задачи из `plan.md` выполнены
- Тесты проходят
- Деплой в прод выполнен
- Stage в `roadmap.md` помечен как `(done)`

**Как перемещать:**
```bash
mv docs/backlog/active/NNN-feature/ docs/backlog/archived/
```
Обновить ссылки в `roadmap.md` (путь `active/` → `archived/`).

**ПРАВИЛО:** При завершении фичи (все шаги плана выполнены, задеплоено) — предложить пользователю переместить в archived.

## Subagents (`.claude/agents/`)

Субагенты — специализированные AI-агенты для конкретных задач. Файлы `.md` с YAML frontmatter.

### Активные агенты

| Агент | Файл | Режим | Когда вызывать |
|-------|------|-------|----------------|
| **frontend-developer** | `.claude/agents/frontend-developer.md` | Субагент (Agent tool) | Frontend-задачи: React компоненты, маршруты, стили, интеграция с API |
| **backend-developer** | `.claude/agents/backend-developer.md` | Субагент (Agent tool) | Backend-задачи: FastAPI endpoints, SQLModel модели, миграции, тесты |
| **devops** | `.claude/agents/devops.md` | Субагент (Agent tool) | Деплой, инфраструктура, CI/CD, Railway, Vercel |
| **designer** | `.claude/agents/designer.md` | **Роль** (основной агент) | UI/UX, брендинг, дизайн-система, brainstorming визуала |
| **implementation-plan-architect** | `.claude/agents/implementation-plan-architect.md` | **Роль** (основной агент) | Планирование фичей, декомпозиция на задачи 1-4h |
| **qa-engineer** | `.claude/agents/qa-engineer.md` | Субагент (Agent tool) | Тестирование, quality gate, pytest + Playwright, баг-репорты |
| **implementation-plan-reviewer** | `.claude/agents/implementation-plan-reviewer.md` | Субагент (Agent tool) | Ревью готовых планов, quality gate |

### Правило вызова

**Субагенты (Agent tool)** — вызывай когда задача попадает в зону ответственности:
- Frontend-задачи из плана → `frontend-developer` (Agent tool, субагент)
- Backend-задачи из плана → `backend-developer` (Agent tool, субагент)
- Деплой на Vercel/Railway → `devops` (Agent tool, субагент)
- Настройка переменных окружения → `devops` (Agent tool, субагент)
- CI/CD, GitHub Actions → `devops` (Agent tool, субагент)
- Мониторинг, домены → `devops` (Agent tool, субагент)
- Тестирование после реализации фичи → `qa-engineer` (Agent tool, субагент)
- Quality gate перед деплоем → `qa-engineer` (Agent tool, субагент)
- Ревью готового плана → `implementation-plan-reviewer` (Agent tool, субагент)

**Роли (основной агент входит в роль)** — для задач требующих интерактивного диалога с пользователем:
- UI/UX дизайн → `designer` (роль)
- Планирование фичи → `implementation-plan-architect` (роль)

### Frontend Developer — субагент

**Вызывается через Agent tool** для реализации frontend-задач из implementation plan:

- React 19 компоненты, hooks
- TanStack Router маршруты
- TanStack Query data fetching
- shadcn/ui + Tailwind CSS 4 стили
- React Hook Form + Zod формы
- Playwright E2E тесты

**Когда вызывать:**
- Задачи из плана с тегом `frontend`
- Новые UI-компоненты, страницы, маршруты
- Интеграция с API (auto-generated client)
- Исправление frontend-багов

### Backend Developer — субагент

**Вызывается через Agent tool** для реализации backend-задач из implementation plan:

- FastAPI endpoints
- SQLModel модели
- Alembic миграции
- pytest тесты
- JWT auth, бизнес-логика

**Объединяет:** core/developer + python-developer из X0 Framework, адаптирован под Python/FastAPI стек проекта.

**Когда вызывать:**
- Задачи из плана с тегом `backend`
- Новые API endpoints, модели, миграции
- Backend тесты (pytest)
- Исправление backend-багов

### QA Engineer — субагент

**Вызывается через Agent tool** для тестирования и обеспечения качества:

- pytest тесты для FastAPI backend
- Playwright E2E тесты для React frontend
- Playwright MCP для интерактивного browser testing
- Bug reporting с шагами воспроизведения
- Regression testing
- Quality gate sign-off перед деплоем

**MCP доступ:** Playwright MCP (`@playwright/mcp`) — browser automation через accessibility snapshots.

**Когда вызывать:**
- После реализации фичи (backend или frontend) — верификация
- Написание/обновление тестов
- Quality gate check перед деплоем
- Regression testing после багфиксов
- Exploratory testing новых UI-фич через Playwright MCP

### Designer — режим РОЛИ (не субагент!)

**⚠️ Designer НЕ вызывается как субагент.** Основной агент входит в роль designer:

1. Прочитай `.claude/agents/designer.md` — прими на себя роль, контекст, принципы
2. Прочитай `docs/design-system.md` — загрузи дизайн-систему
3. Вызови два скилла:
   - `Skill: superpowers:brainstorming` — для интерактивного brainstorming с пользователем
   - `Skill: document-skills:frontend-design` — для Anthropic Design Philosophy
4. Работай интерактивно с пользователем: ASCII-мокапы, вопросы, варианты, обсуждение

**Почему роль, а не субагент:** Designer должен общаться с пользователем в формате brainstorming — задавать вопросы, показывать мокапы, обсуждать варианты. Субагент не может вести диалог.

**Когда входить в роль designer:**
- UI/UX дизайн, визуальные изменения
- Обновление дизайн-системы (`docs/design-system.md`)
- Брендинг, цвета, типографика, layout
- Brainstorming визуальных решений
- Создание UI-компонентов (дизайн-фаза)

### Implementation Plan Architect — режим РОЛИ (не субагент!)

**⚠️ Architect НЕ вызывается как субагент.** Основной агент входит в роль:

1. Прочитай `.claude/agents/implementation-plan-architect.md` — прими роль, контекст, принципы
2. Вызови скилл `superpowers:brainstorming` — для интерактивного исследования требований
3. Исследуй кодовую базу (Grep/Glob) на предмет существующих паттернов
4. Вызови скилл `superpowers:writing-plans` — для создания структурированного плана
5. Вызови `@implementation-plan-reviewer` через Agent tool для ревью плана

**Почему роль, а не субагент:** Architect должен вести диалог с пользователем — уточнять требования, обсуждать trade-offs, согласовывать scope. Субагент не может вести диалог.

**Когда входить в роль architect:**
- Планирование новой фичи
- Декомпозиция крупной задачи на подзадачи
- Создание implementation plan в `docs/backlog/active/`

### Implementation Plan Reviewer — субагент

**Вызывается через Agent tool** когда план готов и нужен ревью:

```
Agent tool → subagent_type: не указывать (general-purpose)
Prompt: "Прочитай .claude/agents/implementation-plan-reviewer.md и выполни ревью плана docs/backlog/active/NNN-feature/plan.md"
```

**Когда вызывать:**
- План фичи написан и готов к ревью
- После доработки плана по предыдущему фидбеку

### Design System

**`docs/design-system.md`** — единый источник правды по визуальному стилю проекта.
- **Владелец:** designer (роль основного агента)
- **Потребители:** frontend-разработчики, planning (для требований)
- **Референсы:** `docs/research/design references/`
- **Скилл:** `document-skills:frontend-design` (Anthropic Design Philosophy)

### Git-операции — ТОЛЬКО через DevOps

**⛔ АБСОЛЮТНЫЙ ЗАПРЕТ:** НЕ выполнять `git commit`, `git push`, `git tag` и любые мутирующие git-команды напрямую из основного контекста.

**ВСЕГДА делегируй DevOps-субагенту** через `Agent tool` с `subagent_type="devops"`:
- Любой коммит (docs, frontend, backend, конфиги — без исключений)
- Любой push
- Создание веток, тегов, PR

**Единственное исключение:** `git status`, `git log`, `git diff` (read-only команды) можно выполнять напрямую для анализа.

**Почему:** DevOps-агент знает конвенции коммитов, проверяет секреты, обновляет `status-process.md`. Единая точка ответственности за git-операции исключает ошибки.

### Добавление нового агента (из X0 Framework или самостоятельно)

Источник X0: `https://github.com/Serg1kk/X0-Framework`

**Шаги:**
1. Скопировать промпт → `.claude/agents/<agent>.md` (добавить frontmatter)
2. Скопировать манифесты → `docs/manifests/agents/<agent>.md` + `.yaml`
3. **ОБЯЗАТЕЛЬНО: Адаптировать под проект** (см. гайд ниже)
4. Обновить таблицу субагентов в этом CLAUDE.md
5. Записать в `status-process.md`

**ПРАВИЛО АДАПТАЦИИ (ОБЯЗАТЕЛЬНО):**

При добавлении ЛЮБОГО нового агента (из X0 Framework, из другого проекта, или созданного с нуля) — **ВСЕГДА адаптируй манифесты под текущий проект:**

1. **Убери несуществующие MCP** — проверь `.mcp.json`, убери ссылки на MCP которых нет
2. **Убери несуществующие docs** — `docs/conventions.md`, `docs/ADR/` и т.д. если их нет
3. **Замени стек** — npm → bun/uv, generic → конкретные команды проекта
4. **Замени примеры** — generic URLs → реальные deployment URLs
5. **Добавь project-specific** — CORS, Railway reference vars, known issues
6. **Обнови metadata** — version, updated_at, adapted_from

**Полный гайд:** `docs/help/agent-manifest-adaptation-guide.md`

Доступные агенты в X0 Framework (core): `developer`, `devops`, `qa-engineer`, `researcher`, `technical-architect`, `implementation-plan-architect`, `implementation-plan-reviewer`, `feature-documentation-writer`

Справочник по frontmatter субагентов: `docs/help/subagent-frontmatter-reference.md`

## Agent Learnings (самоулучшение агентов)

**Путь:** `docs/agent-learnings/<agent-name>/YYYY-MM-DD_short-slug.md`
**Описание системы:** `docs/agent-learnings/README.md`

**ОБЯЗАТЕЛЬНОЕ ПРАВИЛО — для Claude и ВСЕХ субагентов:**

Когда ты или субагент сталкиваетесь с ошибкой, ограничением сервиса или находите неочевидный workaround при работе с инфраструктурой, деплоем, MCP, CLI или внешними сервисами:

1. **Создай файл** в `docs/agent-learnings/<agent-name>/YYYY-MM-DD_slug.md`
2. **Заполни** по формату: frontmatter (date, agent, service, severity, status) + контекст → ошибка → причина → workaround → рекомендация для промпта
3. **Обнови индекс** в `docs/agent-learnings/README.md`

**Severity:** `blocker` (остановил работу), `workaround` (обошли), `insight` (полезное наблюдение)
**Status:** `open` → `resolved` → `incorporated` (промпт обновлён)

**При вызове субагентов** через Agent tool — ПЕРЕДАВАЙ эту инструкцию в prompt:
> Если столкнёшься с ошибкой или ограничением сервиса — создай запись в `docs/agent-learnings/<твоё-имя>/YYYY-MM-DD_slug.md` по формату из `docs/agent-learnings/README.md`.

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

**АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ:** При любом значимом изменении проекта (новая фича, деплой, новый агент, MCP, команда, структурное изменение) — ОБНОВЛЯЙ `status-process.md` автоматически, без запроса пользователя. Добавляй запись в Changelog и обновляй соответствующую секцию (URLs, Agents, Commands, MCP). Этот файл используется для демки и как основной источник истории проекта.
