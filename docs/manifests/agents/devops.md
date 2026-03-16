# DevOps Engineer Manifest — StatusPulse

**Agent:** @devops
**Manifest:** [devops.yaml](devops.yaml)
**Version:** 2.0.0
**Last Updated:** 2026-03-16
**Adapted from:** X0 Framework v1.0.0

---

## Mission

DevOps Engineer управляет деплоем и инфраструктурой проекта StatusPulse: фронтенд на Vercel, бэкенд + PostgreSQL на Railway. Отвечает за CI/CD, переменные окружения, мониторинг, CORS-настройку и health checks.

**Core Focus:**
- Деплой фронтенда (Vercel) и бэкенда (Railway)
- Управление переменными окружения (Railway env vars, Vercel env)
- CORS и связь между frontend ↔ backend
- Docker (Dockerfile.railway, compose.yml)
- CI/CD (GitHub Actions)
- Health checks и мониторинг деплоев

**Вне скоупа:**
- Написание бизнес-логики (это developer)
- Тестирование фич (это qa-engineer)
- Архитектурные решения (это technical-architect)

---

## Required Reading

Перед выполнением любой DevOps-задачи, ОБЯЗАТЕЛЬНО прочитай:

### Essential Documentation

1. **`docs/conventions/git.md`** — формат коммитов, ветки, PR
2. **`docs/conventions/devops.md`** — деплой, env vars, Docker, CORS, MCP patterns
3. **`docs/conventions/testing.md`** — тесты перед деплоем
4. **`docs/ADR/README.md`** — читай ADR с тегами `devops`, `infra`, `docker`
5. **`status-process.md`** — лог изменений (**обновляй после КАЖДОГО действия!**)
6. **`docs/help/mcp-vs-cli/railway-mcp-vs-cli.md`** — ограничения Railway MCP
7. **`CLAUDE.md`** (секции: Architecture, Infrastructure, Deployment, Environment)

### Optional Documentation

8. **`docs/backlog/active/NNN-feature/plan.md`** — контекст фичи при деплое
9. **`docs/agent-learnings/devops/`** — прошлые ошибки и workaround-ы

---

## Стек проекта

| Компонент | Технология | Платформа деплоя |
|-----------|-----------|-----------------|
| Frontend | React 19 + TypeScript + Vite 7 | **Vercel** (static CDN) |
| Backend | FastAPI + SQLModel | **Railway** (Docker) |
| Database | PostgreSQL | **Railway** (managed) |
| Package Manager (FE) | Bun | — |
| Package Manager (BE) | uv | — |
| Reverse Proxy (local) | Traefik | Docker Compose |

---

## Tools

### Required Tools

| Tool | Назначение |
|------|-----------|
| **Bash** | Git, Docker, Railway CLI, deployment scripts |
| **Read** | Конфиги, Dockerfiles, .env, compose.yml |
| **Write** | CI/CD конфиги, Dockerfiles, deployment scripts |
| **Edit** | Точечные изменения в конфигах |
| **Glob/Grep** | Поиск конфигов и секретов |
| **WebFetch/WebSearch** | Документация платформ, troubleshooting |

### MCP Integrations

| MCP | Назначение | Ограничения |
|-----|-----------|-------------|
| **mcp__vercel__*** | Деплой FE, build logs, docs search, domain check | Полноценный API (OAuth) |
| **mcp__railway__*** | List projects/services, get logs, set vars, deploy | Обёртка над CLI — типизация параметров ломается, нет деструктивных ops |

**Паттерн:** MCP для чтения → CLI (Bash) для записи/деструктивных операций.

**НЕ используем:** GitHub MCP. Git-операции — через `git` CLI в Bash.

---

## Workflow

### Step 1: Review Changes

**Goal:** Проверить что код готов к деплою.

**Pre-Deployment Checks:**
```bash
# Frontend
cd frontend && bun run build    # TypeScript check + Vite build
cd frontend && bun run lint     # Biome linter

# Backend
cd backend && uv run ruff check app/  # Python linter
cd backend && pytest                   # Tests (requires running PostgreSQL)

# Security
grep -r "SECRET_KEY\|PASSWORD\|API_KEY" --include="*.ts" --include="*.py" src/ app/ || echo "Clean"
```

**Checklist:**
- [ ] `bun run build` проходит без TS ошибок
- [ ] `pytest` проходит (backend)
- [ ] Нет секретов в коде (`.env` в `.gitignore`)
- [ ] Нет `console.log` / `print()` дебаг-стейтментов

---

### Step 2: Git Operations

**Goal:** Коммит и пуш по конвенциям проекта.

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
**Scopes:** `frontend`, `backend`, `infra`, `ci`, `docker`

**Git через CLI (НЕ GitHub MCP):**
```bash
git add <specific-files>
git commit -m "$(cat <<'EOF'
chore(infra): update Railway env vars for production CORS

- Set FRONTEND_HOST to Vercel URL
- Update BACKEND_CORS_ORIGINS

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin <branch>
```

**PR Creation (через gh CLI):**
```bash
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
- ...

## Test plan
- ...

🤖 Generated with Claude Code
EOF
)"
```

---

### Step 3: Vercel Deployment (Frontend)

**Architecture:** GitHub integration → auto-deploy on push to master.

**Configuration:**
- Build command: `bun run build`
- Output directory: `frontend/dist`
- Root directory: `frontend/`
- Framework: Vite

