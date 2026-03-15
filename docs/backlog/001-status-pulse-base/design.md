# StatusPulse - Design Document

**Дата:** 2026-03-15
**Цель:** Проект для live demo на митапе 17 марта - показать pipeline от задачи до фичи

---

## Архитектура

**Проект:** StatusPulse - простой self-hosted status page / uptime monitor

**Стек:**
- **Backend:** Python, FastAPI + SQLAlchemy + Alembic (миграции) + PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **Деплой:** Vercel (фронт) + Railway (бэк + БД)

**Два режима:**
- **Публичная страница** (`/`) - статусы сервисов, графики аптайма, инциденты. Без auth
- **Админка** (`/admin`) - управление сервисами, инцидентами. Простая auth: логин/пароль из env (`ADMIN_USER`, `ADMIN_PASSWORD`), JWT-токен в localStorage

**Фоновый процесс:**
- Background task пингует URL сервисов раз в 1-3 минуты
- Записывает результат (status code, response time) в БД
- При падении автоматически создаёт инцидент
- При восстановлении - автоматически resolved

**Основа:** форк Full Stack FastAPI Template (github.com/fastapi/full-stack-fastapi-template)

---

## Модели данных

### Базовый проект (до демо)

```
Service
├── id (UUID)
├── name (str) - "API Gateway", "Auth Service"
├── url (str) - URL для пинга
├── category (str) - "Backend", "Frontend", "Infrastructure"
├── check_interval (int) - секунды между проверками (default: 60)
├── created_at (datetime)
└── current_status (enum: operational / degraded / down)

HealthCheck
├── id (UUID)
├── service_id (FK -> Service)
├── status_code (int)
├── response_time_ms (int)
├── is_healthy (bool)
└── checked_at (datetime)

Incident
├── id (UUID)
├── service_id (FK -> Service)
├── title (str)
├── status (enum: investigating / identified / monitoring / resolved)
├── created_at (datetime)
└── resolved_at (datetime, nullable)
```

### Фича для демо (добавляется live)

```
IncidentUpdate
├── id (UUID)
├── incident_id (FK -> Incident)
├── message (str) - "Разобрались, проблема в DNS"
├── status (enum) - новый статус инцидента на момент update
├── created_at (datetime)
```

---

## Frontend

### Публичная страница (`/`)
- Хедер с названием и общим статусом ("All Systems Operational" / "Partial Outage")
- Список сервисов по категориям, у каждого: имя, статус (зелёный/жёлтый/красный), response time
- График аптайма за 7/30 дней - горизонтальные полоски (как у GitHub Status)
- Список активных инцидентов внизу

### Админка (`/admin`)
- Логин-форма (логин/пароль из env)
- CRUD сервисов: добавить/редактировать/удалить
- CRUD инцидентов: создать вручную, сменить статус, resolve
- (после демо-фичи) Добавление updates к инциденту с таймлайном

### Стиль
- Минималистичный
- Tailwind CSS

---

## Инциденты - логика

**Автоматические:**
- Чекер пингует сервис -> нет ответа -> создаёт инцидент (status: investigating)
- Сервис снова отвечает -> инцидент resolved автоматически

**Ручные:**
- Админ создаёт инцидент через админку (плановые работы, замедление)

**Фича (IncidentUpdate):**
- До фичи: инцидент = одна строчка с title и статусом, статус перезаписывается
- После фичи: админ добавляет updates с сообщениями, каждый update сохраняется, на публичной странице - таймлайн истории инцидента

---

## Фича для Live Demo

**"Комментарии к инцидентам" (IncidentUpdate)**

Что затрагивает:
1. **БД:** новая таблица `incident_updates`, миграция
2. **Backend:** CRUD эндпоинты для updates, обновление статуса инцидента при добавлении update
3. **Frontend:** таймлайн обновлений на странице инцидента (публичная) + форма добавления update (админка)

Контраст "до/после": инцидент превращается из одной строчки в полноценную историю с таймлайном.

---

## Деплой

- **Frontend:** Vercel (React + Vite)
- **Backend:** Railway (FastAPI)
- **БД:** Railway PostgreSQL (или Vercel Postgres)
- **MCP:** Vercel CLI MCP + Railway CLI MCP для деплоя через агентов