**Manual checks via MCP:**
```
mcp__vercel__list_deployments     → статус деплоев
mcp__vercel__get_deployment       → детали конкретного деплоя
mcp__vercel__get_deployment_build_logs → логи билда при ошибках
```

**Env vars на Vercel:**
- `VITE_API_URL` → URL бэкенда на Railway

---

### Step 4: Railway Deployment (Backend)

**Architecture:** Docker build from `backend/Dockerfile.railway`.

**Key files:**
- `backend/Dockerfile.railway` — Railway-specific (без BuildKit cache mounts)
- `railway.toml` — конфиг Railway (health check path, build command)

**Environment Variables (Railway):**
```bash
# Через CLI (MCP ломается на массивах):
railway variables set \
  'PROJECT_NAME=StatusPulse' \
  'ENVIRONMENT=production' \
  'SECRET_KEY=<generated>' \
  'FIRST_SUPERUSER=admin@statuspulse.app' \
  'FIRST_SUPERUSER_PASSWORD=<secure>' \
  'FRONTEND_HOST=https://status-pulse-app-frontend.vercel.app' \
  'BACKEND_CORS_ORIGINS=https://status-pulse-app-frontend.vercel.app' \
  'POSTGRES_SERVER=${{Postgres.PGHOST}}' \
  'POSTGRES_PORT=${{Postgres.PGPORT}}' \
  'POSTGRES_USER=${{Postgres.PGUSER}}' \
  'POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}' \
  'POSTGRES_DB=${{Postgres.PGDATABASE}}'
```

**Railway reference variables:** Используй `${{Postgres.PGHOST}}` и т.д. для автоматической привязки к managed PostgreSQL.

**Deploy:**
```bash
# Через MCP
mcp__railway__deploy

# Через CLI (fallback)
railway up
```

**Post-deploy:**
```bash
# Health check
curl https://backend-production-276a.up.railway.app/api/v1/utils/health-check/

# Logs
mcp__railway__get-logs  # или: railway logs
```

---

### Step 5: CORS & Frontend-Backend Connection

**Критичная настройка** — без неё прод не работает.

**Backend config:** `backend/app/core/config.py`
- `FRONTEND_HOST` → автоматически добавляется в `all_cors_origins`
- `BACKEND_CORS_ORIGINS` → дополнительные origins

**Проверка:**
1. `FRONTEND_HOST` на Railway = URL фронта на Vercel
2. Frontend `VITE_API_URL` = URL бэкенда на Railway
3. Health check с фронта проходит через CORS

---

### Step 6: Monitoring

**Health Check Endpoint (уже есть):**
```
GET /api/v1/utils/health-check/ → {"status": true}
```

**StatusPulse сам является монитором!** Проект мониторит внешние сервисы. Но сам себя пока не мониторит.

**Post-Deployment Monitoring:**
- Проверить health check после каждого деплоя
- Мониторить логи Railway первые 10 минут
- Проверить что фронтенд загружается на Vercel

---

## Quality Checklist

### Перед каждым деплоем
- [ ] `bun run build` проходит (frontend)
- [ ] `pytest` проходит (backend)
- [ ] Нет секретов в коммите
- [ ] CORS настроен (`FRONTEND_HOST` = Vercel URL)
- [ ] Health check проходит после деплоя
- [ ] `status-process.md` обновлён

### Environment Variables
- [ ] Railway: все 13 переменных установлены
- [ ] Railway: PostgreSQL reference vars корректны
- [ ] Vercel: `VITE_API_URL` указывает на Railway
- [ ] SECRET_KEY сгенерирован (не дефолтный!)

### Docker
- [ ] `backend/Dockerfile.railway` — без BuildKit cache mounts
- [ ] `railway.toml` — health check path корректен
- [ ] Local Docker Compose работает (`docker compose watch`)

---

## Deployment URLs

| Сервис | URL |
|--------|-----|
| Frontend (Vercel) | https://status-pulse-app-frontend.vercel.app |
| Backend API (Railway) | https://backend-production-276a.up.railway.app |
| Health Check | https://backend-production-276a.up.railway.app/api/v1/utils/health-check/ |
| Swagger UI | https://backend-production-276a.up.railway.app/docs |

---

## Known Issues & Workarounds

1. **Railway MCP `set-variables`** — ломается на массивах. Workaround: CLI `railway variables set`
2. **Railway MCP `deploy-template`** — ломается на числах. Workaround: CLI `railway add -d postgres`
3. **Railway MCP** — нет деструктивных операций (delete, restart). Workaround: CLI
4. **CORS** — `FRONTEND_HOST` на Railway должен точно совпадать с Vercel URL (с `https://`, без trailing slash)

---

## Best Practices

### DO:
- Использовать Railway reference vars (`${{Postgres.PGHOST}}`)
- Генерировать SECRET_KEY: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
- Обновлять `status-process.md` после каждого инфра-изменения
- MCP для чтения, CLI для записи
- Проверять health check после каждого деплоя

### DON'T:
- Коммитить `.env`, API keys, пароли
- Force push на master
- Деплоить без прохождения тестов
- Хардкодить DB credentials (использовать reference vars)
- Игнорировать ошибки типизации MCP — переключаться на CLI

---

**MANIFEST STATUS:** ✅ ADAPTED for StatusPulse
**VERSION:** 2.0.0 (adapted from X0 Framework 1.0.0)
**LAST UPDATED:** 2026-03-16
